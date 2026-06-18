# ELD Trip Planner

Full-stack app for planning truck routes and generating FMCSA daily log sheets. Enter three locations and your current cycle hours — get back a mapped route, HOS-compliant stops, and drawn daily logs.

**Stack:** Django REST API (backend) + React/Vite (frontend)

---

## Project structure

```
eld-trip-planner/
├── backend/          Django API
│   ├── eld/          settings, urls
│   └── trips/
│       ├── views.py          POST /api/plan-trip/
│       └── services/
│           ├── geocode.py    address → lat/lon
│           ├── routing.py    OSRM driving route
│           └── hos.py        hours-of-service simulation
└── frontend/         React SPA
    └── src/
        ├── api.js            calls the backend
        └── components/       form, map, log sheets
```

---

## How the two apps connect

```
Browser (localhost:5173)
    │
    │  POST /api/plan-trip/
    │  { current_location, pickup_location, dropoff_location, current_cycle_used }
    ▼
Django API (localhost:8000)
    │
    ├─ geocode.py   → Nominatim / Photon (free, no API key)
    ├─ routing.py   → OSRM public routing API
    └─ hos.py       → simulates driving, rests, fuel, breaks
    │
    ▼
JSON response → map geometry, stops list, daily_logs[]
    │
    ▼
React renders map (Leaflet) + SVG log sheets
```

The frontend reads the API URL from `frontend/.env`:

```
VITE_API_URL=http://localhost:8000
```

---

## Setup

You need Python 3.11+ and Node 18+.

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

API is at http://localhost:8000

Quick health check:

```bash
curl http://localhost:8000/
```

### Frontend

```bash
cd frontend
npm install
```

Copy the env file and point it at your local API:

```bash
copy .env.example .env        # Windows
cp .env.example .env          # Mac/Linux
```

Then start the dev server:

```bash
npm run dev
```

App opens at http://localhost:5173

---

## Test inputs

Use the **"Load example trip"** link in the app, or enter these manually:

### Standard trip (3 days, ~1,440 miles)

| Field | Value |
|-------|-------|
| Current location | Los Angeles, California, United States |
| Pickup location | Phoenix, Arizona, United States |
| Drop-off location | Dallas, Texas, United States |
| Current cycle used | 8 |

**Expected:** ~1,440 mi, 3 daily log sheets, 1 fuel stop, 2 ten-hour rests.

### Short trip (1 day)

| Field | Value |
|-------|-------|
| Current location | Chicago, Illinois, United States |
| Pickup location | Indianapolis, Indiana, United States |
| Drop-off location | Detroit, Michigan, United States |
| Current cycle used | 0 |

**Expected:** ~300 mi, 1 log sheet, no fuel stop needed.

### Long haul (multi-day, tests 34h restart)

| Field | Value |
|-------|-------|
| Current location | Seattle, Washington, United States |
| Pickup location | Denver, Colorado, United States |
| Drop-off location | Miami, Florida, United States |
| Current cycle used | 60 |

**Expected:** ~3,500+ mi, 7+ log sheets, possible 34-hour cycle restart.

### Invalid route (should show error)

| Field | Value |
|-------|-------|
| Current location | Los Angeles, California, United States |
| Pickup location | Honolulu, Hawaii, United States |
| Drop-off location | Dallas, Texas, United States |
| Current cycle used | 0 |

**Expected:** Yellow warning in the form + backend error about no road route (Hawaii is not reachable by truck from the mainland).

### API test via curl

```bash
curl -X POST http://localhost:8000/api/plan-trip/ ^
  -H "Content-Type: application/json" ^
  -d "{\"current_location\":\"Los Angeles, CA\",\"pickup_location\":\"Phoenix, AZ\",\"dropoff_location\":\"Dallas, TX\",\"current_cycle_used\":8}"
```

---

## HOS rules modeled

Property-carrying driver, 70hr/8day cycle:

- 11 hours max driving per day
- 14-hour on-duty window
- 30-minute break after 8 hours of driving
- 10-hour off-duty reset between days
- 34-hour restart when hitting the 70-hour cycle limit
- Fuel stop every 1,000 miles
- 1 hour on-duty for pickup and dropoff

---

## Deployment

| App | Platform | Root directory |
|-----|----------|----------------|
| Backend | Render | `backend` |
| Frontend | Vercel | `frontend` |

**Backend env vars (Render):**
- `DJANGO_DEBUG=false`
- `DJANGO_SECRET_KEY=<random string>`
- `CORS_ALLOWED_ORIGINS=https://your-app.vercel.app`

**Frontend env vars (Vercel):**
- `VITE_API_URL=https://your-api.onrender.com`

See `backend/render.yaml` and `frontend/vercel.json` for deploy config.

---

## External services (all free)

| Service | Used for | Key needed? |
|---------|----------|-------------|
| Nominatim | Backend geocoding | No |
| Photon | Frontend autocomplete + geocode fallback | No |
| OSRM | Driving routes | No |
| OpenStreetMap / CARTO | Map tiles | No |
