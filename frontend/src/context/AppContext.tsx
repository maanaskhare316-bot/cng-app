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
import type {
  AppSettings,
  StationSummaryDto,
  RouteSearchRequest,
  RouteSearchResultDto,
  CommunityReportPayload,
  IncorrectInfoFlagPayload,
} from '../types/index';
import { DEMO_STATIONS } from '../data/demoStations';
import { CORRIDORS } from '../data/corridors';
import { getStoredGoogleApiKey, storeGoogleApiKey } from '../services/googleMapsLoader';
import { computeArrivalPrediction } from '../utils/predictionEngine';
import { rankStationsForRoute } from '../utils/rankingEngine';

const SETTINGS_KEY = 'cng-navigator-settings';
const COMMUNITY_REPORTS_KEY = 'cng-navigator-community-reports';
const MAX_SELECTION = 3;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
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
  submitCommunityReport: (payload: CommunityReportPayload) => void;
  submitIncorrectFlag: (payload: IncorrectInfoFlagPayload) => void;
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
  const [stations, setStations] = useState<StationSummaryDto[]>(() => {
    // Merge any stored community reports from localStorage
    try {
      const stored = localStorage.getItem(COMMUNITY_REPORTS_KEY);
      if (stored) {
        const overrides: Record<number, Partial<StationSummaryDto>> = JSON.parse(stored);
        return DEMO_STATIONS.map((s) => (overrides[s.id] ? { ...s, ...overrides[s.id] } : s));
      }
    } catch {}
    return DEMO_STATIONS;
  });

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
        // Overlay any local community reports
        let currentOverrides: Record<number, Partial<StationSummaryDto>> = {};
        try {
          const stored = localStorage.getItem(COMMUNITY_REPORTS_KEY);
          if (stored) currentOverrides = JSON.parse(stored);
        } catch {}

        setStations(
          data.map((st: StationSummaryDto) =>
            currentOverrides[st.id] ? { ...st, ...currentOverrides[st.id] } : st
          )
        );
      }
    } catch {
      // Standalone mode / offline fallback
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStations();
  }, [fetchStations]);

  // Live simulation tick (Only fluctuates LIVE_VERIFIED stations by subtle sensor jitter)
  useEffect(() => {
    if (!settings.simulationEnabled) return;

    const timer = setInterval(() => {
      setStations((prevStations) =>
        prevStations.map((s) => {
          // Only simulate subtle fluctuations if station is operational and has live verification
          if (s.verificationStatus === 'LIVE_VERIFIED' && s.operationalStatus === 'OPERATIONAL' && Math.random() < 0.35) {
            const deltaQueue = Math.random() > 0.5 ? 1 : -1;
            const newQueue = Math.max(0, Math.min(15, (s.vehiclesWaiting ?? 2) + deltaQueue));
            const activeNozzles = s.activeDispensers || 4;
            const newWait = Math.round(newQueue * (4.5 / activeNozzles));

            const deltaPressure = Math.floor(Math.random() * 5) - 2;
            const currentP = s.currentPressureBar ?? 200;
            const newPressure = Math.max(165, Math.min(225, currentP + deltaPressure));

            return {
              ...s,
              vehiclesWaiting: newQueue,
              estimatedWaitMinutes: newWait,
              currentPressureBar: newPressure,
              queueUpdatedAt: new Date().toISOString(),
              pressureUpdatedAt: new Date().toISOString(),
              lastUpdatedTimestamp: new Date().toISOString(),
            };
          }
          return s;
        })
      );
    }, 12000);

    return () => clearInterval(timer);
  }, [settings.simulationEnabled]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  // Submit community telemetry report
  const submitCommunityReport = useCallback((payload: CommunityReportPayload) => {
    setStations((prev) => {
      const next = prev.map((s) => {
        if (s.id === payload.stationId) {
          const updated: StationSummaryDto = {
            ...s,
            vehiclesWaiting: payload.vehiclesWaiting,
            estimatedWaitMinutes: payload.estimatedWaitMinutes,
            operationalStatus: payload.operationalStatus,
            cngAvailability: payload.cngAvailability,
            verifiedOpen: payload.operationalStatus === 'OPERATIONAL',
            currentPressureBar:
              payload.hasReliablePressureReading && payload.pressureBar
                ? payload.pressureBar
                : s.currentPressureBar,
            verificationStatus: 'COMMUNITY_REPORTED',
            dataSourceLabel: 'Driver Community Report',
            dataConfidenceScore: 82,
            lastUpdatedTimestamp: new Date().toISOString(),
            queueUpdatedAt: new Date().toISOString(),
            pressureUpdatedAt: payload.hasReliablePressureReading ? new Date().toISOString() : s.pressureUpdatedAt,
            isQueueLive: true,
            isPressureLive: payload.hasReliablePressureReading,
          };
          return updated;
        }
        return s;
      });

      // Persist in localStorage
      try {
        const stored = localStorage.getItem(COMMUNITY_REPORTS_KEY);
        const map = stored ? JSON.parse(stored) : {};
        const target = next.find((s) => s.id === payload.stationId);
        if (target) {
          map[payload.stationId] = target;
          localStorage.setItem(COMMUNITY_REPORTS_KEY, JSON.stringify(map));
        }
      } catch {}

      return next;
    });
  }, []);

  // Submit flag on incorrect information
  const submitIncorrectFlag = useCallback((payload: IncorrectInfoFlagPayload) => {
    setStations((prev) => {
      const next = prev.map((s) => {
        if (s.id === payload.stationId) {
          let updated = { ...s };
          if (payload.issueType === 'CLOSED') {
            updated.operationalStatus = 'TEMPORARILY_CLOSED';
            updated.verifiedOpen = false;
            updated.recommendationReason = 'Flagged as closed by driver community.';
          } else if (payload.issueType === 'NO_CNG') {
            updated.cngAvailability = 'OUT_OF_STOCK';
            updated.recommendationReason = 'Flagged as out of CNG stock.';
          } else if (payload.issueType === 'LOW_PRESSURE') {
            updated.currentPressureBar = Math.min(150, updated.currentPressureBar ?? 150);
          } else if (payload.issueType === 'LONG_QUEUE') {
            updated.vehiclesWaiting = Math.max(14, (updated.vehiclesWaiting ?? 4) + 6);
          }
          updated.verificationStatus = 'COMMUNITY_REPORTED';
          updated.dataSourceLabel = 'Driver Discrepancy Flag';
          updated.lastUpdatedTimestamp = new Date().toISOString();
          return updated;
        }
        return s;
      });
      return next;
    });
  }, []);

  const updateStationTelemetry = useCallback(
    (stationId: number, vehicles: number, pressure: number) => {
      submitCommunityReport({
        stationId,
        vehiclesWaiting: vehicles,
        estimatedWaitMinutes: Math.round(vehicles * 2),
        operationalStatus: 'OPERATIONAL',
        cngAvailability: 'AVAILABLE',
        pressureBar: pressure,
        hasReliablePressureReading: true,
      });
    },
    [submitCommunityReport]
  );

  // Smart Route Recommendation & Arrival Prediction Algorithm
  const planSmartRoute = useCallback(
    async (req: RouteSearchRequest): Promise<RouteSearchResultDto> => {
      // 1. Identify corridor highway waypoints
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

      // Find candidate stations within bounding corridor
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
        candidateStations = stations.slice(0, 5);
      }

      // Compute Distance, Detour, and Run Arrival Prediction Engine for each station
      const enrichedCandidates = candidateStations.map((s) => {
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

        // Travel time from driver/start to this station
        const etaMins = Math.max(2, Math.round((distFromStart / 65) * 60));

        // 🧠 Smart Arrival Prediction Engine Execution
        const prediction = computeArrivalPrediction(s, distFromStart, etaMins);

        return {
          ...s,
          distanceFromStartKm: distFromStart,
          distanceFromRouteKm: Math.min(detourKm, 1.5),
          extraDetourKm: detourKm,
          estimatedDetourMinutes: detourMin,
          arrivalPrediction: prediction,
        };
      });

      // 🏆 Run Multi-Factor Ranking Engine across Candidate Stations
      const rankingResult = rankStationsForRoute(enrichedCandidates, totalDist);

      const result: RouteSearchResultDto = {
        totalDistanceKm: totalDist,
        totalDurationMinutes: totalDur,
        routeGeometry,
        stations: rankingResult.stations,
        bestOverall: rankingResult.bestOverall,
        fastestRefueling: rankingResult.fastestRefueling,
        nearestStation: rankingResult.nearestStation,
        alternatives: rankingResult.stations.slice(1).map((st) => ({
          station: st,
          reason: `${st.currentPressureBar ?? 0} Bar • ${st.vehiclesWaiting ?? 0} cars • +${st.extraDetourKm}km detour`,
        })),
        isDemoRoute: true,
        routeSource: 'Google Maps Directions & Mobility Intelligence Engine',
        message: 'Stations evaluated across arrival queue prediction, pressure reliability, and detour distance.',
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
      submitCommunityReport,
      submitIncorrectFlag,
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
      submitCommunityReport,
      submitIncorrectFlag,
      planSmartRoute,
      activeRouteResult,
      setActiveRouteResult,
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
