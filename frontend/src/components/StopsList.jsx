const STOP_STYLE = {
  start: { color: "#16a34a", label: "Start", letter: "S" },
  pickup: { color: "#2563eb", label: "Pickup", letter: "P" },
  dropoff: { color: "#dc2626", label: "Drop-off", letter: "D" },
  fuel: { color: "#f59e0b", label: "Fuel", letter: "F" },
  rest: { color: "#6366f1", label: "10h Rest", letter: "R" },
  break: { color: "#0ea5e9", label: "30m Break", letter: "B" },
  restart: { color: "#8b5cf6", label: "34h Restart", letter: "34" },
};

function fmtClock(hourOfTrip) {
  // hour is absolute hours from midnight of day 1.
  const within = ((hourOfTrip % 24) + 24) % 24;
  const h = Math.floor(within);
  const m = Math.round((within - h) * 60);
  const hh = String(h).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function StopsList({ stops }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Stops &amp; Rests Schedule</h2>
      </div>
      <ul className="stops">
        {stops.map((stop, i) => {
          const s = STOP_STYLE[stop.type] || STOP_STYLE.break;
          return (
            <li className="stop-row" key={`${stop.type}-${i}`}>
              <span className="stop-badge" style={{ background: s.color }}>
                {s.letter}
              </span>
              <div className="stop-main">
                <div style={{ fontWeight: 600 }}>{stop.label}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  {s.label}
                </div>
              </div>
              <div className="stop-meta">
                Mile {stop.miles.toLocaleString()}
                <br />
                Day {stop.day} · {fmtClock(stop.arrive_hour)}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
