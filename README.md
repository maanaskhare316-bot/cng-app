# 🛣️ CNG Navigator - Smart CNG Highway Recommender
### Real-Time Queue & Pressure Telemetry • Google Maps API Integration • AI Route Recommender

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Google Maps API](https://img.shields.io/badge/Google%20Maps-JS%20API-4285F4.svg)](https://developers.google.com/maps)

---

## 🌟 Overview

**CNG Navigator** is a modern, full-stack web application designed for drivers (Cars, Taxis, Autos, Commercial Fleet) to find the **most convenient and optimal CNG fueling stations** during highway and city travel.

The system addresses the two primary challenges faced by CNG drivers:
1. **Shortest Queue (Zero Wait Time):** Real-time monitoring of vehicles in line and estimated wait time in minutes.
2. **High Pressure (200+ Bar):** Live compressor pressure telemetry to ensure a 100% full cylinder tank (~9–10 kg capacity) and ultra-fast filling speed.
3. **Google Maps API Integration:** Interactive Google Vector Maps, Live Road Traffic layer, Satellite view, and Google Directions turn-by-turn driving navigation.

---

## 🚀 Key Features

### 1. 🗺️ Google Maps JavaScript API Integration
- **Interactive Custom SVG Pins:** Displays both live gas pressure (`218 Bar`) and queue telemetry (`🚗 2 Cars • ~4m`) directly on the map pins.
- **Color-Coded Status:**
  - 🟢 **Emerald (High Pressure):** $\ge 195\text{ Bar}$ (100% full cylinder, fast fill)
  - 🟡 **Amber (Moderate Pressure):** $175 - 194\text{ Bar}$
  - 🔴 **Red (Low Pressure):** $< 175\text{ Bar}$
- **Rich Station InfoWindows:** Popups showing station name, operator, Bar & PSI conversion ($218\text{ Bar} = 3,162\text{ PSI}$), active dispenser count, and a direct **"Navigate in Google Maps ↗"** button.
- **🚦 Live Google Traffic Layer:** Real-time road traffic monitoring around pumps and highway exits.
- **🛰️ Satellite & Hybrid Views:** 1-click toggle between Google Vector Roadmap and Satellite imagery.
- **Dual-Engine Auto-Fallback:** Works out of the box with Leaflet / OpenStreetMap when an API key is not present, and seamlessly transitions to Google Maps once an API key is supplied.

### 2. ⚡ Live Telemetry & Visualizers
- **SVG Pressure Dial Gauge:** Interactive analog gauge monitoring compressor pressure from $140\text{ Bar}$ to $240\text{ Bar}$ with PSI conversion.
- **Animated Queue Visualizer:** Visual depiction of waiting vehicles (`🚗 🚗 🚗`), queue length, active nozzles ($4/4$ or $6/6$), and estimated wait time in minutes.
- **Background SCADA Simulator:** Simulates natural vehicle arrivals/departures and compressor pressure cycles every few seconds.

### 3. ⭐ AI Smart Highway Route Recommender
When planning travel across major highway corridors (e.g., Delhi $\leftrightarrow$ Agra, Mumbai $\leftrightarrow$ Pune, Bhopal $\leftrightarrow$ Indore, Delhi $\leftrightarrow$ Jaipur):
$$\text{Score} = (\text{Pressure Score} \times 0.40) + (\text{Queue Score} \times 0.40) + (\text{Detour Score} \times 0.20)$$

The engine analyzes all highway stations and awards the **"Best Overall Choice"** crown to the pump with:
- Minimal vehicle queue ($< 4\text{ min wait}$)
- Maximum compressor pressure ($200+\text{ Bar}$)
- Minimal highway detour ($< 500\text{ m}$ off route)

### 4. 🧮 CNG Pressure & Highway Range Calculator
Interactive widget allowing drivers to select their vehicle type (Car/Sedan, MPV/Ertiga, Auto Rickshaw, Taxi/Van) and adjust station pressure to calculate:
- **Exact Gas Filled:** (e.g. $215\text{ Bar} \rightarrow 9.6\text{ kg}$ vs $160\text{ Bar} \rightarrow 6.8\text{ kg}$)
- **Highway Range Gained:** Demonstrates the extra $60 - 80\text{ km}$ gained from a high-pressure pump.
- **Cost Savings vs Petrol:** Shows savings per full tank compared to petrol.

### 5. 📍 GPS Nearest CNG Station Finder
- 1-click button uses browser Geolocation to calculate the nearest station with live distance, current pressure, and vehicle wait time.

### 6. 📝 Crowdsourced Driver Reporting
- Any driver at a pump can submit real-time updates (e.g. "3 cars waiting, 215 Bar pressure"), instantly synchronizing across all users.

---

## 📁 Project Architecture

```
CNG/
├── backend/
│   ├── server.js              # Native Node.js REST API Server (Zero external dependencies)
│   └── package.json           # Backend npm configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── map/
│   │   │   │   ├── GoogleStationMap.tsx   # Google Maps JS API, Traffic & Markers
│   │   │   │   └── StationMap.tsx         # Dual Engine (Google Maps + Leaflet)
│   │   │   ├── stations/
│   │   │   │   ├── CngCalculator.tsx      # Cylinder capacity & range calculator
│   │   │   │   ├── PressureGauge.tsx      # SVG Dial Gauge (Bar + PSI)
│   │   │   │   ├── QueueVisualizer.tsx    # Animated vehicle queue visualizer
│   │   │   │   └── ReportStatusModal.tsx  # Crowdsourced live update modal
│   │   │   └── ui/
│   │   │       └── ApiKeyModal.tsx        # Google Maps API Key setup dialog
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx              # Overview, quick filters, nearest finder & map
│   │   │   ├── TripPlanner.tsx            # Origin/Destination route search
│   │   │   ├── RouteResults.tsx           # Best convenient station recommendations
│   │   │   ├── StationsList.tsx           # Telemetry list & sorting
│   │   │   ├── StationDetails.tsx         # Telemetry trend charts & navigation
│   │   │   ├── LiveMonitoring.tsx         # Real-time simulation ticker
│   │   │   ├── CompareStations.tsx        # Side-by-side station comparison
│   │   │   └── Settings.tsx               # Google Maps API key & preferences
│   │   ├── services/
│   │   │   ├── googleMapsLoader.ts        # Dynamic Google Maps script loader
│   │   │   └── api.ts                     # REST API client
│   │   └── data/
│   │       ├── demoStations.ts            # Realistic highway CNG stations with telemetry
│   │       └── corridors.ts               # Pre-loaded highway routes
│   ├── package.json
│   └── vite.config.ts
│
├── run.bat                     # 1-Click Startup Script (Runs backend + frontend)
├── start-dev.bat               # 1-Click Dev Server (Vite Hot-Reload + Backend API)
└── README.md
```

---

## 🏃 Quick Start Guide

### Method 1: 1-Click Launch (Recommended)
Double-click **`run.bat`** in the root folder:
1. Verifies the Node.js runtime.
2. Checks the frontend production build.
3. Starts the server on **`http://localhost:8080`** and opens it in your default browser.

### Method 2: Development Mode (Hot-Reload)
Double-click **`start-dev.bat`** or run in your terminal:
```bash
# Terminal 1 (Backend API):
node backend/server.js

# Terminal 2 (Frontend with Vite):
cd frontend
npm run dev
```
Open in browser: **`http://localhost:5173`**

---

## 🗺️ Google Maps API Key Setup (Optional)

1. Open the app and click the **"Google Maps Active" / "API Key"** button in the top navigation bar.
2. Enter your Google Maps JavaScript API key and click **"Save & Apply Key"**.
3. Google Vector Maps, Live Road Traffic, and Directions will activate immediately!
*(Note: If no key is entered, the app continues to operate seamlessly on OpenStreetMap with all telemetry and custom pins!)*

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check and service uptime |
| `GET` | `/api/stations` | List all CNG stations with real-time pressure & queue |
| `GET` | `/api/stations/:id` | Full telemetry profile for a specific station |
| `POST` | `/api/stations/search-route` | AI Route Recommender (shortest queue + highest pressure) |
| `POST` | `/api/telemetry/report` | Crowdsourced telemetry report submission |

---

## 🌐 Production Deployment

### Vercel / Netlify
1. Connect repository and set root directory to `frontend`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variable: `VITE_GOOGLE_MAPS_API_KEY` (Optional)

### Render / Railway / Cloud VPS
1. Connect root repository directory.
2. Start command: `node backend/server.js`
3. Port is automatically bound to `process.env.PORT || 8080`.
