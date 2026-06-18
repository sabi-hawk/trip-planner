import { useState } from "react";
import { planTrip } from "./api";
import TripForm from "./components/TripForm";
import Summary from "./components/Summary";
import RouteMap from "./components/RouteMap";
import StopsList from "./components/StopsList";
import LogSheet from "./components/LogSheet";

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handlePlan(payload) {
    setLoading(true);
    setError(null);
    try {
      const data = await planTrip(payload);
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 17h4V5H2v12h3" />
            <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
            <circle cx="7.5" cy="17.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
          </svg>
        </span>
        <div>
          <h1>ELD Trip Planner</h1>
          <p>Route planning &amp; automated FMCSA daily logs (70hr / 8-day)</p>
        </div>
      </header>

      <div className="layout">
        <div>
          <TripForm onSubmit={handlePlan} loading={loading} error={error} />
        </div>

        <div className="results">
          {!result && !loading && (
            <div className="card">
              <div className="placeholder">
                <div>
                  <div className="big">🗺️</div>
                  <h3 style={{ margin: "0 0 6px" }}>Plan your trip</h3>
                  <p style={{ margin: 0, maxWidth: 360 }}>
                    Enter your current location, pickup, and drop-off points along
                    with your current cycle hours. We'll map the route, schedule
                    HOS-compliant stops, and draw your daily log sheets.
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="placeholder">
                <div>
                  <div className="big">
                    <span
                      className="spinner"
                      style={{
                        width: 34,
                        height: 34,
                        borderWidth: 4,
                        borderTopColor: "#2563eb",
                        borderColor: "rgba(37,99,235,0.25)",
                      }}
                    />
                  </div>
                  <h3 style={{ margin: "12px 0 4px" }}>Planning your route…</h3>
                  <p style={{ margin: 0 }}>
                    Geocoding locations, computing the route, and simulating
                    Hours-of-Service.
                  </p>
                </div>
              </div>
            </div>
          )}

          {result && !loading && (
            <>
              <Summary
                summary={result.summary}
                locations={result.locations}
              />
              <RouteMap
                geometry={result.route.geometry}
                stops={result.stops}
                locations={result.locations}
              />
              <StopsList stops={result.stops} />
              <div className="card">
                <div className="card-header">
                  <h2>Daily Log Sheets</h2>
                  <span className="subtle">
                    {result.daily_logs.length} day
                    {result.daily_logs.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="card-body logs-wrap">
                  {result.daily_logs.map((log) => (
                    <LogSheet
                      key={log.day}
                      log={log}
                      totalDays={result.daily_logs.length}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="app-footer">
        Built with Django + React · Maps © OpenStreetMap contributors · Routing by
        OSRM
      </footer>
    </div>
  );
}
