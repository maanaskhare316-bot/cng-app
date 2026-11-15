# 🛣️ CNG Navigator - Smart CNG Highway Recommender
### Google Maps API Integration • Real-Time Queue & Pressure Telemetry • AI Route Recommender

---

## 🌟 प्रोजेक्ट का मुख्य उद्देश्य (Overview)
**CNG Navigator** एक आधुनिक फुल-स्टैक वेब ऐप्लिकेशन है जो वाहन चालकों (Car, Auto, Taxi, Commercial Vehicles) को उनकी यात्रा के दौरान **सबसे सुविधाजनक और सर्वश्रेष्ठ CNG स्टेशन** ढूंढने में मदद करता है।

यह सिस्टम मुख्य रूप से दो सबसे महत्वपूर्ण बातों का समाधान करता है:
1. **कम गाड़ी (Shortest Queue / No Wait):** पंप पर कितनी गाड़ियाँ लाइन में हैं और कितना इंतज़ार करना पड़ेगा।
2. **ज्यादा प्रेशर (High Pressure / 200+ Bar):** गैस का प्रेशर कितना है, जिससे सिलेंडर में पूरी 9-10 kg गैस आए (फुल टैंक) और गैस तेज़ी से भरी जा सके।
3. **Google Maps Integration:** आधिकारिक Google Maps JavaScript API (Directions & Traffic) के साथ संपूर्ण रूट व स्टेशन प्रदर्शित करता है।

---

## 🚀 मुख्य विशेषताएं (Key Features)

- **🗺️ Google Maps JavaScript API Integration:**
  - Google Vector Map, Satellite, Hybrid & Terrain व्यू।
  - **🚦 Live Google Traffic Layer:** पंप के आसपास का रियल-टाइम रोड ट्रैफिक।
  - **Google Directions Service:** शुरुआत (Origin) से गंतव्य (Destination) तक का सटीक ड्राइविंग रूट और स्टेशन का वेपॉइंट डिटूर।
  - **कस्टम इंटरेक्टिव पिन (Custom SVG Markers):** पिन पर ही लाइव प्रेशर (Bar) और कतार (Cars count) दिखाई देती है।
  - **Dual-Engine Toggle:** Google Maps और Leaflet OpenStreetMap के बीच 1-क्लिक स्विच।
  - **API Key Manager:** अपना Google Maps API Key सीधे UI से दर्ज व सहेज सकते हैं (बिना Key के भी डेमो तुरंत काम करता है!)।

- **⚡ लाइव टेलीमेट्री (Live Telemetry & Gauge):**
  - **प्रेशर गेज (Interactive Gauge):** 140 Bar से 240 Bar तक का सटीक प्रेशर और PSI (215 Bar = 3,118 PSI)।
  - **कतार विजुअलाइज़र (Animated Queue Visualizer):** लाइन में खड़ी गाड़ियों का लाइव विजुअल और सक्रिय डिस्पेंसर नोज़ल (4/4 या 6/6 चालू)।
  - **Background Simulator:** हर 10 सेकंड में स्वाभाविक कतार और कंप्रेसर प्रेशर साइकिल को सिम्युलेट करता है।

- **⭐ स्मार्ट रूट सुझाव प्रणाली (Smart Recommendation Engine):**
  - जब आप एक शहर से दूसरे शहर का रूट चुनते हैं (उदा. Delhi ⇄ Agra, Mumbai ⇄ Pune, Bhopal ⇄ Indore):
    $$\text{Score} = (\text{Pressure Score} \times 0.40) + (\text{Queue Score} \times 0.40) + (\text{Detour Score} \times 0.20)$$
  - सिस्टम मार्ग के सभी पंपों का विश्लेषण करके **"सर्वोत्तम सुविधाजनक पंप (Best Choice)"** को गोल्डन क्राउन बैज के साथ सुझाता है जहाँ:
    - सबसे कम गाड़ियाँ हों (~4 मिनट से कम इंतज़ार)
    - उच्चतम 200+ Bar प्रेशर हो (फुल टैंक गैस)
    - न्यूनतम डिटूर (हाइवे से केवल 200m - 500m अतिरिक्त)

- **📝 क्राउडसोर्स्ड लाइव रिपोर्ट (Report Status Modal):**
  - कोई भी चालक किसी भी पंप की वर्तमान स्थिति ("3 गाड़ियाँ हैं, 215 Bar प्रेशर है") सीधे रिपोर्ट कर सकता है, जो तुरंत लाइव अपडेट हो जाती है।

---

## 📁 प्रोजेक्ट संरचना (Project Structure)

```
CNG/
├── backend/
│   ├── server.js              # Native Node.js REST API Server (Zero external dependencies)
│   ├── package.json           # Backend npm configuration
│   └── src/...                # Optional Spring Boot Java source code
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── map/
│   │   │   │   ├── GoogleStationMap.tsx   # Google Maps JS API, Traffic & Markers
│   │   │   │   └── StationMap.tsx         # Dual Engine (Google Maps + Leaflet)
│   │   │   ├── stations/
│   │   │   │   ├── PressureGauge.tsx      # SVG Dial Gauge (Bar + PSI)
│   │   │   │   ├── QueueVisualizer.tsx    # Car queue animation & nozzles
│   │   │   │   └── ReportStatusModal.tsx  # Crowdsourced live update modal
│   │   │   └── ui/
│   │   │       └── ApiKeyModal.tsx        # Google Maps API Key Setup
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx              # Overview, stats & interactive map
│   │   │   ├── TripPlanner.tsx            # Origin/Destination route search
│   │   │   ├── RouteResults.tsx           # Best convenient station recommendations
│   │   │   ├── StationsList.tsx           # Filter by pressure & queue
│   │   │   ├── StationDetails.tsx         # Telemetry charts & navigation
│   │   │   ├── LiveMonitoring.tsx         # Real-time simulation ticker
│   │   │   └── Settings.tsx               # Google API key & preferences
│   │   ├── services/
│   │   │   ├── googleMapsLoader.ts        # Dynamic Google Maps script injector
│   │   │   └── api.ts                     # Axios client & REST calls
│   │   └── data/
│   │       ├── demoStations.ts            # Realistic Indian highway CNG stations
│   │       └── corridors.ts               # Preloaded highway corridors
│   ├── package.json
│   └── vite.config.ts
│
├── run.bat                     # 1-Click Startup Script (Runs backend + frontend)
├── start-dev.bat               # 1-Click Dev Server (Vite Hot-Reload + Backend)
└── README.md
```

---

## 🏃‍♂️ कैसे चलाएं (How to Run)

### तरीका 1: 1-Click Launch (सबसे आसान)
सीधे रूट फोल्डर में मौजूद **`run.bat`** पर डबल क्लिक करें!
यह अपने आप:
1. Node.js की जांच करेगा।
2. फ्रंटएंड बिल्ड करेगा।
3. सर्वर को **`http://localhost:8080`** पर शुरू करेगा और आपके ब्राउज़र में खोल देगा!

### तरीका 2: Development Mode (Hot-Reload)
**`start-dev.bat`** पर डबल क्लिक करें या टर्मिनल में चलाएं:
```bash
# टर्मिनल 1 (Backend API):
node backend/server.js

# टर्मिनल 2 (Frontend Vite):
cd frontend
npm run dev
```
ब्राउज़र में खोलें: **`http://localhost:5173`**

---

## 🗺️ Google Maps API Key Setup (वैकल्पिक)

1. ऐप को खोलें और ऊपर दायें कोने में **"Google API Key"** बटन पर क्लिक करें।
2. अपना Google Maps API Key डालें और **"Save & Apply Key"** पर क्लिक करें।
3. Google Maps JavaScript API, Traffic Layer और Directions तुरंत लाइव हो जाएंगे!
*(यदि आपके पास Google Maps API Key नहीं है, तब भी ऐप तुरंत इन-बिल्ट OpenStreetMap व विजुअल सिम्युलेटर पर 100% सुचारू रूप से कार्य करता है!)*

---

## 📡 REST API एंडपॉइंट्स (Endpoints)

| विधि (Method) | एंडपॉइंट (Endpoint) | विवरण (Description) |
|---|---|---|
| `GET` | `/api/health` | सर्वर हेल्थ चेक |
| `GET` | `/api/stations` | सभी CNG स्टेशनों की लाइव सूची (प्रेशर व कतार सहित) |
| `GET` | `/api/stations/:id` | किसी एक स्टेशन का संपूर्ण टेलीमेट्री विवरण |
| `POST` | `/api/stations/search-route` | रूट के आधार पर बेस्ट CNG पंप (कम गाड़ी + ज्यादा प्रेशर) का सुझाव |
| `POST` | `/api/telemetry/report` | पंप की वर्तमान स्थिति रिपोर्ट/अपडेट करें |

---

## 🌐 लाइव होस्टिंग (How to Deploy Live)

### Vercel / Netlify पर डिप्लॉय:
1. `frontend` फोल्डर को Vercel/Netlify पर लिंक करें।
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Environment Variable: `VITE_GOOGLE_MAPS_API_KEY` (वैकल्पिक)

### Render / Railway / Cloud VPS पर डिप्लॉय:
1. Root फोल्डर को लिंक करें।
2. Start Command: `node backend/server.js`
3. पोर्ट अपने आप `process.env.PORT` से ले लिया जाएगा।
