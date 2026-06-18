function fmtHours(h) {
  if (h == null) return "—";
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function fmtName(name) {
  if (!name) return "";
  return name.split(",").slice(0, 2).join(",").trim();
}

const STATS = [
  {
    key: "distance",
    label: "Distance",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <polyline points="8 7 3 12 8 17"/>
        <polyline points="16 7 21 12 16 17"/>
      </svg>
    ),
    bg: "rgba(59,130,246,0.1)", color: "#3b82f6",
    format: (s) => `${s.total_distance_miles.toLocaleString()} mi`,
  },
  {
    key: "drive",
    label: "Drive Time",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    bg: "rgba(249,115,22,0.1)", color: "var(--amber)",
    format: (s) => fmtHours(s.total_drive_hours),
  },
  {
    key: "duration",
    label: "Trip Duration",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    bg: "rgba(139,92,246,0.1)", color: "#8b5cf6",
    format: (s) => fmtHours(s.total_duration_hours),
  },
  {
    key: "days",
    label: "Days on Road",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
    bg: "rgba(34,197,94,0.1)", color: "#22c55e",
    format: (s) => `${s.num_days}`,
  },
  {
    key: "fuel",
    label: "Fuel Stops",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 22V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v15"/>
        <path d="M3 11h12"/>
        <path d="M15 7h2l2 2v5h-4"/>
      </svg>
    ),
    bg: "rgba(249,115,22,0.1)", color: "var(--amber)",
    format: (s) => `${s.num_fuel_stops}`,
  },
  {
    key: "cycle",
    label: "Cycle Used",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
    ),
    bg: "rgba(239,68,68,0.1)", color: "#ef4444",
    format: (s) => `${s.cycle_used_end}h`,
  },
];

export default function Summary({ summary, locations }) {
  if (!summary) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h2>Trip Summary</h2>
        <span className="subtle">
          Cycle: {summary.cycle_used_start}h → {summary.cycle_used_end}h / 70h
        </span>
      </div>

      {locations && (
        <div className="route-path-bar">
          <span className="route-node">
            <span style={{ color: "var(--stop-start)", fontSize: "0.65rem" }}>●</span>
            {fmtName(locations.current.name)}
          </span>
          <span className="route-arrow">▶</span>
          <span className="route-node">
            <span style={{ color: "var(--stop-pickup)", fontSize: "0.65rem" }}>●</span>
            {fmtName(locations.pickup.name)}
          </span>
          <span className="route-arrow">▶</span>
          <span className="route-node">
            <span style={{ color: "var(--stop-dropoff)", fontSize: "0.65rem" }}>●</span>
            {fmtName(locations.dropoff.name)}
          </span>
        </div>
      )}

      <div className="stats-grid">
        {STATS.map((s) => (
          <div className="stat-cell" key={s.key}>
            <div className="stat-icon" style={{ background: s.bg }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="stat-value">{s.format(summary)}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
