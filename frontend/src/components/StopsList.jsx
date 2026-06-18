const STOP_STYLE = {
  start:   { color: "#22c55e", label: "Start",       letter: "S" },
  pickup:  { color: "#3b82f6", label: "Pickup",      letter: "P" },
  dropoff: { color: "#ef4444", label: "Drop-off",    letter: "D" },
  fuel:    { color: "#f97316", label: "Fuel stop",   letter: "F" },
  rest:    { color: "#8b5cf6", label: "10h Rest",    letter: "R" },
  break:   { color: "#06b6d4", label: "30m Break",   letter: "B" },
  restart: { color: "#8b5cf6", label: "34h Restart", letter: "34" },
};

function fmtClock(hourOfTrip) {
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
        <span className="subtle">{stops.length} stops</span>
      </div>
      <ul className="stops">
        {stops.map((stop, i) => {
          const s = STOP_STYLE[stop.type] || STOP_STYLE.break;
          return (
            <li className="stop-row" key={`${stop.type}-${i}`}>
              <span className="stop-badge" style={{ background: s.color }}>{s.letter}</span>
              <div className="stop-main">
                <div className="stop-label">{stop.label}</div>
                <div className="stop-type">{s.label}</div>
              </div>
              <div className="stop-meta">
                Mile {stop.miles.toLocaleString()}
                <br />
                <span className="stop-day">Day {stop.day} · {fmtClock(stop.arrive_hour)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
