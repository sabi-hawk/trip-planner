import { useState } from "react";
import { planTrip } from "./api";
import TripForm from "./components/TripForm";
import Summary from "./components/Summary";
import RouteMap from "./components/RouteMap";
import StopsList from "./components/StopsList";
import LogSheet from "./components/LogSheet";

function TruckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

function RoadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
      stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17 Q 12 3 21 17" />
      <line x1="12" y1="7" x2="12" y2="17" strokeDasharray="2 2" />
      <path d="M5 17 L7 21 M19 17 L17 21" />
    </svg>
  );
}

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
      {/* ── Top nav ── */}
      <nav className="app-nav">
        <div className="nav-brand">
          <span className="nav-brand-icon"><TruckIcon /></span>
          <div className="nav-brand-text">
            <strong>ELD Trip Planner</strong>
            <span>Route planning &amp; automated daily logs</span>
          </div>
        </div>
        <span className="nav-badge">FMCSA 70hr / 8-day</span>
      </nav>

      {/* ── Two-panel body ── */}
      <div className="app-body">
        {/* Left: dispatch panel */}
        <aside className="panel-left">
          <p className="panel-left-title">Dispatch Details</p>
          <TripForm onSubmit={handlePlan} loading={loading} error={error} />
        </aside>

        {/* Right: results */}
        <main className="panel-right">
          {!result && !loading && (
            <div className="card">
              <div className="placeholder">
                <div>
                  <div className="placeholder-icon"><RoadIcon /></div>
                  <h3>Ready to plan your haul</h3>
                  <p>
                    Enter your current location, pickup, and drop-off on the left.
                    We'll map the route, schedule every HOS-compliant stop, and
                    auto-draw your FMCSA daily log sheets.
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="placeholder">
                <div>
                  <div className="placeholder-icon" style={{ background: "rgba(249,115,22,0.08)" }}>
                    <span className="spinner" style={{
                      width: 32, height: 32, borderWidth: 3,
                      borderTopColor: "var(--amber)",
                      borderColor: "rgba(249,115,22,0.2)"
                    }} />
                  </div>
                  <h3>Planning your route…</h3>
                  <p>Geocoding locations, computing drive path, and simulating HOS.</p>
                </div>
              </div>
            </div>
          )}

          {result && !loading && (
            <>
              <Summary summary={result.summary} locations={result.locations} />
              <RouteMap geometry={result.route.geometry} stops={result.stops} locations={result.locations} />
              <StopsList stops={result.stops} />
              <div className="card">
                <div className="card-header">
                  <h2>Daily Log Sheets</h2>
                  <span className="subtle">
                    {result.daily_logs.length} day{result.daily_logs.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="card-body logs-wrap">
                  {result.daily_logs.map((log) => (
                    <LogSheet key={log.day} log={log} totalDays={result.daily_logs.length} />
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <footer className="app-footer">
        Built with Django + React &nbsp;·&nbsp; Maps © OpenStreetMap contributors &nbsp;·&nbsp; Routing by OSRM
      </footer>
    </div>
  );
}
