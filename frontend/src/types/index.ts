// ─── Station & Route DTOs ────────────────────────────────────────────────────

export type RecommendationCategory =
  | 'BEST_OVERALL'
  | 'HIGH_PRESSURE'
  | 'SHORTEST_QUEUE'
  | 'NEAREST_ON_ROUTE'
  | null;

export type SensorStatus = 'LIVE' | 'SIMULATED' | 'MANUAL' | 'UNKNOWN';

export type QueueFreshness = 'LIVE' | 'RECENT' | 'STALE' | 'UNKNOWN';

export type PressureFreshness = 'LIVE' | 'RECENT' | 'STALE' | 'UNKNOWN';

export interface StationSummaryDto {
  id: number;
  name: string;
  operator: string | null;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;

  verifiedOpen: boolean | null;
  verifiedPricePerKg: number | null;
  dispenserCapacityPerHour: number | null;
  activeDispensers: number | null;
  totalDispensers?: number;
  operatingHours: string | null;
  amenities: string[] | null;
  phoneNumber?: string;

  // Route context fields (populated after route search)
  distanceFromRouteKm: number | null;
  extraDetourKm: number | null;
  estimatedDetourMinutes: number | null;
  distanceFromStartKm: number | null;

  // Queue telemetry (कम गाड़ी / वाहनों की संख्या)
  vehiclesWaiting: number | null;
  estimatedWaitMinutes: number | null;
  queueDataSource: string | null;
  queueUpdatedAt: string | null;
  queueFreshness: QueueFreshness | null;
  isQueueLive: boolean;

  // Pressure telemetry (ज्यादा प्रेशर / गैस प्रेशर)
  currentPressureBar: number | null;
  minSafeLimitBar: number | null;
  maxSafeLimitBar: number | null;
  sensorStatus: SensorStatus | null;
  pressureDataSource: string | null;
  pressureUpdatedAt: string | null;
  pressureFreshness: PressureFreshness | null;
  isPressureLive: boolean;

  // Smart Recommendation & Convenient Score
  recommendationCategory: RecommendationCategory;
  recommendationReason: string | null;
  score: number | null;
  pressureScore?: number;
  queueScore?: number;
  detourScore?: number;
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
  bestOverall: StationSummaryDto | null;
  highestPressure?: StationSummaryDto | null;
  shortestQueue: StationSummaryDto | null;
  nearestOnRoute: StationSummaryDto | null;
  alternatives: RouteAlternativeDto[];
  isDemoRoute: boolean;
  routeSource: string | null;
  message: string | null;
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
