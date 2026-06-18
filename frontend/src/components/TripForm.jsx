import { useState } from "react";
import LocationAutocomplete from "./LocationAutocomplete";

// Country codes reachable by road from the contiguous USA.
const ROAD_REACHABLE = new Set(["us", "ca", "mx"]);

// Specific US states/territories that are islands (not road-reachable from continental US).
const OCEAN_STATES = new Set(["hawaii", "puerto rico", "guam", "alaska"]);

const STEPPER_FIELDS = [
  {
    key: "current_location",
    label: "Current location",
    placeholder: "Search for your current position…",
    accentColor: "var(--stop-start)",
    nodeColor: "#22c55e",
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10">
        <circle cx="5" cy="5" r="4" fill="#fff" />
        <circle cx="5" cy="5" r="2" fill="#22c55e" />
      </svg>
    ),
  },
  {
    key: "pickup_location",
    label: "Pickup location",
    placeholder: "Search for the pickup address…",
    accentColor: "var(--stop-pickup)",
    nodeColor: "#3b82f6",
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10">
        <rect x="1" y="1" width="8" height="8" rx="2" fill="#3b82f6" />
        <text x="5" y="7.5" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="700">P</text>
      </svg>
    ),
  },
  {
    key: "dropoff_location",
    label: "Drop-off location",
    placeholder: "Search for the delivery address…",
    accentColor: "var(--stop-dropoff)",
    nodeColor: "#ef4444",
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M5 1 L5 8 M2 5 L5 8 L8 5" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
];

const EXAMPLE = {
  current_location: { value: "Los Angeles, California, United States", lat: 34.05, lon: -118.24, countrycode: "us" },
  pickup_location:  { value: "Phoenix, Arizona, United States",         lat: 33.45, lon: -112.07, countrycode: "us" },
  dropoff_location: { value: "Dallas, Texas, United States",            lat: 32.78, lon: -96.80,  countrycode: "us" },
};

function checkOceanWarning(locations) {
  for (const [, loc] of Object.entries(locations)) {
    if (!loc.countrycode) continue;
    const cc = loc.countrycode.toLowerCase();
    if (!ROAD_REACHABLE.has(cc)) {
      return `One or more locations (${loc.value}) is outside the connected North American road network. Truck routing cannot cross oceans.`;
    }
    // Special island check for Hawaii etc. using the display name.
    const name = loc.value.toLowerCase();
    for (const island of OCEAN_STATES) {
      if (name.includes(island)) {
        return `"${loc.value}" cannot be reached by road. Locations in Hawaii, Puerto Rico, and similar territories are not accessible by truck.`;
      }
    }
  }
  return null;
}

function WarnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

export default function TripForm({ onSubmit, loading, error }) {
  const [locations, setLocations] = useState({
    current_location:  { value: "", lat: null, lon: null, countrycode: null },
    pickup_location:   { value: "", lat: null, lon: null, countrycode: null },
    dropoff_location:  { value: "", lat: null, lon: null, countrycode: null },
  });
  const [cycleHours, setCycleHours] = useState(0);

  function updateLocation(key, data) {
    setLocations((prev) => ({ ...prev, [key]: data }));
  }

  function loadExample() {
    setLocations(EXAMPLE);
    setCycleHours(8);
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      current_location: locations.current_location.value,
      pickup_location:  locations.pickup_location.value,
      dropoff_location: locations.dropoff_location.value,
      current_cycle_used: cycleHours,
    });
  }

  const allFilled =
    locations.current_location.value.trim() &&
    locations.pickup_location.value.trim() &&
    locations.dropoff_location.value.trim();

  const oceanWarning = allFilled ? checkOceanWarning(locations) : null;

  const cyclePercent = ((cycleHours / 70) * 100).toFixed(1);
  const cycleColor =
    cycleHours < 50 ? "var(--stop-start)"
    : cycleHours < 65 ? "var(--amber)"
    : "var(--stop-dropoff)";

  return (
    <form onSubmit={handleSubmit} style={{ flex: 1 }}>
      {/* ── Route stepper ── */}
      <div className="stepper">
        {STEPPER_FIELDS.map((field, idx) => (
          <div className="stepper-row" key={field.key}>
            {/* Connector node */}
            <span
              className="stepper-node"
              style={{ background: field.nodeColor, border: "2.5px solid #1a1d27" }}
            >
              {field.icon}
            </span>

            <LocationAutocomplete
              id={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={locations[field.key].value}
              onChange={(data) => updateLocation(field.key, data)}
              accentColor={field.accentColor}
              disabled={loading}
            />
          </div>
        ))}
      </div>

      {/* ── Cycle hours slider ── */}
      <div className="cycle-row">
        <div className="cycle-label-row">
          <span className="cycle-label">CURRENT CYCLE USED</span>
          <span className="cycle-value" style={{ color: cycleColor }}>
            {cycleHours}h
            <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--text-muted-dark)", marginLeft: 4 }}>
              / 70h
            </span>
          </span>
        </div>
        <div className="cycle-track">
          <div
            className="cycle-fill"
            style={{ width: `${cyclePercent}%`, background: `linear-gradient(90deg, ${cycleColor}cc, ${cycleColor})` }}
          />
          <input
            type="range"
            className="cycle-input"
            min="0"
            max="70"
            step="0.5"
            value={cycleHours}
            onChange={(e) => setCycleHours(Number(e.target.value))}
            disabled={loading}
            aria-label="Current cycle hours used"
          />
        </div>
        <p className="cycle-hint">Hours already used in your 70hr / 8-day cycle.</p>
      </div>

      {/* ── Ocean / reachability warning ── */}
      {oceanWarning && (
        <div className="banner warning">
          <span className="banner-icon"><WarnIcon /></span>
          <span>{oceanWarning}</span>
        </div>
      )}

      {/* ── API error ── */}
      {error && (
        <div className="banner error">
          <span className="banner-icon"><ErrorIcon /></span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Submit ── */}
      <button
        className="btn-submit"
        type="submit"
        disabled={!allFilled || loading}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Planning…
          </>
        ) : (
          <>
            <ArrowIcon />
            Plan Route &amp; Generate Logs
          </>
        )}
      </button>

      {/* ── Example link ── */}
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button
          type="button"
          className="example-btn"
          onClick={loadExample}
          disabled={loading}
        >
          Load example trip (LA → Phoenix → Dallas)
        </button>
      </div>
    </form>
  );
}
