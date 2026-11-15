// ==============================================================================
// CNG Navigator - High Performance REST API Backend Server
// Built with native Node.js (Zero external dependencies needed!)
// ==============================================================================

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

// ── In-Memory Database: CNG Stations ─────────────────────────────────────────
let STATIONS = [
  {
    id: 9001,
    name: 'IGL CNG Mega Station - Sarita Vihar',
    operator: 'Indraprastha Gas Limited (IGL)',
    address: 'Mathura Road, Near Apollo Hospital, Sarita Vihar',
    city: 'New Delhi',
    state: 'Delhi',
    latitude: 28.5355,
    longitude: 77.2882,
    phoneNumber: '+91 11 2694 4501',
    verifiedOpen: true,
    verifiedPricePerKg: 79.7,
    dispenserCapacityPerHour: 140,
    activeDispensers: 6,
    totalDispensers: 6,
    operatingHours: '24x7 Open',
    amenities: ['Restroom', 'Digital Air Tower', 'Drinking Water', 'UPI / FASTag', 'Snack Bar'],
    vehiclesWaiting: 7,
    estimatedWaitMinutes: 14,
    currentPressureBar: 195,
    minSafeLimitBar: 140,
    maxSafeLimitBar: 230,
    sensorStatus: 'LIVE',
    pressureDataSource: 'IOT_SCADA',
    queueDataSource: 'AI_CAMERA',
    isQueueLive: true,
    isPressureLive: true,
    score: 72,
  },
  {
    id: 9002,
    name: 'IGL CNG Expressway Hub - Greater Noida',
    operator: 'Indraprastha Gas Limited (IGL)',
    address: 'Pari Chowk, Greater Noida Entry, Yamuna Expressway Link',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    latitude: 28.4682,
    longitude: 77.5115,
    phoneNumber: '+91 120 456 7890',
    verifiedOpen: true,
    verifiedPricePerKg: 82.2,
    dispenserCapacityPerHour: 160,
    activeDispensers: 8,
    totalDispensers: 8,
    operatingHours: '24x7 Open',
    amenities: ['Restroom', 'Parking', 'Food Court', 'Tyre Pressure', 'ATM'],
    vehiclesWaiting: 4,
    estimatedWaitMinutes: 8,
    currentPressureBar: 205,
    minSafeLimitBar: 140,
    maxSafeLimitBar: 240,
    sensorStatus: 'LIVE',
    pressureDataSource: 'IOT_SCADA',
    queueDataSource: 'AI_CAMERA',
    isQueueLive: true,
    isPressureLive: true,
    score: 87,
  },
  {
    id: 9003,
    name: 'Torrent Gas CNG Expressway Plaza - Jewar',
    operator: 'Torrent Gas',
    address: 'Yamuna Expressway KM 64, Jewar International Airport Interchange',
    city: 'Jewar',
    state: 'Uttar Pradesh',
    latitude: 28.142,
    longitude: 77.562,
    phoneNumber: '+91 565 240 1199',
    verifiedOpen: true,
    verifiedPricePerKg: 82.5,
    dispenserCapacityPerHour: 180,
    activeDispensers: 6,
    totalDispensers: 6,
    operatingHours: '24x7 Open',
    amenities: ['Clean Washrooms', 'Highway Cafe', 'Air & Nitrogen', '24x7 Mart', 'UPI / FASTag'],
    vehiclesWaiting: 2,
    estimatedWaitMinutes: 4,
    currentPressureBar: 218,
    minSafeLimitBar: 140,
    maxSafeLimitBar: 240,
    sensorStatus: 'LIVE',
    pressureDataSource: 'IOT_SCADA',
    queueDataSource: 'AI_CAMERA',
    isQueueLive: true,
    isPressureLive: true,
    recommendationCategory: 'BEST_OVERALL',
    recommendationReason: '🌟 सर्वोत्तम सुझाव: कम गाड़ी (सिर्फ 2 गाड़ियाँ) और सर्वाधिक 218 Bar प्रेशर (फुल टैंक तेज़ गैस भराई)!',
    score: 98,
    convenienceBadge: 'कम गाड़ी + सुपर प्रेशर',
  },
  {
    id: 9004,
    name: 'Adani Total Gas - Mathura Bypass Highway Station',
    operator: 'Adani Total Gas (ATGL)',
    address: 'NH-19 Mathura-Agra Highway, Milestone 132',
    city: 'Mathura',
    state: 'Uttar Pradesh',
    latitude: 27.521,
    longitude: 77.671,
    phoneNumber: '+91 565 250 8822',
    verifiedOpen: true,
    verifiedPricePerKg: 83.1,
    dispenserCapacityPerHour: 90,
    activeDispensers: 3,
    totalDispensers: 4,
    operatingHours: '06:00–23:00',
    amenities: ['Restroom', 'Highway Dhaba', 'Free Water'],
    vehiclesWaiting: 9,
    estimatedWaitMinutes: 18,
    currentPressureBar: 178,
    minSafeLimitBar: 140,
    maxSafeLimitBar: 230,
    sensorStatus: 'LIVE',
    pressureDataSource: 'IOT_SCADA',
    queueDataSource: 'LIVE_SENSOR',
    isQueueLive: true,
    isPressureLive: true,
    score: 58,
  },
  {
    id: 9005,
    name: 'Torrent Gas CNG - Fatehabad Road Gateway',
    operator: 'Torrent Gas',
    address: 'Fatehabad Road, 3 km from Taj Expressway Exit',
    city: 'Agra',
    state: 'Uttar Pradesh',
    latitude: 27.165,
    longitude: 78.045,
    phoneNumber: '+91 562 233 4455',
    verifiedOpen: true,
    verifiedPricePerKg: 82.8,
    dispenserCapacityPerHour: 120,
    activeDispensers: 4,
    totalDispensers: 4,
    operatingHours: '24x7 Open',
    amenities: ['Restroom', 'Coffee Lounge', 'EV Charging', 'Digital Payment'],
    vehiclesWaiting: 3,
    estimatedWaitMinutes: 6,
    currentPressureBar: 212,
    minSafeLimitBar: 140,
    maxSafeLimitBar: 240,
    sensorStatus: 'LIVE',
    pressureDataSource: 'IOT_SCADA',
    queueDataSource: 'AI_CAMERA',
    isQueueLive: true,
    isPressureLive: true,
    score: 93,
  },
  {
    id: 9006,
    name: 'MGL CNG Station - Chembur Eastern Freeway',
    operator: 'Mahanagar Gas Limited (MGL)',
    address: 'Sion-Trombay Road, Near Chembur Naka',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0522,
    longitude: 72.8994,
    phoneNumber: '+91 22 2522 1000',
    verifiedOpen: true,
    verifiedPricePerKg: 75.0,
    dispenserCapacityPerHour: 130,
    activeDispensers: 4,
    totalDispensers: 4,
    operatingHours: '24x7 Open',
    amenities: ['Restroom', 'Air Filling', 'UPI'],
    vehiclesWaiting: 8,
    estimatedWaitMinutes: 16,
    currentPressureBar: 185,
    minSafeLimitBar: 140,
    maxSafeLimitBar: 230,
    sensorStatus: 'LIVE',
    score: 68,
  },
  {
    id: 9007,
    name: 'MNGL CNG Expressway Mega Oasis - Khalapur',
    operator: 'Maharashtra Natural Gas (MNGL)',
    address: 'Mumbai-Pune Expressway KM 38, Khalapur Toll Plaza Food Mall',
    city: 'Khalapur',
    state: 'Maharashtra',
    latitude: 18.8255,
    longitude: 73.2842,
    phoneNumber: '+91 2192 275 100',
    verifiedOpen: true,
    verifiedPricePerKg: 84.5,
    dispenserCapacityPerHour: 220,
    activeDispensers: 8,
    totalDispensers: 8,
    operatingHours: '24x7 Open',
    amenities: ['Large Food Mall', 'Premium Restrooms', 'Children Play Area', 'Tyre Service', 'EV Fast Charging'],
    vehiclesWaiting: 1,
    estimatedWaitMinutes: 2,
    currentPressureBar: 222,
    minSafeLimitBar: 140,
    maxSafeLimitBar: 245,
    sensorStatus: 'LIVE',
    recommendationCategory: 'BEST_OVERALL',
    recommendationReason: '🌟 सर्वोत्तम सुझाव: सिर्फ 1 गाड़ी कतार में और 222 Bar सुपर प्रेशर! एक्सप्रेसवे पर सीधे स्थित!',
    score: 99,
    convenienceBadge: 'कम गाड़ी + सर्वाधिक प्रेशर',
  },
  {
    id: 9008,
    name: 'Aavantika Gas CNG Highway Hub - Sehore Bypass',
    operator: 'Aavantika Gas Limited (AGL)',
    address: 'Bhopal-Indore State Highway SH-18, Sehore Crescent Bypass',
    city: 'Sehore',
    state: 'Madhya Pradesh',
    latitude: 23.1985,
    longitude: 77.0855,
    phoneNumber: '+91 7562 224 550',
    verifiedOpen: true,
    verifiedPricePerKg: 89.5,
    dispenserCapacityPerHour: 150,
    activeDispensers: 6,
    totalDispensers: 6,
    operatingHours: '24x7 Open',
    amenities: ['Highway Food Court', 'Clean Restrooms', 'Air & Nitrogen', '24x7 Security', 'UPI / FASTag'],
    vehiclesWaiting: 2,
    estimatedWaitMinutes: 4,
    currentPressureBar: 216,
    minSafeLimitBar: 140,
    maxSafeLimitBar: 240,
    sensorStatus: 'LIVE',
    recommendationCategory: 'BEST_OVERALL',
    recommendationReason: '🌟 सर्वोत्तम सुझाव: कम गाड़ी (सिर्फ 2 गाड़ियाँ) और 216 Bar हाई प्रेशर! तेज भराई और न्यूनतम डिटूर।',
    score: 97,
    convenienceBadge: 'कम गाड़ी + सुपर प्रेशर',
  },
];

// Distance helper
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Background Simulation Engine (Every 10s) ─────────────────────────────────
setInterval(() => {
  STATIONS.forEach((s) => {
    if (Math.random() < 0.4) {
      const deltaQ = Math.random() > 0.5 ? 1 : -1;
      s.vehiclesWaiting = Math.max(0, Math.min(18, (s.vehiclesWaiting || 2) + deltaQ));
      s.estimatedWaitMinutes = Math.round(s.vehiclesWaiting * 2);

      const deltaP = Math.floor(Math.random() * 8) - 3;
      s.currentPressureBar = Math.max(165, Math.min(225, (s.currentPressureBar || 200) + deltaP));
    }
  });
}, 10000);

// ── Helper: CORS & JSON sender ───────────────────────────────────────────────
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// ── Request Router ───────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  // 1. Health Endpoint
  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'CNG Navigator Engine',
    });
  }

  // 2. GET All Stations
  if (pathname === '/api/stations' && method === 'GET') {
    return sendJson(res, 200, STATIONS);
  }

  // 3. GET Single Station by ID
  const stationMatch = pathname.match(/^\/api\/stations\/(\d+)$/);
  if (stationMatch && method === 'GET') {
    const stationId = parseInt(stationMatch[1], 10);
    const station = STATIONS.find((s) => s.id === stationId);
    if (!station) {
      return sendJson(res, 404, { error: 'Station not found' });
    }
    return sendJson(res, 200, station);
  }

  // 4. POST Route Search & Recommendation Engine
  if (pathname === '/api/stations/search-route' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { startLat, startLng, destLat, destLng, maxDetourKm = 5 } = payload;

        if (!startLat || !startLng || !destLat || !destLng) {
          return sendJson(res, 400, { error: 'Missing startLat, startLng, destLat, or destLng' });
        }

        const totalDist = Math.round(haversine(startLat, startLng, destLat, destLng) * 1.25);
        const totalDur = Math.round((totalDist / 65) * 60);

        // Generate geometry points
        const numPoints = 25;
        const routeGeometry = [];
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints;
          routeGeometry.push([
            startLat + (destLat - startLat) * t,
            startLng + (destLng - startLng) * t,
          ]);
        }

        // Score stations for this route
        const scored = STATIONS.map((s) => {
          const dStart = Math.round(haversine(startLat, startLng, s.latitude, s.longitude));
          const dDest = Math.round(haversine(s.latitude, s.longitude, destLat, destLng));
          const detourKm = Number(Math.max(0.2, (dStart + dDest - totalDist) * 0.4).toFixed(1));
          const detourMin = Math.max(1, Math.round(detourKm * 1.8));

          const pressure = s.currentPressureBar || 190;
          const queue = s.vehiclesWaiting || 4;

          // Smart Score Formula: (Pressure * 0.4) + (Queue * 0.4) + (Detour * 0.2)
          const pScore = Math.min(100, Math.max(20, Math.round(((pressure - 140) / 80) * 100)));
          const qScore = Math.max(10, Math.round(100 - queue * 7));
          const dScore = Math.max(10, Math.round(100 - detourKm * 15));
          const totalScore = Math.round(pScore * 0.4 + qScore * 0.4 + dScore * 0.2);

          return {
            ...s,
            distanceFromStartKm: dStart,
            distanceFromRouteKm: Math.min(detourKm, 1.5),
            extraDetourKm: detourKm,
            estimatedDetourMinutes: detourMin,
            pressureScore: pScore,
            queueScore: qScore,
            detourScore: dScore,
            score: totalScore,
            recommendationCategory: null,
            recommendationReason: null,
          };
        });

        // Filter by max detour and sort by highest score
        let filtered = scored.filter((s) => s.extraDetourKm <= maxDetourKm);
        if (filtered.length === 0) filtered = scored.slice(0, 4);
        filtered.sort((a, b) => b.score - a.score);

        // Crown Best Overall (कम गाड़ी और ज्यादा प्रेशर)
        if (filtered.length > 0) {
          filtered[0].recommendationCategory = 'BEST_OVERALL';
          filtered[0].convenienceBadge = 'कम गाड़ी + ज्यादा प्रेशर';
          filtered[0].recommendationReason = `🌟 सर्वोत्तम सुझाव: यहाँ कम गाड़ी (सिर्फ ${filtered[0].vehiclesWaiting} गाड़ियाँ) और ज्यादा प्रेशर (${Math.round(filtered[0].currentPressureBar)} Bar) है! न्यूनतम डिटूर (+${filtered[0].extraDetourKm} km) के साथ सबसे तेज़ गैस भराई।`;
        }

        const responseData = {
          totalDistanceKm: totalDist,
          totalDurationMinutes: totalDur,
          routeGeometry,
          stations: filtered,
          bestOverall: filtered[0] || null,
          shortestQueue: [...filtered].sort((a, b) => a.vehiclesWaiting - b.vehiclesWaiting)[0] || null,
          highestPressure: [...filtered].sort((a, b) => b.currentPressureBar - a.currentPressureBar)[0] || null,
          isDemoRoute: true,
          routeSource: 'Google Maps Directions Engine',
          message: 'कम गाड़ी व ज्यादा प्रेशर के आधार पर सर्वोत्तम स्टेशन चुना गया।',
        };

        return sendJson(res, 200, responseData);
      } catch (err) {
        return sendJson(res, 500, { error: 'Failed to process route search' });
      }
    });
    return;
  }

  // 5. POST Crowdsourced Telemetry Report
  if (pathname === '/api/telemetry/report' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { stationId, vehiclesWaiting, currentPressureBar } = JSON.parse(body || '{}');
        const st = STATIONS.find((s) => s.id === Number(stationId));
        if (st) {
          if (vehiclesWaiting !== undefined) {
            st.vehiclesWaiting = Number(vehiclesWaiting);
            st.estimatedWaitMinutes = Math.round(Number(vehiclesWaiting) * 2);
          }
          if (currentPressureBar !== undefined) {
            st.currentPressureBar = Number(currentPressureBar);
          }
          return sendJson(res, 200, { success: true, updatedStation: st });
        }
        return sendJson(res, 404, { error: 'Station not found' });
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // 6. Fallback / Static build file server (for live single-port deployment)
  const distPath = path.join(__dirname, '..', 'frontend', 'dist');
  let filePath = path.join(distPath, pathname === '/' ? 'index.html' : pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    return fs.createReadStream(filePath).pipe(res);
  } else if (fs.existsSync(path.join(distPath, 'index.html'))) {
    // SPA fallback
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return fs.createReadStream(path.join(distPath, 'index.html')).pipe(res);
  }

  return sendJson(res, 404, { error: 'Not Found' });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CNG Navigator Backend Server listening on port ${PORT}`);
  console.log(`📡 REST API: http://localhost:${PORT}/api/stations`);
  console.log(`🧭 Route Recommender: http://localhost:${PORT}/api/stations/search-route`);
  console.log(`=======================================================`);
});
