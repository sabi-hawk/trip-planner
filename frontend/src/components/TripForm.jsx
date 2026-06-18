import { useState } from "react";

const FIELDS = [
  {
    key: "current_location",
    label: "Current location",
    placeholder: "e.g. Los Angeles, CA",
    color: "var(--stop-start)",
  },
  {
    key: "pickup_location",
    label: "Pickup location",
    placeholder: "e.g. Phoenix, AZ",
    color: "var(--stop-pickup)",
  },
  {
    key: "dropoff_location",
    label: "Drop-off location",
    placeholder: "e.g. Dallas, TX",
    color: "var(--stop-dropoff)",
  },
];

const EXAMPLE = {
  current_location: "Los Angeles, CA",
  pickup_location: "Phoenix, AZ",
  dropoff_location: "Dallas, TX",
  current_cycle_used: "8",
};

export default function TripForm({ onSubmit, loading, error }) {
  const [values, setValues] = useState({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    current_cycle_used: "",
  });

  function update(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function submit(e) {
    e.preventDefault();
    onSubmit({
      current_location: values.current_location.trim(),
      pickup_location: values.pickup_location.trim(),
      dropoff_location: values.dropoff_location.trim(),
      current_cycle_used: Number(values.current_cycle_used || 0),
    });
  }

  const valid =
    values.current_location.trim() &&
    values.pickup_location.trim() &&
    values.dropoff_location.trim() &&
    values.current_cycle_used !== "";

  return (
    <div className="card">
      <div className="card-header">
        <h2>Trip Details</h2>
        <button
          type="button"
          className="subtle"
          style={{
            background: "none",
            border: "none",
            color: "var(--primary)",
            cursor: "pointer",
            fontWeight: 600,
          }}
          onClick={() => setValues(EXAMPLE)}
        >
          Use example
        </button>
      </div>
      <div className="card-body">
        <form onSubmit={submit}>
          {FIELDS.map((f) => (
            <div className="form-group" key={f.key}>
              <label htmlFor={f.key}>{f.label}</label>
              <div className="input-wrap">
                <span className="dot" style={{ background: f.color }} />
                <input
                  id={f.key}
                  type="text"
                  placeholder={f.placeholder}
                  value={values[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
          ))}

          <div className="form-group">
            <label htmlFor="current_cycle_used">
              Current cycle used (hours)
            </label>
            <input
              id="current_cycle_used"
              className="no-dot"
              type="number"
              min="0"
              max="70"
              step="0.5"
              placeholder="0 – 70"
              value={values.current_cycle_used}
              onChange={(e) => update("current_cycle_used", e.target.value)}
            />
            <div className="hint">
              Hours already worked in your current 70-hour / 8-day cycle.
            </div>
          </div>

          <button className="btn" type="submit" disabled={!valid || loading}>
            {loading && <span className="spinner" />}
            {loading ? "Planning…" : "Plan Trip & Generate Logs"}
          </button>

          {error && <div className="error-banner">{error}</div>}
        </form>
      </div>
    </div>
  );
}
