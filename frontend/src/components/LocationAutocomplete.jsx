import { useState, useEffect, useRef, useCallback } from "react";

const PHOTON_URL = "https://photon.komoot.io/api/";
const DEBOUNCE_MS = 300;

function formatSuggestion(feature) {
  const p = feature.properties || {};
  const parts = [
    p.name,
    p.city && p.city !== p.name ? p.city : null,
    p.state,
    p.country,
  ].filter(Boolean);
  return { primary: parts.slice(0, 2).join(", "), secondary: parts.slice(2).join(", ") };
}

function buildLocationLabel(feature) {
  const p = feature.properties || {};
  const parts = [p.name, p.city && p.city !== p.name ? p.city : null, p.state, p.country]
    .filter(Boolean);
  return parts.join(", ");
}

function PinIcon({ color }) {
  return (
    <svg width="13" height="16" viewBox="0 0 13 16" fill="none">
      <path d="M6.5 0C3.46 0 1 2.46 1 5.5c0 3.89 5.5 10.5 5.5 10.5S12 9.39 12 5.5C12 2.46 9.54 0 6.5 0z"
        fill={color} />
      <circle cx="6.5" cy="5.5" r="2" fill="#fff" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <polyline points="2,7 5.5,10.5 12,3" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/**
 * LocationAutocomplete
 *
 * Props:
 *   id (string)
 *   label (string)
 *   placeholder (string)
 *   value (string)        – controlled display value
 *   onChange (fn)         – called with { value, lat, lon, countrycode } on pick
 *                           or { value, lat: null, lon: null, countrycode: null } while typing
 *   accentColor (string)  – CSS color for the pin icon
 *   disabled (bool)
 */
export default function LocationAutocomplete({
  id,
  label,
  placeholder,
  value,
  onChange,
  accentColor = "var(--amber)",
  disabled = false,
}) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [confirmed, setConfirmed] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const abortRef = useRef(null);
  const timerRef = useRef(null);

  // Sync controlled value → local query when parent resets.
  useEffect(() => {
    setQuery(value || "");
    setConfirmed(!!value);
  }, [value]);

  const fetchSuggestions = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);

    try {
      const params = new URLSearchParams({ q: q.trim(), limit: 6, lang: "en" });
      const res = await fetch(`${PHOTON_URL}?${params}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const features = (data.features || []).filter((f) => {
        const p = f.properties || {};
        return p.osm_type !== "way" || p.name;
      });
      setSuggestions(features);
      setOpen(features.length > 0);
      setActiveIndex(-1);
    } catch (err) {
      if (err.name !== "AbortError") setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);
    setConfirmed(false);
    onChange({ value: q, lat: null, lon: null, countrycode: null });

    clearTimeout(timerRef.current);
    if (q.trim().length >= 2) {
      timerRef.current = setTimeout(() => fetchSuggestions(q), DEBOUNCE_MS);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }

  function selectFeature(feature) {
    const label = buildLocationLabel(feature);
    const coords = feature.geometry?.coordinates || [];
    const p = feature.properties || {};
    const countrycode = (p.countrycode || "").toLowerCase();
    const lat = coords[1] ?? null;
    const lon = coords[0] ?? null;

    setQuery(label);
    setConfirmed(true);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    onChange({ value: label, lat, lon, countrycode });
    inputRef.current?.blur();
  }

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        selectFeature(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  // Close on outside click.
  useEffect(() => {
    function onMouseDown(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div className="autocomplete-wrap">
      <label className="autocomplete-label" htmlFor={id}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          className="autocomplete-input"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={activeIndex >= 0 ? `${id}-item-${activeIndex}` : undefined}
        />
        {confirmed && !open && (
          <span className="confirmed-tick"><CheckIcon /></span>
        )}
        {loading && !confirmed && (
          <span className="confirmed-tick">
            <span className="spinner" style={{
              width: 13, height: 13, borderWidth: 2,
              borderTopColor: "var(--amber)",
              borderColor: "rgba(249,115,22,0.2)"
            }} />
          </span>
        )}
      </div>

      {open && (
        <div
          className="autocomplete-dropdown"
          ref={dropdownRef}
          id={`${id}-list`}
          role="listbox"
        >
          {suggestions.length === 0 && !loading && (
            <div className="autocomplete-empty">No locations found</div>
          )}
          {suggestions.map((feature, idx) => {
            const { primary, secondary } = formatSuggestion(feature);
            return (
              <div
                key={idx}
                id={`${id}-item-${idx}`}
                className={`autocomplete-item${idx === activeIndex ? " active" : ""}`}
                role="option"
                aria-selected={idx === activeIndex}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => { e.preventDefault(); selectFeature(feature); }}
              >
                <span className="autocomplete-item-icon">
                  <PinIcon color={accentColor} />
                </span>
                <div className="autocomplete-item-main">
                  <div className="autocomplete-item-name">{primary || "Unknown location"}</div>
                  {secondary && (
                    <div className="autocomplete-item-sub">{secondary}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
