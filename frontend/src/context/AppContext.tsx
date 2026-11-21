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
  StationAlertNotification,
  AlertPreferences,
  DriverTrustProfile,
  VisitedStationRecord,
} from '../types/index';
import { DEMO_STATIONS } from '../data/demoStations';
import { CORRIDORS } from '../data/corridors';
import { getStoredGoogleApiKey, storeGoogleApiKey } from '../services/googleMapsLoader';
import { computeArrivalPrediction, computeQueueIntelligence } from '../utils/predictionEngine';
import { rankStationsForRoute } from '../utils/rankingEngine';
import { evaluateStationFreshness, DEFAULT_FRESHNESS_CONFIG } from '../utils/freshnessEngine';
import {
  getDriverTrustProfile,
  validateDriverReport,
  recordReportSubmission,
} from '../utils/trustEngine';
import {
  calculateGoogleDrivingRoute,
  calculateActualStationDetours,
} from '../services/googleRoutingService';
import { detectStationAlerts, DEFAULT_ALERT_PREFERENCES } from '../utils/alertEngine';

const SETTINGS_KEY = 'cng-navigator-settings';
const COMMUNITY_REPORTS_KEY = 'cng-navigator-community-reports';
const VISITED_STATIONS_KEY = 'cng-navigator-visited-stations';
const ALERTS_STORAGE_KEY = 'cng-navigator-active-alerts';
const ACTIVE_ROUTE_STORAGE_KEY = 'cng_active_route_result';
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
  freshnessConfig: DEFAULT_FRESHNESS_CONFIG,
  alertPreferences: DEFAULT_ALERT_PREFERENCES,
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

  // Alerts
  alerts: StationAlertNotification[];
  dismissAlert: (id: string) => void;
  clearAllAlerts: () => void;
  updateAlertPreferences: (prefs: Partial<AlertPreferences>) => void;

  // Driver Trust & Community Reporting
  driverProfile: DriverTrustProfile;
  submitCommunityReport: (payload: CommunityReportPayload) => { success: boolean; error?: string };
  submitIncorrectFlag: (payload: IncorrectInfoFlagPayload) => void;

  // Post-Visit Verification
  visitedStations: VisitedStationRecord[];
  markStationVisited: (record: VisitedStationRecord) => void;

  // Smart Routing & Prediction
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
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  // Initialize stations and evaluate freshness dynamically
  const [stations, setStations] = useState<StationSummaryDto[]>(() => {
    let initialList = DEMO_STATIONS;
    try {
      const stored = localStorage.getItem(COMMUNITY_REPORTS_KEY);
      if (stored) {
        const overrides: Record<number, Partial<StationSummaryDto>> = JSON.parse(stored);
        initialList = DEMO_STATIONS.map((s) => (overrides[s.id] ? { ...s, ...overrides[s.id] } : s));
      }
    } catch {}

    // Evaluate freshness & queue intelligence for each station
    return initialList.map((st) => {
      const freshness = evaluateStationFreshness(st, DEFAULT_FRESHNESS_CONFIG);
      const queueInt = computeQueueIntelligence(st, null);
      return {
        ...st,
        verificationStatus: freshness.status,
        dataConfidenceScore: freshness.confidenceScore,
        freshnessInfo: freshness,
        queueTrend: queueInt.queueTrend,
        queueIntelligence: queueInt,
      };
    });
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStations, setSelectedStations] = useState<number[]>([]);
  const [activeRouteResult, setActiveRouteResultState] = useState<RouteSearchResultDto | null>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_ROUTE_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  const setActiveRouteResult = useCallback((res: RouteSearchResultDto | null) => {
    setActiveRouteResultState(res);
    try {
      if (res) localStorage.setItem(ACTIVE_ROUTE_STORAGE_KEY, JSON.stringify(res));
      else localStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
    } catch {}
  }, []);

  // Alerts state
  const [alerts, setAlerts] = useState<StationAlertNotification[]>(() => {
    try {
      const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  // Driver trust profile
  const [driverProfile, setDriverProfile] = useState<DriverTrustProfile>(getDriverTrustProfile);

  // Visited stations history
  const [visitedStations, setVisitedStations] = useState<VisitedStationRecord[]>(() => {
    try {
      const raw = localStorage.getItem(VISITED_STATIONS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Save alerts to storage
  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts.slice(0, 20)));
    } catch {}
  }, [alerts]);

  const fetchStations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await stationApi.getAll();
      if (mountedRef.current && Array.isArray(data) && data.length > 0) {
        let currentOverrides: Record<number, Partial<StationSummaryDto>> = {};
        try {
          const stored = localStorage.getItem(COMMUNITY_REPORTS_KEY);
          if (stored) currentOverrides = JSON.parse(stored);
        } catch {}

        setStations(
          data.map((st: StationSummaryDto) => {
            const merged = currentOverrides[st.id] ? { ...st, ...currentOverrides[st.id] } : st;
            const freshness = evaluateStationFreshness(merged, settings.freshnessConfig);
            const queueInt = computeQueueIntelligence(merged, null);
            return {
              ...merged,
              verificationStatus: freshness.status,
              dataConfidenceScore: freshness.confidenceScore,
              freshnessInfo: freshness,
              queueTrend: queueInt.queueTrend,
              queueIntelligence: queueInt,
            };
          })
        );
      }
    } catch {
      // Standalone mode / offline fallback
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [settings.freshnessConfig]);

  useEffect(() => {
    void fetchStations();
  }, [fetchStations]);

  // Periodic Freshness Evaluation & Simulation Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setStations((prevStations) => {
        const updatedList = prevStations.map((s) => {
          let updated = { ...s };

          // 1. Re-evaluate Data Freshness (downgrade expired readings)
          const freshness = evaluateStationFreshness(updated, settings.freshnessConfig);
          updated.verificationStatus = freshness.status;
          updated.dataConfidenceScore = freshness.confidenceScore;
          updated.freshnessInfo = freshness;

          // 2. Controlled Sensor Simulation (Only for LIVE_VERIFIED stations)
          if (
            settings.simulationEnabled &&
            freshness.status === 'LIVE_VERIFIED' &&
            s.operationalStatus === 'OPERATIONAL' &&
            Math.random() < 0.28
          ) {
            const deltaQueue = Math.random() > 0.5 ? 1 : -1;
            const newQueue = Math.max(0, Math.min(16, (s.vehiclesWaiting ?? 2) + deltaQueue));
            const activeNozzles = s.activeDispensers || 4;
            const newWait = Math.round(newQueue * (4.2 / activeNozzles));

            const deltaPressure = Math.floor(Math.random() * 5) - 2;
            const currentP = s.currentPressureBar ?? 200;
            const newPressure = Math.max(165, Math.min(225, currentP + deltaPressure));

            updated.vehiclesWaiting = newQueue;
            updated.estimatedWaitMinutes = newWait;
            updated.currentPressureBar = newPressure;
            updated.queueUpdatedAt = new Date().toISOString();
            updated.pressureUpdatedAt = new Date().toISOString();
            updated.lastUpdatedTimestamp = new Date().toISOString();

            // Detect Real State Alerts
            const detected = detectStationAlerts(s, updated, settings.alertPreferences);
            if (detected.length > 0) {
              setAlerts((curr) => [...detected, ...curr].slice(0, 25));
            }
          }

          // Compute Queue Intelligence
          const queueInt = computeQueueIntelligence(updated, null);
          updated.queueTrend = queueInt.queueTrend;
          updated.queueIntelligence = queueInt;

          return updated;
        });

        return updatedList;
      });
    }, 12000);

    return () => clearInterval(timer);
  }, [settings.simulationEnabled, settings.freshnessConfig, settings.alertPreferences]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const updateAlertPreferences = useCallback((prefs: Partial<AlertPreferences>) => {
    setSettings((prev) => {
      const next: AppSettings = {
        ...prev,
        alertPreferences: { ...prev.alertPreferences, ...prefs },
      };
      saveSettings(next);
      return next;
    });
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Submit community telemetry report with abuse prevention & validation
  const submitCommunityReport = useCallback(
    (payload: CommunityReportPayload): { success: boolean; error?: string } => {
      const targetStation = stations.find((s) => s.id === payload.stationId);
      if (!targetStation) return { success: false, error: 'Station not found.' };

      // 1. Abuse prevention & duplicate validation
      const validation = validateDriverReport(payload, targetStation);
      if (!validation.isValid) {
        return { success: false, error: validation.errorMessage || 'Invalid report submission.' };
      }

      // 2. Record report submission & update driver reliability profile
      const updatedProfile = recordReportSubmission(payload, true);
      setDriverProfile(updatedProfile);

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
              pressureUpdatedAt: payload.hasReliablePressureReading
                ? new Date().toISOString()
                : s.pressureUpdatedAt,
              isQueueLive: true,
              isPressureLive: payload.hasReliablePressureReading,
            };

            const freshness = evaluateStationFreshness(updated, settings.freshnessConfig);
            updated.freshnessInfo = freshness;

            // Detect any alerts triggered by community update
            const detected = detectStationAlerts(s, updated, settings.alertPreferences);
            if (detected.length > 0) {
              setAlerts((curr) => [...detected, ...curr].slice(0, 25));
            }

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

      return { success: true };
    },
    [stations, settings.freshnessConfig, settings.alertPreferences]
  );

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

  // Post-visit confirmation
  const markStationVisited = useCallback((record: VisitedStationRecord) => {
    setVisitedStations((prev) => {
      const updated = [record, ...prev];
      try {
        localStorage.setItem(VISITED_STATIONS_KEY, JSON.stringify(updated.slice(0, 20)));
      } catch {}
      return updated;
    });
  }, []);

  // Smart Route Recommendation & Arrival Prediction Algorithm with Google Routes & Distance Matrix
  const planSmartRoute = useCallback(
    async (req: RouteSearchRequest): Promise<RouteSearchResultDto> => {
      // 1. Try real-world Google Routes API driving route calculation
      let googleRouteRes = null;
      try {
        googleRouteRes = await calculateGoogleDrivingRoute(
          { lat: req.startLat, lng: req.startLng },
          { lat: req.destLat, lng: req.destLng }
        );
      } catch (err) {
        console.warn('[AppContext] Google Routes calculation fallback:', err);
      }

      let routeGeometry: [number, number][] = [];
      let totalDist = 0;
      let totalDur = 0;
      let trafficAwareDur = 0;
      let routeSource = 'Google Routes API (Live Driving & Traffic)';
      let isDemo = false;

      if (googleRouteRes && googleRouteRes.routeGeometry.length > 0) {
        routeGeometry = googleRouteRes.routeGeometry;
        totalDist = googleRouteRes.totalDistanceKm;
        totalDur = googleRouteRes.totalDurationMinutes;
        trafficAwareDur = googleRouteRes.trafficAwareDurationMinutes || totalDur;
        routeSource = googleRouteRes.routeSource;
      } else {
        // Fallback: Identify corridor highway waypoints
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
        totalDur = Math.round((totalDist / 65) * 60);
        trafficAwareDur = totalDur;
        routeSource = 'Highway Corridor & Offline Routing Engine';
        isDemo = true;
      }

      // 2. Find candidate stations within bounding corridor
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

      // 3. Compute Actual Road Detour using Google Distance Matrix API (not straight line)
      let detourMap = new Map<number, { actualRoadDetourKm: number; actualRoadDetourMinutes: number; drivingDistanceToStationKm: number; drivingTimeToStationMinutes: number; calculationMethod: string }>();
      try {
        const detourResults = await calculateActualStationDetours(
          { lat: req.startLat, lng: req.startLng },
          { lat: req.destLat, lng: req.destLng },
          candidateStations,
          totalDist
        );
        detourResults.forEach((d) => detourMap.set(d.stationId, d));
      } catch (err) {
        console.warn('[AppContext] Detour matrix error:', err);
      }

      // 4. Enrich Candidate Stations with Actual Road Detour, Arrival Prediction, and Queue Intelligence
      const enrichedCandidates = candidateStations.map((s) => {
        const detourData = detourMap.get(s.id);

        const fallbackDistFromStart = Math.round(
          haversineDistance(req.startLat, req.startLng, s.latitude, s.longitude)
        );
        const fallbackDistToDest = Math.round(
          haversineDistance(s.latitude, s.longitude, req.destLat, req.destLng)
        );
        const fallbackDetourKm = Number(
          Math.max(0.2, (fallbackDistFromStart + fallbackDistToDest - totalDist) * 0.4).toFixed(1)
        );
        const fallbackDetourMin = Math.max(1, Math.round(fallbackDetourKm * 1.8));
        const fallbackEtaMins = Math.max(2, Math.round((fallbackDistFromStart / 65) * 60));

        const distFromStart = detourData ? detourData.drivingDistanceToStationKm : fallbackDistFromStart;
        const etaMins = detourData ? detourData.drivingTimeToStationMinutes : fallbackEtaMins;
        const detourKm = detourData ? detourData.actualRoadDetourKm : fallbackDetourKm;
        const detourMin = detourData ? detourData.actualRoadDetourMinutes : fallbackDetourMin;

        // Smart Arrival Prediction Engine
        const prediction = computeArrivalPrediction(s, distFromStart, etaMins);

        // Queue Intelligence
        const queueInt = computeQueueIntelligence(s, prediction.predictedQueueAtArrival);

        return {
          ...s,
          distanceFromStartKm: distFromStart,
          distanceFromRouteKm: Math.min(detourKm, 1.5),
          extraDetourKm: detourKm,
          estimatedDetourMinutes: detourMin,
          actualRoadDetourKm: detourKm,
          actualRoadDetourMinutes: detourMin,
          actualRoadDetourSource: detourData ? detourData.calculationMethod : 'POLYLINE_PROJECTION',
          arrivalPrediction: prediction,
          queueTrend: queueInt.queueTrend,
          queueIntelligence: queueInt,
        };
      });

      // 5. Run Multi-Factor Ranking Engine across Candidate Stations
      const rankingResult = rankStationsForRoute(enrichedCandidates, totalDist);

      const result: RouteSearchResultDto = {
        startAddress: req.startAddress,
        destAddress: req.destAddress,
        totalDistanceKm: totalDist,
        totalDurationMinutes: totalDur,
        trafficAwareDurationMinutes: trafficAwareDur,
        routeGeometry,
        stations: rankingResult.stations,
        bestOverall: rankingResult.bestOverall,
        fastestRefueling: rankingResult.fastestRefueling,
        nearestStation: rankingResult.nearestStation,
        alternatives: rankingResult.stations.slice(1).map((st) => ({
          station: st,
          reason: `${st.currentPressureBar ?? 0} Bar • ${st.vehiclesWaiting ?? 0} cars • +${st.extraDetourKm}km detour`,
        })),
        drivingRouteOptions: googleRouteRes
          ? [googleRouteRes.primaryRoute, ...googleRouteRes.alternativeRoutes]
          : [],
        selectedRouteIndex: 0,
        isDemoRoute: isDemo,
        routeSource,
        message: 'Stations evaluated across actual driving detour distance, arrival queue forecast, and pressure reliability.',
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
      alerts,
      dismissAlert,
      clearAllAlerts,
      updateAlertPreferences,
      driverProfile,
      submitCommunityReport,
      submitIncorrectFlag,
      visitedStations,
      markStationVisited,
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
      alerts,
      dismissAlert,
      clearAllAlerts,
      updateAlertPreferences,
      driverProfile,
      submitCommunityReport,
      submitIncorrectFlag,
      visitedStations,
      markStationVisited,
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
