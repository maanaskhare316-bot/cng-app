// ─── Telemetry Sensor Readings ───────────────────────────────────────────────

export interface PressureReading {
  timestamp: string;
  pressureBar: number;
  status: 'OPTIMAL' | 'MODERATE' | 'LOW';
  source?: string;
}

export interface QueueObservation {
  timestamp: string;
  vehiclesWaiting: number;
  estimatedWaitMinutes: number;
  source?: string;
}

// ─── Station & Route Types ────────────────────────────────────────────────────

export type RecommendationCategory =
  | 'BEST_OVERALL'
  | 'FASTEST_REFUELING'
  | 'NEAREST_STATION'
  | null;

export type DataVerificationStatus =
  | 'LIVE_VERIFIED'        // Connected & recently reporting IoT sensor data (<15 mins)
  | 'RECENTLY_UPDATED'     // Station attendant or driver update (15–45 mins)
  | 'COMMUNITY_REPORTED'   // User/driver crowdsourced submission
  | 'STALE_DATA'           // Information is outdated (>60 mins)
  | 'UNAVAILABLE';         // No reliable information available

export type PredictionConfidence =
  | 'HIGH'                 // >= 85% confidence
  | 'MEDIUM'               // 70 - 84% confidence
  | 'LOW'                  // 40 - 69% confidence
  | 'INSUFFICIENT_DATA';   // < 40% confidence or stale/unavailable data

export type OperationalStatus =
  | 'OPERATIONAL'
  | 'TEMPORARILY_CLOSED'
  | 'MAINTENANCE';

export type CngAvailability =
  | 'AVAILABLE'
  | 'OUT_OF_STOCK'
  | 'COMPRESSOR_DOWN'
  | 'UNKNOWN';

export type SensorStatus = 'LIVE' | 'SIMULATED' | 'MANUAL' | 'UNKNOWN';

export type QueueFreshness = 'LIVE' | 'RECENT' | 'STALE' | 'UNKNOWN';

export type PressureFreshness = 'LIVE' | 'RECENT' | 'STALE' | 'UNKNOWN';

export type QueueTrend = 'INCREASING' | 'DECREASING' | 'STABLE';

// ─── Advanced Queue Intelligence ──────────────────────────────────────────────

export interface QueueIntelligence {
  currentQueue: number;
  estimatedWaitMinutes: number;
  avgServiceTimeMinutes: number; // e.g. 4.2 mins / vehicle
  activeDispensers: number;
  totalDispensers: number;
  queueTrend: QueueTrend;
  queueTrendLabel: string; // e.g. "Increasing (+2 cars/15m)"
  predictedQueueAtArrival: number | null;
  assumptionsText: string;
}

// ─── Data Freshness & Expiry Model ────────────────────────────────────────────

export interface FreshnessExpiryConfig {
  liveVerifiedExpiryMinutes: number; // default 15
  recentlyUpdatedExpiryMinutes: number; // default 45
  communityReportExpiryMinutes: number; // default 60
  staleThresholdMinutes: number; // default 90
}

export interface DataFreshnessInfo {
  status: DataVerificationStatus;
  lastUpdatedTimestamp: string;
  relativeTimeAgo: string;
  expiresAt: string;
  isExpired: boolean;
  minutesRemainingUntilExpiry: number;
  dataSourceLabel: string;
  confidenceScore: number;
  isDemoData: boolean;
}

// ─── Arrival Prediction Model ─────────────────────────────────────────────────

export interface ArrivalPrediction {
  /** Distance in KM from current position or journey start */
  distanceKm: number;
  /** Estimated drive time in minutes */
  etaMinutes: number;
  /** Formatted ETA clock time (e.g. "12:45 PM") */
  etaClockTime: string;
  /** Current measured queue at query time */
  currentQueue: number | null;
  /** Predicted vehicle queue when the driver arrives */
  predictedQueueAtArrival: number | null;
  /** Current wait time in minutes */
  currentWaitMinutes: number | null;
  /** Predicted wait time in minutes upon arrival */
  predictedWaitMinutesAtArrival: number | null;
  /** Current measured compressor pressure in Bar */
  currentPressureBar: number | null;
  /** Estimated pressure upon arrival (only when sufficient telemetry exists) */
  predictedPressureBarAtArrival: number | null;
  /** Queue trend towards station */
  queueTrend?: QueueTrend;
  /** Confidence level classification */
  confidenceLevel: PredictionConfidence;
  /** Confidence percentage 0-100 */
  confidencePercentage: number;
  /** True if prediction could be computed reliably */
  predictionAvailable: boolean;
  /** Message explaining why prediction is unavailable if applicable */
  unavailabilityReason?: string;
  /** Educational disclaimer */
  disclaimer: string;
}

// ─── Station Summary Model ───────────────────────────────────────────────────

export interface StationSummaryDto {
  id: number;
  name: string;
  operator: string | null;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;

  operationalStatus: OperationalStatus;
  cngAvailability: CngAvailability;
  verifiedOpen: boolean;
  verifiedPricePerKg: number | null;
  dispenserCapacityPerHour: number | null;
  activeDispensers: number;
  totalDispensers: number;
  operatingHours: string | null;
  amenities: string[] | null;
  phoneNumber?: string;

  // Route context fields (populated after route search)
  distanceFromRouteKm: number | null;
  extraDetourKm: number | null;
  estimatedDetourMinutes: number | null;
  distanceFromStartKm: number | null;

  // Queue telemetry
  vehiclesWaiting: number | null;
  estimatedWaitMinutes: number | null;
  queueDataSource: string | null;
  queueUpdatedAt: string | null;
  queueFreshness: QueueFreshness | null;
  isQueueLive: boolean;
  queueTrend?: QueueTrend;
  queueIntelligence?: QueueIntelligence;

  // Pressure telemetry
  currentPressureBar: number | null;
  minSafeLimitBar: number | null;
  maxSafeLimitBar: number | null;
  sensorStatus: SensorStatus | null;
  pressureDataSource: string | null;
  pressureUpdatedAt: string | null;
  pressureFreshness: PressureFreshness | null;
  isPressureLive: boolean;

  // Data Transparency & Verification
  verificationStatus: DataVerificationStatus;
  dataSourceLabel: string;
  dataConfidenceScore: number; // 0 - 100
  lastUpdatedTimestamp: string;
  expiresAt?: string;
  isExpired?: boolean;
  isDemoData: boolean;
  freshnessInfo?: DataFreshnessInfo;

  // Arrival Prediction Engine Output
  arrivalPrediction?: ArrivalPrediction;

  // Smart Recommendation & Convenience Scores
  recommendationCategory: RecommendationCategory;
  recommendationReason: string | null;
  score: number | null;
  fastestRefuelScore?: number;
  nearestScore?: number;
  reliabilityScore?: number;
  convenienceBadge?: string;
}

// ─── Route Search ─────────────────────────────────────────────────────────────

export interface RouteSearchRequest {
  startLat: number;
  startLng: number;
  startAddress: string;
  destLat: number;
  destLng: number;
  destAddress: string;
  maxDetourKm?: number;
  selectedStationId?: number | null;
}

export interface RouteAlternativeDto {
  station: StationSummaryDto;
  reason: string;
}

export interface RouteSearchResultDto {
  totalDistanceKm: number;
  totalDurationMinutes: number;
  /** Array of [lat, lng] pairs describing the route polyline */
  routeGeometry: [number, number][];
  stations: StationSummaryDto[];

  // 3 Required Recommendation Categories
  bestOverall: StationSummaryDto | null;
  fastestRefueling: StationSummaryDto | null;
  nearestStation: StationSummaryDto | null;

  alternatives: RouteAlternativeDto[];
  isDemoRoute: boolean;
  routeSource: string | null;
  message: string | null;
}

// ─── Smart Alerts System ──────────────────────────────────────────────────────

export interface AlertPreferences {
  queueSpikes: boolean;       // Alert when queue increases by >= 3 cars
  stationClosure: boolean;    // Alert if target station closes or runs out of gas
  pressureDrops: boolean;     // Alert if compressor pressure drops below 165 Bar
  infoChanges: boolean;       // Alert if active nozzles or price changes
}

export interface StationAlertNotification {
  id: string;
  stationId: number;
  stationName: string;
  type: 'QUEUE_SPIKE' | 'STATION_CLOSED' | 'OUT_OF_STOCK' | 'PRESSURE_DROP' | 'INFO_CHANGE';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// ─── Driver Trust & Community Verification ────────────────────────────────────

export interface DriverTrustProfile {
  driverId: string;
  totalReportsSubmitted: number;
  acceptedReports: number;
  rejectedReports: number;
  trustScore: number; // 0 - 100
  trustBadge: 'NEWBIE' | 'TRUSTED_CONTRIBUTOR' | 'COMMUNITY_CHAMPION';
  lastReportTimestamp?: string;
}

export interface CommunityReportPayload {
  stationId: number;
  vehiclesWaiting: number;
  estimatedWaitMinutes: number;
  operationalStatus: OperationalStatus;
  cngAvailability: CngAvailability;
  pressureBar?: number | null;
  hasReliablePressureReading: boolean;
  notes?: string;
}

export interface IncorrectInfoFlagPayload {
  stationId: number;
  issueType: 'CLOSED' | 'NO_CNG' | 'WRONG_LOCATION' | 'LONG_QUEUE' | 'LOW_PRESSURE' | 'OTHER';
  comment?: string;
}

// ─── Post-Visit Verification & Feedback ───────────────────────────────────────

export interface VisitedStationRecord {
  id: string;
  stationId: number;
  stationName: string;
  city: string;
  visitedAt: string;
  predictedQueueAtVisit?: number;
  predictedWaitAtVisit?: number;
  actualQueueConfirmed?: number;
  actualWaitConfirmed?: number;
  actualPressureConfirmed?: number;
  cngAvailableConfirmed: boolean;
  predictionVarianceMinutes?: number;
  feedbackRating?: number; // 1 to 5
  driverNotes?: string;
}

// ─── App Settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  distanceUnit: 'km' | 'mi';
  defaultVehicleType: 'car' | 'auto' | 'bus' | 'truck';
  maxDetourKm: number;
  searchRadiusKm: number;
  simulationEnabled: boolean;
  mapProvider: 'google' | 'leaflet';
  googleMapsApiKey: string;
  freshnessConfig: FreshnessExpiryConfig;
  alertPreferences: AlertPreferences;
}

// ─── Corridor ─────────────────────────────────────────────────────────────────

export interface Corridor {
  id: string;
  label: string;
  emoji: string;
  startAddress: string;
  startLat: number;
  startLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  distanceKm?: number;
  description?: string;
}
