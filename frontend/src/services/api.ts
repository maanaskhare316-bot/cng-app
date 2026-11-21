import axios from 'axios';
import type {
  StationSummaryDto,
  RouteSearchRequest,
  RouteSearchResultDto,
  PressureReading,
  QueueObservation,
} from '../types/index';

// ---------------------------------------------------------------------------
// Axios instance — baseURL from env or fall back to Vite proxy path /api
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ---------------------------------------------------------------------------
// Nominatim result type (not in shared types — purely frontend/OSM concern)
// ---------------------------------------------------------------------------
export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  importance: number;
}

// ---------------------------------------------------------------------------
// Station API
// ---------------------------------------------------------------------------
export const stationApi = {
  /** Fetch all stations (summary list). */
  getAll(): Promise<StationSummaryDto[]> {
    return apiClient.get<StationSummaryDto[]>('/stations').then((r) => r.data);
  },

  /** Fetch a single station by ID. */
  getById(id: number): Promise<StationSummaryDto> {
    return apiClient
      .get<StationSummaryDto>(`/stations/${id}`)
      .then((r) => r.data);
  },

  /** Search for CNG stations along a route. */
  searchRoute(req: RouteSearchRequest): Promise<RouteSearchResultDto> {
    return apiClient
      .post<RouteSearchResultDto>('/stations/search-route', req)
      .then((r) => r.data);
  },
};

// ---------------------------------------------------------------------------
// Telemetry API
// ---------------------------------------------------------------------------
export const telemetryApi = {
  /** Fetch pressure sensor history for a station. */
  getPressureHistory(id: number): Promise<PressureReading[]> {
    return apiClient
      .get<PressureReading[]>(`/telemetry/stations/${id}/pressure/history`)
      .then((r) => r.data);
  },

  /** Fetch queue observation history for a station. */
  getQueueHistory(id: number): Promise<QueueObservation[]> {
    return apiClient
      .get<QueueObservation[]>(`/telemetry/stations/${id}/queue/history`)
      .then((r) => r.data);
  },
};

// ---------------------------------------------------------------------------
// Google Routes API (Backend Endpoints)
// ---------------------------------------------------------------------------
export const routesApi = {
  /** Compute primary route with TRAFFIC_AWARE preference. */
  computeRoute(req: RouteSearchRequest): Promise<any> {
    return apiClient.post('/routes/compute', req).then((r) => r.data);
  },

  /** Compute primary and alternative routes. */
  computeAlternatives(req: RouteSearchRequest): Promise<any> {
    return apiClient.post('/routes/alternatives', req).then((r) => r.data);
  },

  /** Multi-station comparison matrix along route. */
  compareStations(payload: { startLat: number; startLng: number; destLat: number; destLng: number; stationIds: number[] }): Promise<any> {
    return apiClient.post('/routes/station-comparison', payload).then((r) => r.data);
  },
};

// ---------------------------------------------------------------------------
// Nominatim geocoding — location autocomplete (India only)
// Falls back to empty array on any network/parse error.
// ---------------------------------------------------------------------------
export async function nominatimSearch(query: string): Promise<NominatimResult[]> {
  if (!query.trim()) return [];
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '5');
    url.searchParams.set('countrycodes', 'in');

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as NominatimResult[];
    return data;
  } catch {
    return [];
  }
}

export default apiClient;
