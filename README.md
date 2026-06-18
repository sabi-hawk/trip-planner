# ELD Trip Planner

A full-stack application that takes trip details as input and produces **route
instructions with HOS-compliant stops** and **auto-drawn FMCSA daily log
sheets**. Built with **Django REST Framework** (backend) and **React + Vite**
(frontend), using free OpenStreetMap services for geocoding and routing.

> Property-carrying driver · 70 hrs / 8 days · no adverse driving conditions ·
> fuel at least every 1,000 miles · 1 hour each for pickup and drop-off.

---

## Features

- **Inputs:** current location, pickup location, drop-off location, and current
  cycle hours used.
- **Interactive route map** (Leaflet + OpenStreetMap) with the full driving
  route and colored markers for start, pickup, drop-off, fuel stops, 30-minute
  breaks, and 10-hour rests.
- **Hours-of-Service engine** that enforces:
  - 11-hour driving limit
  - 14-hour on-duty window
  - 30-minute break after 8 cumulative driving hours
  - 70-hour / 8-day cycle (seeded by the input), with 34-hour restart
  - 10-hour daily reset
  - fueling every 1,000 miles, and 1-hour pickup/drop-off on-duty events
- **Daily log sheets** drawn as authentic 24-hour FMCSA grids (Off Duty /
  Sleeper Berth / Driving / On Duty), one sheet per day for multi-day trips,
  with per-status totals.

---

## Architecture

```
.
├── backend/        Django + DRF API (geocode → route → HOS simulation)
│   ├── eld/        project settings / urls / wsgi
│   └── trips/      app: serializer, view, and services/
│       └── services/  geocode.py, routing.py, hos.py
└── frontend/       React + Vite SPA (form, map, log sheets)
    └── src/components/  TripForm, RouteMap, StopsList, Summary, LogSheet
```

Data flow: the React form `POST`s to `/api/plan-trip/`. Django geocodes the
three locations (Nominatim, with a Photon fallback), fetches a driving route
(OSRM), runs the HOS simulation, and returns route geometry, an ordered list of
stops, and structured daily logs which the frontend renders.

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API runs at `http://localhost:8000`. Test it directly:

```bash
curl -X POST http://localhost:8000/api/plan-trip/ \
  -H "Content-Type: application/json" \
  -d '{"current_location":"Los Angeles, CA","pickup_location":"Phoenix, AZ","dropoff_location":"Dallas, TX","current_cycle_used":8}'
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # ensure VITE_API_URL=http://localhost:8000
npm run dev
```

Open `http://localhost:5173`.

---

## Deployment

The frontend deploys to **Vercel** and the backend to **Render** (both free
tiers).

### Backend → Render

1. Push this repo to GitHub.
2. In Render, create a **New Web Service** from the repo. A
   [`backend/render.yaml`](backend/render.yaml) blueprint is included, or set
   manually:
   - **Root Directory:** `backend`
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn eld.wsgi:application`
3. Set environment variables:
   - `DJANGO_DEBUG=false`
   - `DJANGO_SECRET_KEY=<generate a strong value>`
   - `CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app`
4. Note the service URL, e.g. `https://eld-trip-planner-api.onrender.com`.

> Vercel preview/production `*.vercel.app` origins are already allowed via a
> CORS regex, so the app works even before you set `CORS_ALLOWED_ORIGINS`.

### Frontend → Vercel

1. In Vercel, **Import** the repo.
   - **Root Directory:** `frontend`
   - Framework preset: **Vite** (auto-detected via
     [`frontend/vercel.json`](frontend/vercel.json)).
2. Add an environment variable:
   - `VITE_API_URL=https://<your-render-service>.onrender.com`
3. Deploy. Vercel gives you the live `*.vercel.app` URL.

---

## Tech Stack

| Layer      | Tech                                                        |
| ---------- | ----------------------------------------------------------- |
| Backend    | Django 5, Django REST Framework, Gunicorn, WhiteNoise       |
| Frontend   | React 18, Vite, react-leaflet, Leaflet, Axios              |
| Geocoding  | OpenStreetMap Nominatim (Photon fallback) — free, no key   |
| Routing    | OSRM public API — free, no key                              |
| Maps/tiles | OpenStreetMap                                               |

## Notes & Assumptions

- The HOS engine models the standard interstate property-carrying rules listed
  above. Average driving speed per leg is derived from the OSRM route estimate.
- Public Nominatim/OSRM endpoints are rate-limited; for heavy production use,
  swap `NOMINATIM_URL` / `OSRM_URL` (and add a key-based provider such as
  OpenRouteService) via environment variables.
