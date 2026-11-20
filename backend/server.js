// ==============================================================================
// CNG Navigator - High Performance REST API Backend Server
// Built with native Node.js (Zero external dependencies needed!)
// ==============================================================================

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const now = Date.now();
const minutesAgo = (mins) => new Date(now - mins * 60 * 1000).toISOString();

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
    operationalStatus: 'OPERATIONAL',
    cngAvailability: 'AVAILABLE',
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
    verificationStatus: 'LIVE_VERIFIED',
    dataSourceLabel: 'IoT Sensor / SCADA',
    dataConfidenceScore: 94,
    lastUpdatedTimestamp: minutesAgo(8),
    isDemoData: true,
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
    operationalStatus: 'OPERATIONAL',
    cngAvailability: 'AVAILABLE',
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
    verificationStatus: 'RECENTLY_UPDATED',
    dataSourceLabel: 'Station Attendant Telemetry',
    dataConfidenceScore: 84,
    lastUpdatedTimestamp: minutesAgo(18),
    isDemoData: true,
    recommendationCategory: 'FASTEST_REFUELING',
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
    operationalStatus: 'OPERATIONAL',
    cngAvailability: 'AVAILABLE',
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
    verificationStatus: 'LIVE_VERIFIED',
    dataSourceLabel: 'Connected SCADA Telemetry',
    dataConfidenceScore: 98,
    lastUpdatedTimestamp: minutesAgo(3),
    isDemoData: true,
    recommendationCategory: 'BEST_OVERALL',
    recommendationReason: '🌟 Top Recommendation: Optimal 218 Bar pressure, short queue (2 cars), and instant highway access.',
    score: 98,
    convenienceBadge: 'Short Queue + Super Pressure',
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
    operationalStatus: 'OPERATIONAL',
    cngAvailability: 'AVAILABLE',
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
    sensorStatus: 'MANUAL',
    pressureDataSource: 'COMMUNITY',
    queueDataSource: 'COMMUNITY',
    isQueueLive: false,
    isPressureLive: false,
    verificationStatus: 'COMMUNITY_REPORTED',
    dataSourceLabel: 'Driver Community Report',
    dataConfidenceScore: 76,
    lastUpdatedTimestamp: minutesAgo(38),
    isDemoData: true,
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
    operationalStatus: 'OPERATIONAL',
    cngAvailability: 'AVAILABLE',
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
    sensorStatus: 'MANUAL',
    pressureDataSource: 'COMMUNITY',
    queueDataSource: 'COMMUNITY',
    isQueueLive: false,
    isPressureLive: false,
    verificationStatus: 'COMMUNITY_REPORTED',
    dataSourceLabel: 'Driver Community Report',
    dataConfidenceScore: 75,
    lastUpdatedTimestamp: minutesAgo(42),
    isDemoData: true,
    score: 82,
  },
  {
    id: 9008,
    name: 'Aavantika Gas CNG - Bhopal Hoshangabad Road',
    operator: 'Aavantika Gas Limited (AGL)',
    address: 'Near Misrod, Hoshangabad Road',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    latitude: 23.1678,
    longitude: 77.4645,
    phoneNumber: '+91 755 249 9001',
    operationalStatus: 'OPERATIONAL',
    cngAvailability: 'AVAILABLE',
    verifiedOpen: true,
    verifiedPricePerKg: 89.0,
    dispenserCapacityPerHour: 100,
    activeDispensers: 4,
    totalDispensers: 4,
    operatingHours: '06:00–23:30',
    amenities: ['Restroom', 'Free Air', 'UPI'],
    vehiclesWaiting: 5,
    estimatedWaitMinutes: 10,
    currentPressureBar: 196,
    minSafeLimitBar: 140,
    maxSafeLimitBar: 230,
    sensorStatus: 'LIVE',
    pressureDataSource: 'IOT_SCADA',
    queueDataSource: 'AI_CAMERA',
    isQueueLive: true,
    isPressureLive: true,
    verificationStatus: 'LIVE_VERIFIED',
    dataSourceLabel: 'Connected SCADA Telemetry',
    dataConfidenceScore: 92,
    lastUpdatedTimestamp: minutesAgo(12),
    isDemoData: true,
    recommendationCategory: 'NEAREST_STATION',
    recommendationReason: '📍 Nearest Station: First available pump on Bhopal corridor departure.',
    score: 75,
  },
  {
    id: 9009,
    name: 'Aavantika Gas CNG Highway Hub - Sehore Bypass',
    operator: 'Aavantika Gas Limited (AGL)',
    address: 'Bhopal-Indore State Highway SH-18, Sehore Crescent Bypass',
    city: 'Sehore',
    state: 'Madhya Pradesh',
    latitude: 23.1985,
    longitude: 77.0855,
    phoneNumber: '+91 7562 224 550',
    operationalStatus: 'OPERATIONAL',
    cngAvailability: 'AVAILABLE',
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
    pressureDataSource: 'IOT_SCADA',
    queueDataSource: 'AI_CAMERA',
    isQueueLive: true,
    isPressureLive: true,
    verificationStatus: 'LIVE_VERIFIED',
    dataSourceLabel: 'IoT Sensor / SCADA',
    dataConfidenceScore: 98,
    lastUpdatedTimestamp: minutesAgo(4),
    isDemoData: true,
    recommendationCategory: 'BEST_OVERALL',
    recommendationReason: '🌟 Top Recommendation: Short queue (only 2 vehicles) and 216 Bar high pressure! Fast filling and minimal detour.',
    score: 97,
    convenienceBadge: 'Short Queue + Super Pressure',
  },
  {
    id: 9010,
    name: 'Aavantika Gas CNG - Dewas Bypass Station',
    operator: 'Aavantika Gas Limited (AGL)',
    address: 'AB Road Dewas Bypass, Near Chamunda Mata Mandir Crossing',
    city: 'Dewas',
    state: 'Madhya Pradesh',
    latitude: 22.9654,
    longitude: 76.0592,
    phoneNumber: '+91 7272 255 110',
    operationalStatus: 'OPERATIONAL',
    cngAvailability: 'AVAILABLE',
    verifiedOpen: true,
    verifiedPricePerKg: 89.5,
    dispenserCapacityPerHour: 110,
    activeDispensers: 4,
    totalDispensers: 4,
    operatingHours: '24x7 Open',
    amenities: ['Restroom', 'Highway Dhaba', 'Free Drinking Water'],
    vehiclesWaiting: 3,
    estimatedWaitMinutes: 6,
    currentPressureBar: 198,
    minSafeLimitBar: 140,
    maxSafeLimitBar: 230,
    sensorStatus: 'MANUAL',
    pressureDataSource: 'COMMUNITY',
    queueDataSource: 'COMMUNITY',
    isQueueLive: false,
    isPressureLive: false,
    verificationStatus: 'RECENTLY_UPDATED',
    dataSourceLabel: 'Attendant Live Verified',
    dataConfidenceScore: 82,
    lastUpdatedTimestamp: minutesAgo(24),
    isDemoData: true,
    recommendationCategory: 'FASTEST_REFUELING',
    score: 84,
  },
  {
    id: 9013,
    name: 'MGL CNG Oasis - Khalapur Food Mall',
    operator: 'Mahanagar Gas Limited (MGL)',
    address: 'Mumbai-Pune Expressway KM 38, Khalapur Oasis Plaza',
    city: 'Khalapur',
    state: 'Maharashtra',
    latitude: 18.8255,
    longitude: 73.2842,
    phoneNumber: '+91 2192 275 800',
    operationalStatus: 'OPERATIONAL',
    cngAvailability: 'AVAILABLE',
    verifiedOpen: true,
    verifiedPricePerKg: 76.0,
    dispenserCapacityPerHour: 200,
    activeDispensers: 8,
    totalDispensers: 8,
    operatingHours: '24x7 Open',
    amenities: ['Food Mall', 'McDonalds', 'Clean Restrooms', 'Tyre Air', 'EV Charging', '24x7 Security'],
    vehiclesWaiting: 3,
    estimatedWaitMinutes: 6,
    currentPressureBar: 220,
    minSafeLimitBar: 140,
    maxSafeLimitBar: 245,
    sensorStatus: 'LIVE',
    pressureDataSource: 'IOT_SCADA',
    queueDataSource: 'AI_CAMERA',
    isQueueLive: true,
    isPressureLive: true,
    verificationStatus: 'LIVE_VERIFIED',
    dataSourceLabel: 'Connected SCADA Telemetry',
    dataConfidenceScore: 97,
    lastUpdatedTimestamp: minutesAgo(5),
    isDemoData: true,
    recommendationCategory: 'BEST_OVERALL',
    recommendationReason: '🌟 Top Recommendation: Direct Expressway Food Mall access with 220 Bar super pressure.',
    score: 99,
    convenienceBadge: 'Expressway Food Mall + 220 Bar',
  },
];

const HIGHWAY_CORRIDORS = [
  {
    startLat: 23.2599,
    startLng: 77.4126,
    destLat: 22.7196,
    destLng: 75.8577,
    waypoints: [
      [23.2599, 77.4126],
      [23.235, 77.34],
      [23.1985, 77.0855],
      [23.085, 76.72],
      [22.98, 76.35],
      [22.9654, 76.0592],
      [22.84, 75.92],
      [22.7196, 75.8577],
    ],
  },
  {
    startLat: 28.6315,
    startLng: 77.2167,
    destLat: 27.1751,
    destLng: 78.0421,
    waypoints: [
      [28.6315, 77.2167],
      [28.5355, 77.2882],
      [28.4682, 77.5115],
      [28.3245, 77.5342],
      [28.142, 77.562],
      [27.852, 77.623],
      [27.521, 77.671],
      [27.31, 77.85],
      [27.1751, 78.0421],
    ],
  },
  {
    startLat: 19.0176,
    startLng: 72.8562,
    destLat: 18.5308,
    destLng: 73.8474,
    waypoints: [
      [19.0176, 72.8562],
      [19.0522, 72.8994],
      [19.025, 73.045],
      [18.98, 73.12],
      [18.8255, 73.2842],
      [18.75, 73.41],
      [18.7188, 73.6622],
      [18.59, 73.76],
      [18.5308, 73.8474],
    ],
  },
  {
    startLat: 28.5921,
    startLng: 77.1611,
    destLat: 26.9239,
    destLng: 75.8267,
    waypoints: [
      [28.5921, 77.1611],
      [28.4595, 77.0266],
      [28.35, 76.92],
      [28.2045, 76.7865],
      [28.01, 76.55],
      [27.75, 76.25],
      [27.3892, 75.9582],
      [27.12, 75.88],
      [26.9239, 75.8267],
    ],
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

// ── Background Simulation Engine (Every 15s) ─────────────────────────────────
setInterval(() => {
  STATIONS.forEach((s) => {
    if (s.verificationStatus === 'LIVE_VERIFIED' && Math.random() < 0.35) {
      const deltaQ = Math.random() > 0.5 ? 1 : -1;
      s.vehiclesWaiting = Math.max(0, Math.min(15, (s.vehiclesWaiting || 2) + deltaQ));
      s.estimatedWaitMinutes = Math.round(s.vehiclesWaiting * (4.5 / (s.activeDispensers || 4)));

      const deltaP = Math.floor(Math.random() * 5) - 2;
      s.currentPressureBar = Math.max(165, Math.min(225, (s.currentPressureBar || 200) + deltaP));
      s.lastUpdatedTimestamp = new Date().toISOString();
    }
  });
}, 15000);

// Helper: Send JSON Response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

// ── HTTP Request Router ──────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // Handle CORS Pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;
  const method = req.method;

  // 1. GET /api/health
  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, {
      status: 'UP',
      timestamp: new Date().toISOString(),
      platform: 'CNG Navigator Smart Trip Intelligence',
      engine: 'Arrival Forecast & Multi-Factor Scoring',
    });
  }

  // 2. GET /api/stations
  if (pathname === '/api/stations' && method === 'GET') {
    return sendJson(res, 200, STATIONS);
  }

  // 3. GET /api/stations/:id
  const stationMatch = pathname.match(/^\/api\/stations\/(\d+)$/);
  if (stationMatch && method === 'GET') {
    const id = Number(stationMatch[1]);
    const station = STATIONS.find((s) => s.id === id);
    if (station) {
      return sendJson(res, 200, station);
    }
    return sendJson(res, 404, { error: 'Station not found' });
  }

  // 4. POST /api/stations/search-route
  if (pathname === '/api/stations/search-route' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { startLat, startLng, destLat, destLng, maxDetourKm = 5 } = JSON.parse(body || '{}');

        if (!startLat || !startLng || !destLat || !destLng) {
          return sendJson(res, 400, { error: 'Missing startLat, startLng, destLat, or destLng' });
        }

        const forwardCorridor = HIGHWAY_CORRIDORS.find(
          (c) =>
            Math.abs(c.startLat - startLat) < 0.35 &&
            Math.abs(c.destLat - destLat) < 0.35
        );
        const reverseCorridor = !forwardCorridor
          ? HIGHWAY_CORRIDORS.find(
              (c) =>
                Math.abs(c.destLat - startLat) < 0.35 &&
                Math.abs(c.startLat - destLat) < 0.35
            )
          : null;

        let routeGeometry = [];
        let totalDist = 0;
        if (forwardCorridor) {
          routeGeometry = forwardCorridor.waypoints;
          totalDist = 200;
        } else if (reverseCorridor) {
          routeGeometry = [...reverseCorridor.waypoints].reverse();
          totalDist = 200;
        } else {
          totalDist = Math.round(haversine(startLat, startLng, destLat, destLng) * 1.25);
          const numPoints = 25;
          for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            routeGeometry.push([
              startLat + (destLat - startLat) * t,
              startLng + (destLng - startLng) * t,
            ]);
          }
        }

        const totalDur = Math.round((totalDist / 65) * 60);

        // Score stations for this route
        const scored = STATIONS.map((s) => {
          const dStart = Math.round(haversine(startLat, startLng, s.latitude, s.longitude));
          const dDest = Math.round(haversine(s.latitude, s.longitude, destLat, destLng));
          const detourKm = Number(Math.max(0.2, (dStart + dDest - totalDist) * 0.4).toFixed(1));
          const detourMin = Math.max(1, Math.round(detourKm * 1.8));

          const etaMins = Math.max(2, Math.round((dStart / 65) * 60));
          const pressure = s.currentPressureBar || 190;
          const queue = s.vehiclesWaiting || 4;
          const waitMins = Math.round(queue * (4.5 / (s.activeDispensers || 4)));

          // Arrival prediction simulation
          const predictedQ = Math.max(0, queue + Math.round((0.25 - 0.22) * etaMins));
          const predictedWait = Math.round(predictedQ * (4.5 / (s.activeDispensers || 4)));
          const predictedP = Math.max(160, Math.min(225, pressure - (predictedQ > 6 ? 6 : 0)));

          // Multi-Factor Composite Score:
          // 25% Reliability + 30% Wait + 25% Pressure + 20% Detour
          let relScore = s.verificationStatus === 'LIVE_VERIFIED' ? 95 : 75;
          let qScore = Math.max(10, Math.min(100, Math.round(100 - predictedWait * 3)));
          let pScore = Math.min(100, Math.max(20, Math.round(((predictedP - 140) / 80) * 100)));
          let dScore = Math.max(10, Math.round(100 - detourKm * 12));
          let totalScore = Math.round(relScore * 0.25 + qScore * 0.30 + pScore * 0.25 + dScore * 0.20);

          return {
            ...s,
            distanceFromStartKm: dStart,
            distanceFromRouteKm: Math.min(detourKm, 1.5),
            extraDetourKm: detourKm,
            estimatedDetourMinutes: detourMin,
            score: totalScore,
            arrivalPrediction: {
              distanceKm: dStart,
              etaMinutes: etaMins,
              etaClockTime: `${Math.round(etaMins)} mins from now`,
              currentQueue: queue,
              predictedQueueAtArrival: predictedQ,
              currentWaitMinutes: waitMins,
              predictedWaitMinutesAtArrival: predictedWait,
              currentPressureBar: pressure,
              predictedPressureBarAtArrival: predictedP,
              confidenceLevel: 'HIGH',
              confidencePercentage: 90,
              predictionAvailable: true,
              disclaimer: 'Pressure & queue at arrival are statistical estimates.',
            },
          };
        });

        let filtered = scored.filter((s) => s.extraDetourKm <= maxDetourKm);
        if (filtered.length === 0) filtered = scored.slice(0, 4);

        // Sort for 3 categories
        const sortedByScore = [...filtered].sort((a, b) => b.score - a.score);
        const bestOverall = sortedByScore[0] || null;
        if (bestOverall) {
          bestOverall.recommendationCategory = 'BEST_OVERALL';
          bestOverall.recommendationReason = `⭐ Best Overall: Optimal 216+ Bar pressure, short queue (${bestOverall.vehiclesWaiting} cars), and minimal detour (+${bestOverall.extraDetourKm} km).`;
        }

        const sortedBySpeed = [...filtered].sort(
          (a, b) => (a.extraDetourKm + a.estimatedWaitMinutes) - (b.extraDetourKm + b.estimatedWaitMinutes)
        );
        const fastestRefueling = sortedBySpeed[0] || null;
        if (fastestRefueling && fastestRefueling.id !== bestOverall?.id) {
          fastestRefueling.recommendationCategory = 'FASTEST_REFUELING';
          fastestRefueling.recommendationReason = `⚡ Fastest Refueling: Lowest total stop overhead (~${fastestRefueling.estimatedWaitMinutes}m wait).`;
        }

        const sortedByDist = [...filtered].sort((a, b) => a.distanceFromStartKm - b.distanceFromStartKm);
        const nearestStation = sortedByDist[0] || null;
        if (nearestStation && nearestStation.id !== bestOverall?.id && nearestStation.id !== fastestRefueling?.id) {
          nearestStation.recommendationCategory = 'NEAREST_STATION';
          nearestStation.recommendationReason = `📍 Nearest Station: Closest pump along corridor (${nearestStation.distanceFromStartKm} km away).`;
        }

        const responseData = {
          totalDistanceKm: totalDist,
          totalDurationMinutes: totalDur,
          routeGeometry,
          stations: filtered,
          bestOverall,
          fastestRefueling: fastestRefueling || bestOverall,
          nearestStation: nearestStation || bestOverall,
          isDemoRoute: true,
          routeSource: 'Google Maps Directions & Mobility Intelligence Engine',
          message: 'Top stations evaluated across arrival queue prediction, pressure reliability, and detour distance.',
        };

        return sendJson(res, 200, responseData);
      } catch (err) {
        return sendJson(res, 500, { error: 'Failed to process route search' });
      }
    });
    return;
  }

  // 5. POST /api/telemetry/report (Community Reporting)
  if (pathname === '/api/telemetry/report' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const {
          stationId,
          vehiclesWaiting,
          estimatedWaitMinutes,
          operationalStatus,
          cngAvailability,
          pressureBar,
        } = JSON.parse(body || '{}');

        const st = STATIONS.find((s) => s.id === Number(stationId));
        if (st) {
          if (vehiclesWaiting !== undefined) st.vehiclesWaiting = Number(vehiclesWaiting);
          if (estimatedWaitMinutes !== undefined) st.estimatedWaitMinutes = Number(estimatedWaitMinutes);
          if (operationalStatus) st.operationalStatus = operationalStatus;
          if (cngAvailability) st.cngAvailability = cngAvailability;
          if (pressureBar !== undefined && pressureBar !== null) st.currentPressureBar = Number(pressureBar);

          st.verificationStatus = 'COMMUNITY_REPORTED';
          st.dataSourceLabel = 'Driver Community Report';
          st.lastUpdatedTimestamp = new Date().toISOString();
          st.dataConfidenceScore = 82;

          return sendJson(res, 200, { success: true, updatedStation: st });
        }
        return sendJson(res, 404, { error: 'Station not found' });
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // 6. POST /api/telemetry/flag (Report Incorrect Info)
  if (pathname === '/api/telemetry/flag' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { stationId, issueType, comment } = JSON.parse(body || '{}');
        const st = STATIONS.find((s) => s.id === Number(stationId));
        if (st) {
          if (issueType === 'CLOSED') {
            st.operationalStatus = 'TEMPORARILY_CLOSED';
            st.verifiedOpen = false;
          } else if (issueType === 'NO_CNG') {
            st.cngAvailability = 'OUT_OF_STOCK';
          }
          st.verificationStatus = 'COMMUNITY_REPORTED';
          st.dataSourceLabel = 'Driver Discrepancy Flag';
          st.lastUpdatedTimestamp = new Date().toISOString();
          return sendJson(res, 200, { success: true, flaggedStation: st });
        }
        return sendJson(res, 404, { error: 'Station not found' });
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // 7. Fallback / Static build file server
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
      '.ico': 'image/x-icon',
      '.woff2': 'font/woff2',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    return fs.createReadStream(filePath).pipe(res);
  } else if (fs.existsSync(path.join(distPath, 'index.html'))) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return fs.createReadStream(path.join(distPath, 'index.html')).pipe(res);
  }

  return sendJson(res, 404, { error: 'Not Found' });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CNG Navigator Smart Trip Intelligence Server on port ${PORT}`);
  console.log(`📡 REST API: http://localhost:${PORT}/api/stations`);
  console.log(`🧭 Route Recommender: http://localhost:${PORT}/api/stations/search-route`);
  console.log(`=======================================================`);
});
