# Implementation Plan for CNG Navigator

## Overview
We will build a full‑stack web application **CNG Navigator – Smart CNG Trip Planner** with the following stack:
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router, React Leaflet, Recharts, Lucide React, Axios.
- **Backend**: Java 21, Spring Boot 3 (Web, Data JPA), PostgreSQL, Maven.
- **DevOps**: Docker Compose for PostgreSQL, optional Docker for the backend.

The goal is a working end‑to‑end demo that runs locally at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

All data will be simulated (demo mode) so the app works without external API keys.

## Phase 1 – Project Scaffolding (Day 1)
1. **Create folder structure**
   - `frontend/` – Vite + React project.
   - `backend/` – Maven Spring Boot project.
   - `docker-compose.yml` – PostgreSQL service.
2. **Initialize Git repo** (optional).
3. **Add README** with build/run instructions.
4. **Commit initial scaffold**.

## Phase 2 – Backend Development (Days 2‑4)
1. **Spring Boot setup**
   - `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `postgresql` driver.
   - Global CORS config to allow `http://localhost:5173`.
2. **Entity model**
   - `CngStation` (id, name, address, lat, lng, pricePerKg, pressureBar, availableDispensers, status, operatingHours).
   - `StationQueue` (stationId, vehicleCount, waitingMinutes, lastUpdated).
   - `PressureReading` (stationId, pressureBar, timestamp).
   - `Trip` (id, startLocation, endLocation, routeGeoJson, createdAt).
   - `TripStationRecommendation` (tripId, stationId, score, reason).
3. **Repositories** for each entity.
4. **DTOs** for API payloads.
5. **Service layer** – business logic:
   - Route calculation (mocked deterministic OSRM response).
   - Find nearby stations (simple distance filter).
   - Queue & pressure simulation (random within limits, updated by a scheduled task).
   - Recommendation engine (weights as described).
6. **Controllers** – expose the required REST endpoints.
7. **Database init** – `data.sql` with three demo stations and some historic readings.
8. **Application properties** – PostgreSQL connection, JPA hibernate‑ddl‑auto `update`.
9. **Integration tests** (optional for critical APIs).

## Phase 3 – Frontend Development (Days 5‑8)
1. **Create Vite React TS project**.
2. **Install dependencies**:
   ```bash
   npm i tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   npm i react-router-dom@6 react-leaflet leaflet recharts lucide-react axios
   ```
3. **Configure Tailwind** – dark navy sidebar, light content area, green primary color.
4. **Routing** – pages: Dashboard, TripPlanner, Stations, LiveQueue, Comparison, Settings, StationDetail.
5. **Common UI components** – Sidebar, Header, Card, LoadingSpinner, MapLegend, FilterBar.
6. **Map integration** – React Leaflet map with OpenStreetMap tiles.
   - Geocoding using Nominatim (public endpoint, fallback to mock data).
   - Route polyline using OSRM public demo server (fallback to static GeoJSON).
   - Station markers with colour logic (available, busy, low pressure).
7. **Trip Planner page**
   - Autocomplete inputs (use Nominatim `/search` API; mocked for demo).
   - Swap button, predefined demo route.
   - "Find CNG Stations" triggers API `POST /api/trips/plan`.
   - Show map, station list, recommendation panel.
8. **Dashboard page** – summary cards, recent trips, map preview.
9. **Live Queue monitoring** – polling backend `/api/stations/{id}/queue` every few seconds; UI with a vehicle queue graphic and Recharts line chart.
10. **Pressure gauge** – custom circular gauge using Recharts `RadialBarChart`.
11. **Station Detail page** – full info, map, charts, actions.
12. **Station Comparison** – multi‑select, table view, highlight best values.
13. **Settings page** – toggles saved in `localStorage` that affect API query params (e.g., simulation on/off, radius, max detour).
14. **Global error handling** – toast notifications.
15. **Responsive design** – Tailwind utilities, collapsible sidebar on mobile.

## Phase 4 – Simulation Engine (Days 9‑10)
- Backend scheduled task (`@Scheduled(fixedRate = 15000)`) updates queue counts and pressure for each station within configured demo limits.
- Endpoints return the latest values; frontend shows live changes.
- Settings endpoint (`/api/settings`) to enable/disable simulation.

## Phase 5 – Docker & Local Run (Day 11)
1. **docker‑compose.yml** – PostgreSQL service with volume for persistence.
2. **Backend Dockerfile** – build Maven jar and run.
3. **Frontend Dockerfile** – optional; primarily `npm run dev`.
4. **Scripts**:
   - `run-backend.bat` – start Postgres then `mvn spring-boot:run`.
   - `run-frontend.bat` – `npm install && npm run dev`.
5. Verify both services start, the frontend can call backend APIs.

## Phase 6 – Testing & Polishing (Days 12‑13)
- Manual end‑to‑end test of the demo journey (Bhopal Railway Station → AIIMS Bhopal).
- Fix any console errors, CORS issues, map rendering problems.
- Ensure all buttons work (start/pause/reset simulation, compare, get directions, settings changes).
- Add loading spinners for async calls.
- Add README instructions for running the demo.

## Phase 7 – Final Deliverables (Day 14)
- Source code committed.
- `README.md` with setup, run, and demo steps.
- `implementation_plan.md`, `architecture.md` for documentation.
- Ensure the app runs on the expected URLs.

---
**Next steps**: Create the `architecture.md` file describing the high‑level component diagram and data flow, then scaffold the project directories and initial Vite + Spring Boot setups.
