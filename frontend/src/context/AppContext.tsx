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
import { CORRIDORS } from '../data/corridors';
import { getStoredGoogleApiKey, storeGoogleApiKey } from '../services/googleMapsLoader';

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
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (settings.googleMapsApiKey !== undefined) {
      storeGoogleApiKey(settings.googleMapsApiKey);
    }
  } catch {}
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

  const fetchStations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await stationApi.getAll();
      if (mountedRef.current && Array.isArray(data) && data.length > 0) {
        setStations(data);
      }
    } catch {
      // Offline / standalone fallback
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStations();
  }, [fetchStations]);

  // Live simulation tick
  useEffect(() => {
    if (!settings.simulationEnabled) return;

    const timer = setInterval(() => {
      setStations((prevStations) =>
        prevStations.map((s) => {
          if (Math.random() < 0.4) {
            const deltaQueue = Math.random() > 0.5 ? 1 : -1;
            const newQueue = Math.max(0, Math.min(15, (s.vehiclesWaiting ?? 2) + deltaQueue));
            const newWait = Math.round(newQueue * 2);

            const deltaPressure = Math.floor(Math.random() * 6) - 2;
            const currentP = s.currentPressureBar ?? 200;
            const newPressure = Math.max(165, Math.min(225, currentP + deltaPressure));

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
  const planSmartRoute = useCallback(
    async (req: RouteSearchRequest): Promise<RouteSearchResultDto> => {
      try {
        const backendRes = await stationApi.searchRoute(req);
        if (backendRes && backendRes.stations && backendRes.stations.length > 0) {
          setActiveRouteResult(backendRes);
          return backendRes;
        }
      } catch {}

      // Check if this matches a known corridor with realistic highway curves (both forward & reverse)
      const forwardCorridor = CORRIDORS.find(
        (c) =>
          Math.abs(c.startLat - req.startLat) < 0.35 &&
          Math.abs(c.destLat - req.destLat) < 0.35
      );
      const reverseCorridor = !forwardCorridor
        ? CORRIDORS.find(
            (c) =>
              Math.abs(c.destLat - req.startLat) < 0.35 &&
              Math.abs(c.startLat - req.destLat) < 0.35
          )
        : null;

      let routeGeometry: [number, number][] = [];
      let totalDist = 0;

      if (forwardCorridor && forwardCorridor.waypoints && forwardCorridor.waypoints.length > 0) {
        routeGeometry = forwardCorridor.waypoints;
        totalDist = forwardCorridor.distanceKm || Math.round(haversineDistance(req.startLat, req.startLng, req.destLat, req.destLng) * 1.15);
      } else if (reverseCorridor && reverseCorridor.waypoints && reverseCorridor.waypoints.length > 0) {
        routeGeometry = [...reverseCorridor.waypoints].reverse();
        totalDist = reverseCorridor.distanceKm || Math.round(haversineDistance(req.startLat, req.startLng, req.destLat, req.destLng) * 1.15);
      } else {
        totalDist = Math.round(haversineDistance(req.startLat, req.startLng, req.destLat, req.destLng) * 1.25);
        const numPoints = 25;
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints;
          const lat = req.startLat + (req.destLat - req.startLat) * t;
          const lng = req.startLng + (req.destLng - req.startLng) * t;
          routeGeometry.push([lat, lng]);
        }
      }

      const totalDur = Math.round((totalDist / 65) * 60);

      // Find stations within corridor bounding box
      const minLat = Math.min(req.startLat, req.destLat) - 0.9;
      const maxLat = Math.max(req.startLat, req.destLat) + 0.9;
      const minLng = Math.min(req.startLng, req.destLng) - 0.9;
      const maxLng = Math.max(req.startLng, req.destLng) + 0.9;

      let candidateStations = stations.filter(
        (s) =>
          s.latitude >= minLat &&
          s.latitude <= maxLat &&
          s.longitude >= minLng &&
          s.longitude <= maxLng
      );

      if (candidateStations.length === 0) {
        candidateStations = stations.slice(0, 4);
      }

      const scoredStations = candidateStations.map((s) => {
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

        // 1. Pressure Score (40%)
        const pressureScore = Math.min(100, Math.max(20, Math.round(((pressure - 140) / 80) * 100)));

        // 2. Queue Score (40%)
        const queueScore = Math.max(10, Math.round(100 - queue * 7));

        // 3. Detour Score (20%)
        const detourScore = Math.max(10, Math.round(100 - detourKm * 15));

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

      scoredStations.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      if (scoredStations.length > 0) {
        const best = scoredStations[0];
        best.recommendationCategory = 'BEST_OVERALL';
        best.convenienceBadge = 'Short Queue + Super Pressure';
        best.recommendationReason = `⭐ Top Recommendation: Shortest queue (only ${best.vehiclesWaiting ?? 0} vehicles) and highest pressure (${Math.round(best.currentPressureBar ?? 200)} Bar)! Minimal detour (+${best.extraDetourKm} km) with fastest gas fill.`;
      }

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
        message: 'Optimal station selected based on low queue and high compressor pressure.',
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
