import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";

const STOP_STYLE = {
  start: { color: "#16a34a", label: "Start", letter: "S" },
  pickup: { color: "#2563eb", label: "Pickup", letter: "P" },
  dropoff: { color: "#dc2626", label: "Drop-off", letter: "D" },
  fuel: { color: "#f59e0b", label: "Fuel", letter: "F" },
  rest: { color: "#6366f1", label: "10h Rest", letter: "R" },
  break: { color: "#0ea5e9", label: "30m Break", letter: "B" },
  restart: { color: "#8b5cf6", label: "34h Restart", letter: "34" },
};

function makeIcon(type) {
  const s = STOP_STYLE[type] || STOP_STYLE.break;
  const big = type === "start" || type === "pickup" || type === "dropoff";
  const size = big ? 30 : 22;
  return L.divIcon({
    className: "",
    html: `<div style="
        width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${s.color};
        border:2px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);color:#fff;font-size:${
          big ? 12 : 9
        }px;font-weight:700;font-family:Inter,sans-serif;">${s.letter}</span>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function FitBounds({ geometry }) {
  const map = useMap();
  useEffect(() => {
    if (geometry && geometry.length > 1) {
      const bounds = L.latLngBounds(geometry.map((p) => [p[0], p[1]]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [geometry, map]);
  return null;
}

const LEGEND = ["start", "pickup", "dropoff", "fuel", "rest", "break"];

export default function RouteMap({ geometry, stops, locations }) {
  const center =
    geometry && geometry.length
      ? geometry[Math.floor(geometry.length / 2)]
      : [39.5, -98.35];

  return (
    <div className="card">
      <div className="card-header">
        <h2>Route Map</h2>
        <span className="subtle">{stops.length} stops</span>
      </div>
      <div className="map-container">
        <MapContainer
          center={center}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geometry && geometry.length > 1 && (
            <>
              <Polyline
                positions={geometry}
                pathOptions={{ color: "#1d4ed8", weight: 5, opacity: 0.85 }}
              />
              <FitBounds geometry={geometry} />
            </>
          )}
          {stops.map((stop, i) => (
            <Marker
              key={`${stop.type}-${i}`}
              position={[stop.lat, stop.lon]}
              icon={makeIcon(stop.type)}
            >
              <Popup>
                <strong>{stop.label}</strong>
                <br />
                Mile {stop.miles.toLocaleString()} · Day {stop.day}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="map-legend">
        {LEGEND.map((t) => (
          <div className="legend-item" key={t}>
            <span
              className="legend-pin"
              style={{ background: STOP_STYLE[t].color }}
            />
            {STOP_STYLE[t].label}
          </div>
        ))}
      </div>
    </div>
  );
}
