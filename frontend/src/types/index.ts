// ─── Station & Route Types ────────────────────────────────────────────────────

export type RecommendationCategory =
  | 'BEST_OVERALL'
  | 'FASTEST_REFUELING'
  | 'NEAREST_STATION'
  | null;

export type DataVerificationStatus =
  | 'LIVE_VERIFIED'        // Connected & recently reporting IoT sensor data (<15 mins)
  | 'RECENTLY_UPDATED'     // Station attendant or driver update (15–60 mins)
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
  isDemoData: boolean;

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

// ─── Community Reporting DTOs ─────────────────────────────────────────────────

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

// ─── Telemetry Readings ───────────────────────────────────────────────────────

export interface PressureReading {
  id: number;
  stationId: number;
  pressureBar: number;
  minSafeLimitBar: number;
  maxSafeLimitBar: number;
  sensorStatus: SensorStatus;
  dataSource: string;
  isLiveSensor: boolean;
  createdAt: string;
}

export interface QueueObservation {
  id: number;
  stationId: number;
  vehiclesWaiting: number;
  estimatedWaitMinutes: number;
  dataSource: string;
  observationMethod: string;
  isLiveSensor: boolean;
  createdAt: string;
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
