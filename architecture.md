# Architecture Overview

## High‑Level Diagram
```
User Browser (http://localhost:5173)
   ⇆   Frontend (React + Vite)
          ⇆   REST API (http://localhost:8080/api)
                 ⇆   Backend (Spring Boot 3)
                        ⇆   PostgreSQL (docker‑compose)
```

- **Frontend** handles UI, map rendering (Leaflet), state management, and calls backend APIs via Axios.
- **Backend** exposes REST endpoints, contains business logic (recommendation engine, simulation), and accesses the database through Spring Data JPA.
- **Database** stores demo stations, queues, pressure readings, trips and historical data.
- **Simulation Engine** (backend scheduled task) periodically updates queue counts and pressure values to provide live demo data.
- **Demo Mode** flag toggles between using real external services (OSRM, Nominatim) and deterministic mock data, guaranteeing a working demo without API keys.

## Component Breakdown
| Layer | Technology | Responsibility |
|-------|------------|----------------|
| UI | React, TypeScript, Tailwind, React‑Leaflet, Recharts, Lucide React | Render pages, maps, charts, handle user interactions |
| Routing | React Router v6 | Page navigation (Dashboard, Trip Planner, Stations, Live Queue, Comparison, Settings, Station Detail) |
| Map | Leaflet + OpenStreetMap tiles | Display route, markers, pop‑ups |
| Backend | Java 21, Spring Boot 3, Spring Web, Spring Data JPA | REST APIs, business logic, simulation |
| Persistence | PostgreSQL (docker) | Store entities, seed demo data |
| DevOps | Docker Compose, Maven | Container orchestration, build/run |
| Simulation | `@Scheduled` Spring task | Randomly vary queue count, waiting time, pressure |

## Data Flow (Trip Planning)
1. Frontend sends `POST /api/trips/plan` with start/end locations.
2. Backend geocodes locations (mock or Nominatim) → calculates route (mock or OSRM).
3. Finds stations near route via simple distance check.
4. Retrieves latest queue & pressure for each station.
5. Runs recommendation engine → returns route GeoJSON, station list, and recommendation.
6. Frontend updates map, station cards, and recommendation panel.

## Important Settings
- **Demo mode** – All external calls fallback to static mock data.
- **Simulation toggle** – Enables/disables periodic updates of queue/pressure.
- **Search radius**, **max detour**, **vehicle type** – Stored in `localStorage` and optionally sent to backend.

---
The next step is to scaffold the project directories (`frontend/`, `backend/`) and create the initial configuration files.
