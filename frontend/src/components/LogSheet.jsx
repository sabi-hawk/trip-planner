const ROWS = [
  { key: "off_duty",      label: "1. Off Duty",             color: "#94a3b8" },
  { key: "sleeper_berth", label: "2. Sleeper Berth",        color: "#8b5cf6" },
  { key: "driving",       label: "3. Driving",              color: "#3b82f6" },
  { key: "on_duty",       label: "4. On Duty (not driving)", color: "#f97316" },
];

const ROW_INDEX = {
  off_duty: 0,
  sleeper_berth: 1,
  driving: 2,
  on_duty: 3,
};

const GRID_LEFT = 150;
const GRID_TOP = 44;
const ROW_H = 30;
const GRID_W = 648;
const TOTAL_X = GRID_LEFT + GRID_W;
const WIDTH = GRID_LEFT + GRID_W + 84;
const HEIGHT = GRID_TOP + ROWS.length * ROW_H + 18;

function xForHour(h) {
  return GRID_LEFT + (h / 24) * GRID_W;
}
function rowY(idx) {
  return GRID_TOP + idx * ROW_H + ROW_H / 2;
}
function hourLabel(i) {
  const h = i % 12 === 0 ? 12 : i % 12;
  return h;
}
function fmtTotal(h) {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins ? `${hrs}:${String(mins).padStart(2, "0")}` : `${hrs}:00`;
}

export default function LogSheet({ log, totalDays }) {
  const segments = log.segments || [];

  const horizontals = segments.map((seg, i) => {
    const idx = ROW_INDEX[seg.status];
    const row = ROWS[idx];
    return (
      <line
        key={`h-${i}`}
        x1={xForHour(seg.start)}
        y1={rowY(idx)}
        x2={xForHour(seg.end)}
        y2={rowY(idx)}
        stroke={row.color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    );
  });

  const verticals = [];
  for (let i = 1; i < segments.length; i++) {
    const prev = ROW_INDEX[segments[i - 1].status];
    const cur = ROW_INDEX[segments[i].status];
    if (prev !== cur) {
      const x = xForHour(segments[i].start);
      verticals.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={rowY(prev)}
          x2={x}
          y2={rowY(cur)}
          stroke="#334155"
          strokeWidth="2"
        />
      );
    }
  }

  const hourLines = [];
  for (let i = 0; i <= 24; i++) {
    const x = xForHour(i);
    hourLines.push(
      <line
        key={`hl-${i}`}
        x1={x}
        y1={GRID_TOP}
        x2={x}
        y2={GRID_TOP + ROWS.length * ROW_H}
        stroke="#cbd5e1"
        strokeWidth={i % 6 === 0 ? 1.1 : 0.6}
      />
    );
    hourLines.push(
      <text
        key={`hlt-${i}`}
        x={x}
        y={GRID_TOP - 18}
        textAnchor="middle"
        fontSize="9"
        fill="#475569"
        fontWeight="600"
      >
        {hourLabel(i)}
      </text>
    );
    if (i < 24) {
      for (let q = 1; q < 4; q++) {
        const qx = xForHour(i + q / 4);
        ROWS.forEach((_, ri) => {
          const yc = GRID_TOP + ri * ROW_H;
          hourLines.push(
            <line
              key={`qt-${i}-${q}-${ri}`}
              x1={qx}
              y1={yc}
              x2={qx}
              y2={yc + (q === 2 ? 6 : 3)}
              stroke="#e2e8f0"
              strokeWidth="0.6"
            />
          );
        });
      }
    }
  }

  return (
    <div className="card log-sheet">
      <div className="card-header">
        <h2>
          Daily Log — Day {log.day}
          <span
            style={{
              color: "var(--text-muted)",
              fontWeight: 400,
              fontSize: "0.82rem",
            }}
          >
            {" "}
            of {totalDays}
          </span>
        </h2>
        <span className="subtle">24-hour grid (midnight → midnight)</span>
      </div>

      <svg
        className="log-grid-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Daily log grid for day ${log.day}`}
      >
        <text x={8} y={GRID_TOP - 18} fontSize="9" fill="#94a3b8" fontWeight="700">
          MID
        </text>
        <text
          x={TOTAL_X + 42}
          y={GRID_TOP - 18}
          textAnchor="middle"
          fontSize="9"
          fill="#475569"
          fontWeight="700"
        >
          Total
        </text>

        {ROWS.map((row, idx) => (
          <g key={row.key}>
            <rect
              x={GRID_LEFT}
              y={GRID_TOP + idx * ROW_H}
              width={GRID_W}
              height={ROW_H}
              fill={idx % 2 === 0 ? "#ffffff" : "#f8fafc"}
            />
            <line
              x1={GRID_LEFT}
              y1={GRID_TOP + idx * ROW_H}
              x2={TOTAL_X}
              y2={GRID_TOP + idx * ROW_H}
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
            <text
              x={GRID_LEFT - 8}
              y={rowY(idx) + 3}
              textAnchor="end"
              fontSize="9.5"
              fill="#334155"
              fontWeight="600"
            >
              {row.label}
            </text>
            <text
              x={TOTAL_X + 42}
              y={rowY(idx) + 4}
              textAnchor="middle"
              fontSize="11"
              fill={row.color}
              fontWeight="700"
            >
              {fmtTotal(log.totals[row.key] || 0)}
            </text>
          </g>
        ))}

        <line
          x1={GRID_LEFT}
          y1={GRID_TOP + ROWS.length * ROW_H}
          x2={TOTAL_X}
          y2={GRID_TOP + ROWS.length * ROW_H}
          stroke="#94a3b8"
          strokeWidth="1"
        />
        <line
          x1={TOTAL_X}
          y1={GRID_TOP}
          x2={TOTAL_X}
          y2={GRID_TOP + ROWS.length * ROW_H}
          stroke="#94a3b8"
          strokeWidth="1"
        />
        <line
          x1={WIDTH - 4}
          y1={GRID_TOP}
          x2={WIDTH - 4}
          y2={GRID_TOP + ROWS.length * ROW_H}
          stroke="#cbd5e1"
          strokeWidth="0.8"
        />

        {hourLines}
        {horizontals}
        {verticals}
      </svg>

      <div className="log-totals">
        {ROWS.map((row) => (
          <div className="log-total" key={row.key}>
            <span className="swatch" style={{ background: row.color }} />
            {row.label.replace(/^\d+\.\s/, "")}:{" "}
            <b>{fmtTotal(log.totals[row.key] || 0)}</b>
          </div>
        ))}
        <div className="log-total" style={{ marginLeft: "auto" }}>
          Total: <b>24:00</b>
        </div>
      </div>
    </div>
  );
}
