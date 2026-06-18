# Simulates FMCSA hours-of-service for a property-carrying driver (70hr/8day).
from __future__ import annotations

import math
from dataclasses import dataclass, field

OFF_DUTY = "off_duty"
SLEEPER = "sleeper_berth"
DRIVING = "driving"
ON_DUTY = "on_duty"

STATUS_LABELS = {
    OFF_DUTY: "Off Duty",
    SLEEPER: "Sleeper Berth",
    DRIVING: "Driving",
    ON_DUTY: "On Duty (not driving)",
}

MAX_DRIVE_PER_DAY = 11.0
MAX_DUTY_WINDOW = 14.0
BREAK_AFTER_DRIVING = 8.0
BREAK_DURATION = 0.5
DAILY_REST = 10.0
CYCLE_LIMIT = 70.0
CYCLE_RESTART = 34.0
FUEL_INTERVAL_MILES = 1000.0
FUEL_DURATION = 0.5
PICKUP_DURATION = 1.0
DROPOFF_DURATION = 1.0

START_HOUR = 8.0
EPS = 1e-6


def _haversine_miles(a: list[float], b: list[float]) -> float:
    lat1, lon1 = math.radians(a[0]), math.radians(a[1])
    lat2, lon2 = math.radians(b[0]), math.radians(b[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 3958.8 * 2 * math.asin(min(1.0, math.sqrt(h)))


@dataclass
class _GeometryIndex:
    points: list[list[float]]
    cumulative: list[float] = field(default_factory=list)
    total: float = 0.0

    def __post_init__(self):
        self.cumulative = [0.0]
        for i in range(1, len(self.points)):
            d = _haversine_miles(self.points[i - 1], self.points[i])
            self.cumulative.append(self.cumulative[-1] + d)
        self.total = self.cumulative[-1] if self.cumulative else 0.0

    def point_at_fraction(self, fraction: float) -> list[float]:
        if not self.points:
            return [0.0, 0.0]
        if len(self.points) == 1 or self.total <= 0:
            return self.points[0]
        fraction = max(0.0, min(1.0, fraction))
        target = fraction * self.total
        for i in range(1, len(self.cumulative)):
            if self.cumulative[i] >= target:
                seg = self.cumulative[i] - self.cumulative[i - 1]
                t = 0.0 if seg <= 0 else (target - self.cumulative[i - 1]) / seg
                p0, p1 = self.points[i - 1], self.points[i]
                return [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]
        return self.points[-1]


class TripSimulator:
    def __init__(self, legs, geometry, total_miles, current_cycle_used):
        self.legs = legs
        self.total_miles = max(total_miles, 0.0)
        self.geo = _GeometryIndex(points=geometry)
        self.current_cycle_used = max(0.0, float(current_cycle_used))

        self.t = START_HOUR
        self.driving_today = 0.0
        self.driving_since_break = 0.0
        self.window_start = START_HOUR
        self.cycle_used = self.current_cycle_used
        self.miles_since_fuel = 0.0
        self.miles_done = 0.0

        self.events: list[dict] = []
        self.stops: list[dict] = []

    def _advance(self, status, hours, label=None):
        if hours <= EPS:
            return
        self.events.append(
            {"status": status, "start": self.t, "end": self.t + hours, "label": label}
        )
        self.t += hours
        if status == DRIVING:
            self.cycle_used += hours
        elif status == ON_DUTY:
            self.cycle_used += hours

    def _add_stop(self, stop_type, label, at_miles):
        fraction = 0.0 if self.total_miles <= 0 else at_miles / self.total_miles
        lat, lon = self.geo.point_at_fraction(fraction)
        self.stops.append(
            {
                "type": stop_type,
                "label": label,
                "miles": round(at_miles, 1),
                "lat": lat,
                "lon": lon,
                "arrive_hour": round(self.t, 2),
                "day": int(self.t // 24) + 1,
            }
        )

    def _take_break(self):
        self._advance(OFF_DUTY, BREAK_DURATION, label="30-min break")
        self._add_stop("break", "30-minute break", self.miles_done)
        self.driving_since_break = 0.0

    def _daily_rest(self):
        self._add_stop("rest", "10-hour rest", self.miles_done)
        self._advance(SLEEPER, DAILY_REST, label="10-hour rest")
        self.driving_today = 0.0
        self.driving_since_break = 0.0
        self.window_start = self.t

    def _restart_cycle(self):
        self._add_stop("restart", "34-hour restart", self.miles_done)
        self._advance(OFF_DUTY, CYCLE_RESTART, label="34-hour restart")
        self.cycle_used = 0.0
        self.driving_today = 0.0
        self.driving_since_break = 0.0
        self.window_start = self.t

    def _fuel_stop(self):
        self._add_stop("fuel", "Fuel stop", self.miles_done)
        self._advance(ON_DUTY, FUEL_DURATION, label="Fuel stop")
        self.miles_since_fuel = 0.0

    def _on_duty_event(self, duration, label, stop_type, at_miles):
        if self.cycle_used + duration > CYCLE_LIMIT:
            self._restart_cycle()
        if self.t + duration > self.window_start + MAX_DUTY_WINDOW:
            self._daily_rest()
        self._add_stop(stop_type, label, at_miles)
        self._advance(ON_DUTY, duration, label=label)

    def _drive(self, miles, hours):
        if miles <= EPS or hours <= EPS:
            return
        speed = miles / hours
        remaining_h = hours
        guard = 0
        while remaining_h > EPS:
            guard += 1
            if guard > 100000:
                break
            if self.cycle_used >= CYCLE_LIMIT - EPS:
                self._restart_cycle()
                continue
            if (
                self.driving_today >= MAX_DRIVE_PER_DAY - EPS
                or self.t >= self.window_start + MAX_DUTY_WINDOW - EPS
            ):
                self._daily_rest()
                continue
            if self.driving_since_break >= BREAK_AFTER_DRIVING - EPS:
                self._take_break()
                continue
            if self.miles_since_fuel >= FUEL_INTERVAL_MILES - EPS:
                self._fuel_stop()
                continue

            chunk = min(
                remaining_h,
                BREAK_AFTER_DRIVING - self.driving_since_break,
                MAX_DRIVE_PER_DAY - self.driving_today,
                self.window_start + MAX_DUTY_WINDOW - self.t,
                CYCLE_LIMIT - self.cycle_used,
                (FUEL_INTERVAL_MILES - self.miles_since_fuel) / speed,
            )
            if chunk <= EPS:
                continue
            self._advance(DRIVING, chunk, label="Driving")
            miles_chunk = chunk * speed
            self.driving_today += chunk
            self.driving_since_break += chunk
            self.miles_since_fuel += miles_chunk
            self.miles_done += miles_chunk
            remaining_h -= chunk

    def run(self) -> dict:
        self._add_stop("start", "Trip start (current location)", 0.0)

        leg1 = self.legs[0] if len(self.legs) > 0 else {"distance_miles": 0, "duration_hours": 0}
        leg2 = self.legs[1] if len(self.legs) > 1 else {"distance_miles": 0, "duration_hours": 0}

        self._drive(leg1["distance_miles"], leg1["duration_hours"])
        self._on_duty_event(PICKUP_DURATION, "Pickup (1h on duty)", "pickup", self.miles_done)
        self._drive(leg2["distance_miles"], leg2["duration_hours"])
        self._on_duty_event(DROPOFF_DURATION, "Dropoff (1h on duty)", "dropoff", self.miles_done)

        return {
            "stops": self.stops,
            "daily_logs": self._build_daily_logs(),
            "summary": self._build_summary(),
        }

    def _build_daily_logs(self) -> list[dict]:
        if not self.events:
            return []
        end_t = self.events[-1]["end"]
        total_days = int(math.ceil(end_t / 24.0))
        logs = []
        for day in range(total_days):
            day_start = day * 24.0
            day_end = day_start + 24.0
            segments = []
            for ev in self.events:
                s = max(ev["start"], day_start)
                e = min(ev["end"], day_end)
                if e - s <= EPS:
                    continue
                segments.append(
                    {
                        "status": ev["status"],
                        "start": round(s - day_start, 4),
                        "end": round(e - day_start, 4),
                        "label": ev.get("label"),
                    }
                )
            segments = self._fill_off_duty(segments)
            totals = self._segment_totals(segments)
            logs.append(
                {
                    "day": day + 1,
                    "segments": segments,
                    "totals": totals,
                    "total_miles_day": None,
                }
            )
        return logs

    @staticmethod
    def _fill_off_duty(segments) -> list[dict]:
        segments = sorted(segments, key=lambda s: s["start"])
        filled = []
        cursor = 0.0
        for seg in segments:
            if seg["start"] - cursor > EPS:
                filled.append(
                    {"status": OFF_DUTY, "start": round(cursor, 4),
                     "end": round(seg["start"], 4), "label": None}
                )
            filled.append(seg)
            cursor = seg["end"]
        if 24.0 - cursor > EPS:
            filled.append(
                {"status": OFF_DUTY, "start": round(cursor, 4), "end": 24.0, "label": None}
            )
        merged = []
        for seg in filled:
            if merged and merged[-1]["status"] == seg["status"] and \
                    abs(merged[-1]["end"] - seg["start"]) <= EPS and seg.get("label") is None:
                merged[-1]["end"] = seg["end"]
            else:
                merged.append(dict(seg))
        return merged

    @staticmethod
    def _segment_totals(segments) -> dict:
        totals = {OFF_DUTY: 0.0, SLEEPER: 0.0, DRIVING: 0.0, ON_DUTY: 0.0}
        for seg in segments:
            totals[seg["status"]] += seg["end"] - seg["start"]
        return {k: round(v, 2) for k, v in totals.items()}

    def _build_summary(self) -> dict:
        end_t = self.events[-1]["end"] if self.events else START_HOUR
        drive_hours = sum(
            ev["end"] - ev["start"] for ev in self.events if ev["status"] == DRIVING
        )
        on_duty_hours = sum(
            ev["end"] - ev["start"] for ev in self.events if ev["status"] == ON_DUTY
        )
        return {
            "total_distance_miles": round(self.total_miles, 1),
            "total_drive_hours": round(drive_hours, 2),
            "total_on_duty_hours": round(on_duty_hours, 2),
            "total_duration_hours": round(end_t - START_HOUR, 2),
            "num_days": int(math.ceil(end_t / 24.0)),
            "num_fuel_stops": sum(1 for s in self.stops if s["type"] == "fuel"),
            "num_rests": sum(1 for s in self.stops if s["type"] == "rest"),
            "cycle_used_start": round(self.current_cycle_used, 2),
            "cycle_used_end": round(self.cycle_used, 2),
        }


def simulate_trip(legs, geometry, total_miles, current_cycle_used) -> dict:
    return TripSimulator(legs, geometry, total_miles, current_cycle_used).run()
