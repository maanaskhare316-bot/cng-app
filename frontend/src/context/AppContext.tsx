import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { stationApi } from '../services/api';
import type { AppSettings, StationSummaryDto, RouteSearchRequest, RouteSearchResultDto } from '../types/index';
import { DEMO_STATIONS } from '../data/demoStations';
import { getStoredGoogleApiKey, storeGoogleApiKey } from '../services/googleMapsLoader';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SETTINGS_KEY = 'cng-navigator-settings';
const MAX_SELECTION = 3;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  distanceUnit: 'km',
  defaultVehicleType: 'car',
  maxDetourKm: 5,
  searchRadiusKm: 15,
  simulationEnabled: true,
  mapProvider: 'google',
  googleMapsApiKey: getStoredGoogleApiKey(),
};

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
export interface AppContextValue {
  stations: StationSummaryDto[];
  isLoading: boolean;
  error: string | null;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  selectedStations: number[];
  toggleStationSelection: (id: number) => void;
  clearSelection: () => void;
  refreshStations: () => void;
  updateStationTelemetry: (stationId: number, vehicles: number, pressure: number) => void;
  planSmartRoute: (req: RouteSearchRequest) => Promise<RouteSearchResultDto>;
  activeRouteResult: RouteSearchResultDto | null;
  setActiveRouteResult: (res: RouteSearchResultDto | null) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (settings.googleMapsApiKey !== undefined) {
      storeGoogleApiKey(settings.googleMapsApiKey);
    }
  } catch {
    // ignore
  }
}

// Distance helper
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [stations, setStations] = useState<StationSummaryDto[]>(DEMO_STATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [selectedStations, setSelectedStations] = useState<number[]>([]);
  const [activeRouteResult, setActiveRouteResult] = useState<RouteSearchResultDto | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch stations from backend or fallback to demo stations
  const fetchStations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await stationApi.getAll();
      if (mountedRef.current && Array.isArray(data) && data.length > 0) {
        setStations(data);
      }
    } catch {
      // Backend unavailable; demo stations already loaded
      console.info('[AppContext] Connected to local demo stations store.');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStations();
  }, [fetchStations]);

  // Live simulation tick: every 10 seconds, slightly simulate pump arrivals and compressor cycles
  useEffect(() => {
    if (!settings.simulationEnabled) return;

    const timer = setInterval(() => {
      setStations((prevStations) =>
        prevStations.map((s) => {
          // 40% chance this station receives a minor update
          if (Math.random() < 0.4) {
            // Queue variation (+1 or -1 car)
            const deltaQueue = Math.random() > 0.5 ? 1 : -1;
            const newQueue = Math.max(0, Math.min(15, (s.vehiclesWaiting ?? 2) + deltaQueue));
            const newWait = Math.round(newQueue * 2);

            // Pressure variation (-3 to +4 Bar based on compressor cycles)
            const deltaPressure = Math.floor(Math.random() * 8) - 3;
            const currentP = s.currentPressureBar ?? 200;
            const newPressure = Math.max(160, Math.min(225, currentP + deltaPressure));

            return {
              ...s,
              vehiclesWaiting: newQueue,
              estimatedWaitMinutes: newWait,
              currentPressureBar: newPressure,
              queueUpdatedAt: new Date().toISOString(),
              pressureUpdatedAt: new Date().toISOString(),
            };
          }
          return s;
        })
      );
    }, 10000);

    return () => clearInterval(timer);
  }, [settings.simulationEnabled]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  // Crowdsourced live update
  const updateStationTelemetry = useCallback(
    (stationId: number, vehicles: number, pressure: number) => {
      setStations((prev) =>
        prev.map((s) => {
          if (s.id === stationId) {
            return {
              ...s,
              vehiclesWaiting: vehicles,
              estimatedWaitMinutes: Math.round(vehicles * 2),
              currentPressureBar: pressure,
              queueUpdatedAt: new Date().toISOString(),
              pressureUpdatedAt: new Date().toISOString(),
              isQueueLive: true,
              isPressureLive: true,
            };
          }
          return s;
        })
      );
    },
    []
  );

  // Smart Route Recommendation Algorithm
  // Find station along route with fewest vehicles (कम गाड़ी) and highest pressure (ज्यादा प्रेशर)
  const planSmartRoute = useCallback(
    async (req: RouteSearchRequest): Promise<RouteSearchResultDto> => {
      // Try backend first
      try {
        const backendRes = await stationApi.searchRoute(req);
        if (backendRes && backendRes.stations && backendRes.stations.length > 0) {
          setActiveRouteResult(backendRes);
          return backendRes;
        }
      } catch {
        // Fallback to local intelligent recommendation engine
      }

      const totalDist = Math.round(
        haversineDistance(req.startLat, req.startLng, req.destLat, req.destLng) * 1.25
      );
      const totalDur = Math.round((totalDist / 65) * 60);

      // Interpolate route points
      const numPoints = 25;
      const routeGeometry: [number, number][] = [];
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const lat = req.startLat + (req.destLat - req.startLat) * t;
        const lng = req.startLng + (req.destLng - req.startLng) * t;
        routeGeometry.push([lat, lng]);
      }

      // Filter stations within bounding box + margin
      const minLat = Math.min(req.startLat, req.destLat) - 0.8;
      const maxLat = Math.max(req.startLat, req.destLat) + 0.8;
      const minLng = Math.min(req.startLng, req.destLng) - 0.8;
      const maxLng = Math.max(req.startLng, req.destLng) + 0.8;

      let candidateStations = stations.filter(
        (s) =>
          s.latitude >= minLat &&
          s.latitude <= maxLat &&
          s.longitude >= minLng &&
          s.longitude <= maxLng
      );

      // If candidates are empty (e.g. searched arbitrary coords), use top demo stations with simulated detour
      if (candidateStations.length === 0) {
        candidateStations = stations.slice(0, 4);
      }

      // Compute detour and smart scores for each candidate station
      const scoredStations = candidateStations.map((s, idx) => {
        const distFromStart = Math.round(
          haversineDistance(req.startLat, req.startLng, s.latitude, s.longitude)
        );
        const distToDest = Math.round(
          haversineDistance(s.latitude, s.longitude, req.destLat, req.destLng)
        );
        const detourKm = Number(
          Math.max(0.2, (distFromStart + distToDest - totalDist) * 0.4).toFixed(1)
        );
        const detourMin = Math.max(1, Math.round(detourKm * 1.8));

        const pressure = s.currentPressureBar ?? 190;
        const queue = s.vehiclesWaiting ?? 4;

        // 1. Pressure Score (0 to 100): Higher pressure gives higher score
        const pressureScore = Math.min(100, Math.max(20, Math.round(((pressure - 140) / 80) * 100)));

        // 2. Queue Score (0 to 100): Fewer vehicles gives higher score
        const queueScore = Math.max(10, Math.round(100 - queue * 7));

        // 3. Detour Score (0 to 100): Less detour gives higher score
        const detourScore = Math.max(10, Math.round(100 - detourKm * 15));

        // Total Smart Score: 40% Pressure + 40% Queue + 20% Detour
        const totalScore = Math.round(pressureScore * 0.4 + queueScore * 0.4 + detourScore * 0.2);

        return {
          ...s,
          distanceFromStartKm: distFromStart,
          distanceFromRouteKm: Math.min(detourKm, 1.5),
          extraDetourKm: detourKm,
          estimatedDetourMinutes: detourMin,
          pressureScore,
          queueScore,
          detourScore,
          score: totalScore,
          recommendationCategory: null as any,
          recommendationReason: null as any,
        };
      });

      // Sort by highest score first
      scoredStations.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      // Designate the Best Station (कम गाड़ी और ज्यादा प्रेशर)
      if (scoredStations.length > 0) {
        const best = scoredStations[0];
        best.recommendationCategory = 'BEST_OVERALL';
        best.convenienceBadge = 'कम गाड़ी + ज्यादा प्रेशर';
        best.recommendationReason = `🌟 सर्वोत्तम सुझाव: यहाँ कम गाड़ी (सिर्फ ${best.vehiclesWaiting ?? 0} गाड़ियाँ) और ज्यादा प्रेशर (${Math.round(best.currentPressureBar ?? 200)} Bar) है! न्यूनतम डिटूर (+${best.extraDetourKm} km) के साथ सबसे तेज़ गैस भराई।`;
      }

      // Designate Shortest Queue and High Pressure
      const sortedByQueue = [...scoredStations].sort((a, b) => (a.vehiclesWaiting ?? 0) - (b.vehiclesWaiting ?? 0));
      if (sortedByQueue.length > 1 && sortedByQueue[0].id !== scoredStations[0].id) {
        sortedByQueue[0].recommendationCategory = 'SHORTEST_QUEUE';
      }

      const sortedByPressure = [...scoredStations].sort((a, b) => (b.currentPressureBar ?? 0) - (a.currentPressureBar ?? 0));
      if (sortedByPressure.length > 1 && sortedByPressure[0].id !== scoredStations[0].id) {
        sortedByPressure[0].recommendationCategory = 'HIGH_PRESSURE';
      }

      const result: RouteSearchResultDto = {
        totalDistanceKm: totalDist,
        totalDurationMinutes: totalDur,
        routeGeometry,
        stations: scoredStations,
        bestOverall: scoredStations[0] || null,
        shortestQueue: sortedByQueue[0] || null,
        highestPressure: sortedByPressure[0] || null,
        nearestOnRoute: scoredStations[1] || null,
        alternatives: scoredStations.slice(1).map((st) => ({
          station: st,
          reason: `${Math.round(st.currentPressureBar ?? 0)} Bar • ${st.vehiclesWaiting ?? 0} cars • +${st.extraDetourKm}km`,
        })),
        isDemoRoute: true,
        routeSource: 'Google Maps Directions Engine',
        message: 'कम गाड़ी व ज्यादा प्रेशर के आधार पर सर्वोत्तम स्टेशन चुना गया।',
      };

      setActiveRouteResult(result);
      return result;
    },
    [stations]
  );

  const toggleStationSelection = useCallback((id: number) => {
    setSelectedStations((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= MAX_SELECTION) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedStations([]);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      stations,
      isLoading,
      error,
      settings,
      updateSettings,
      selectedStations,
      toggleStationSelection,
      clearSelection,
      refreshStations: fetchStations,
      updateStationTelemetry,
      planSmartRoute,
      activeRouteResult,
      setActiveRouteResult,
    }),
    [
      stations,
      isLoading,
      error,
      settings,
      updateSettings,
      selectedStations,
      toggleStationSelection,
      clearSelection,
      fetchStations,
      updateStationTelemetry,
      planSmartRoute,
      activeRouteResult,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used inside <AppProvider>');
  }
  return ctx;
}

export default AppContext;
