function fmtHours(h) {
  if (h == null) return "—";
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export default function Summary({ summary, locations }) {
  if (!summary) return null;
  const stats = [
    { label: "Distance", value: `${summary.total_distance_miles.toLocaleString()} mi` },
    { label: "Drive time", value: fmtHours(summary.total_drive_hours) },
    { label: "Trip duration", value: fmtHours(summary.total_duration_hours) },
    { label: "Days", value: summary.num_days },
    { label: "Fuel stops", value: summary.num_fuel_stops },
    { label: "10h rests", value: summary.num_rests },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h2>Trip Summary</h2>
        <span className="subtle">
          Cycle: {summary.cycle_used_start}h → {summary.cycle_used_end}h / 70h
        </span>
      </div>
      {locations && (
        <div
          style={{
            padding: "12px 20px",
            fontSize: "0.84rem",
            color: "#475569",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            alignItems: "center",
          }}
        >
          <span style={{ color: "var(--stop-start)", fontWeight: 700 }}>●</span>
          <span>{locations.current.name.split(",").slice(0, 2).join(",")}</span>
          <span style={{ color: "#94a3b8" }}>→</span>
          <span style={{ color: "var(--stop-pickup)", fontWeight: 700 }}>●</span>
          <span>{locations.pickup.name.split(",").slice(0, 2).join(",")}</span>
          <span style={{ color: "#94a3b8" }}>→</span>
          <span style={{ color: "var(--stop-dropoff)", fontWeight: 700 }}>●</span>
          <span>{locations.dropoff.name.split(",").slice(0, 2).join(",")}</span>
        </div>
      )}
      <div className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="value">{s.value}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
