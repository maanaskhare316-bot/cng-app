// Google Routes API & Directions / Distance Matrix Service
// Provides real turn-by-turn road geometry, alternative driving routes, traffic-aware travel time,
// and actual road detour calculations (not straight-line).

import { getGoogle, isGoogleMapsLoaded } from './googleMapsLoader';
import type { StationSummaryDto } from '../types';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GoogleRouteOption {
  index: number;
  summary: string;
  distanceKm: number;
  durationMinutes: number;
  durationInTrafficMinutes?: number;
  trafficDelayMinutes?: number;
  geometry: [number, number][]; // [lat, lng] array
  overviewPolyline: string;
  warnings?: string[];
  directionsResult?: any;
}

export interface GoogleRouteCalculationResult {
  primaryRoute: GoogleRouteOption;
  alternativeRoutes: GoogleRouteOption[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  trafficAwareDurationMinutes?: number;
  routeGeometry: [number, number][];
  routeSource: string;
}

export interface StationDetourResult {
  stationId: number;
  actualRoadDetourKm: number;
  actualRoadDetourMinutes: number;
  drivingDistanceToStationKm: number;
  drivingTimeToStationMinutes: number;
  calculationMethod: 'GOOGLE_DISTANCE_MATRIX' | 'GOOGLE_DIRECTIONS_WAYPOINT' | 'POLYLINE_PROJECTION';
}

// In-memory cache for routing calculations to avoid redundant billing & API calls
const routeCache = new Map<string, GoogleRouteCalculationResult>();
const detourCache = new Map<string, StationDetourResult[]>();

/**
 * Calculate driving route using Google Directions / Routes Service.
 * Includes alternative routes, traffic-aware travel times, and decoded geometry.
 */
export async function calculateGoogleDrivingRoute(
  start: LatLng,
  dest: LatLng,
  stopoverStation?: LatLng
): Promise<GoogleRouteCalculationResult | null> {
  const cacheKey = `${start.lat.toFixed(4)},${start.lng.toFixed(4)}_${dest.lat.toFixed(4)},${dest.lng.toFixed(4)}_${stopoverStation ? `${stopoverStation.lat.toFixed(4)},${stopoverStation.lng.toFixed(4)}` : 'direct'}`;

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  const google = getGoogle();
  if (!isGoogleMapsLoaded() || !google?.maps?.DirectionsService) {
    return null;
  }

  try {
    const directionsService = new google.maps.DirectionsService();

    const waypoints: any[] = stopoverStation
      ? [{ location: { lat: stopoverStation.lat, lng: stopoverStation.lng }, stopover: true }]
      : [];

    const request: any = {
      origin: { lat: start.lat, lng: start.lng },
      destination: { lat: dest.lat, lng: dest.lng },
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: !stopoverStation, // Alternatives for main corridor
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel?.BEST_GUESS || 'bestguess',
      },
      unitSystem: google.maps.UnitSystem.METRIC,
    };

    const response: any = await new Promise((resolve, reject) => {
      directionsService.route(request, (result: any, status: any) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          resolve(result);
        } else {
          reject(new Error(`Google Directions failed with status: ${status}`));
        }
      });
    });

    if (!response.routes || response.routes.length === 0) {
      return null;
    }

    const parseRoute = (route: any, index: number): GoogleRouteOption => {
      let totalMeters = 0;
      let totalSeconds = 0;
      let totalTrafficSeconds = 0;

      route.legs.forEach((leg: any) => {
        totalMeters += leg.distance?.value || 0;
        totalSeconds += leg.duration?.value || 0;
        totalTrafficSeconds += leg.duration_in_traffic?.value || leg.duration?.value || 0;
      });

      const distKm = Math.round((totalMeters / 1000) * 10) / 10;
      const durMin = Math.round(totalSeconds / 60);
      const trafficMin = Math.round(totalTrafficSeconds / 60);
      const trafficDelay = Math.max(0, trafficMin - durMin);

      // Extract points
      const geometry: [number, number][] = [];
      if (route.overview_path) {
        route.overview_path.forEach((pt: any) => {
          geometry.push([pt.lat(), pt.lng()]);
        });
      }

      return {
        index,
        summary: route.summary || (index === 0 ? 'Fastest Highway Route' : `Alternative Route ${index}`),
        distanceKm: distKm,
        durationMinutes: durMin,
        durationInTrafficMinutes: trafficMin,
        trafficDelayMinutes: trafficDelay,
        geometry,
        overviewPolyline: route.overview_polyline || '',
        warnings: route.warnings || [],
        directionsResult: response,
      };
    };

    const primaryRoute = parseRoute(response.routes[0], 0);
    const alternativeRoutes: GoogleRouteOption[] = [];

    for (let i = 1; i < response.routes.length; i++) {
      alternativeRoutes.push(parseRoute(response.routes[i], i));
    }

    const result: GoogleRouteCalculationResult = {
      primaryRoute,
      alternativeRoutes,
      totalDistanceKm: primaryRoute.distanceKm,
      totalDurationMinutes: primaryRoute.durationMinutes,
      trafficAwareDurationMinutes: primaryRoute.durationInTrafficMinutes,
      routeGeometry: primaryRoute.geometry,
      routeSource: 'Google Routes API (Live Driving & Traffic)',
    };

    routeCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('[GoogleRouting] Directions request failed:', err);
    return null;
  }
}

/**
 * Calculates actual driving detour distance and duration for candidate stations
 * using Google Distance Matrix API instead of straight-line haversine distance.
 */
export async function calculateActualStationDetours(
  origin: LatLng,
  destination: LatLng,
  stations: StationSummaryDto[],
  directRouteDistanceKm: number
): Promise<StationDetourResult[]> {
  if (stations.length === 0) return [];

  const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}_${stations.map((s) => s.id).join('-')}`;
  if (detourCache.has(cacheKey)) {
    return detourCache.get(cacheKey)!;
  }

  const google = getGoogle();
  if (isGoogleMapsLoaded() && google?.maps?.DistanceMatrixService) {
    try {
      const distanceMatrix = new google.maps.DistanceMatrixService();
      // Slice candidate stations to top 10 to respect Distance Matrix matrix limits (25 elements)
      const targetStations = stations.slice(0, 10);
      const stationDestinations = targetStations.map((s) => ({
        lat: s.latitude,
        lng: s.longitude,
      }));

      // Call 1: Distance from Origin to Stations
      const originToStations: any = await new Promise((resolve, reject) => {
        distanceMatrix.getDistanceMatrix(
          {
            origins: [{ lat: origin.lat, lng: origin.lng }],
            destinations: stationDestinations,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
          },
          (res: any, status: any) => {
            if (status === google.maps.DistanceMatrixStatus.OK && res) {
              resolve(res);
            } else {
              reject(new Error(`Distance Matrix to stations failed: ${status}`));
            }
          }
        );
      });

      // Call 2: Distance from Stations to Destination
      const stationsToDest: any = await new Promise((resolve, reject) => {
        distanceMatrix.getDistanceMatrix(
          {
            origins: stationDestinations,
            destinations: [{ lat: destination.lat, lng: destination.lng }],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
          },
          (res: any, status: any) => {
            if (status === google.maps.DistanceMatrixStatus.OK && res) {
              resolve(res);
            } else {
              reject(new Error(`Distance Matrix from stations failed: ${status}`));
            }
          }
        );
      });

      const results: StationDetourResult[] = [];
      const originRow = originToStations.rows?.[0]?.elements || [];

      targetStations.forEach((station, idx) => {
        const fromOrigin = originRow[idx];
        const toDest = stationsToDest.rows?.[idx]?.elements?.[0];

        if (fromOrigin?.status === 'OK' && toDest?.status === 'OK') {
          const leg1Km = (fromOrigin.distance?.value || 0) / 1000;
          const leg1Mins = Math.round((fromOrigin.duration?.value || 0) / 60);

          const leg2Km = (toDest.distance?.value || 0) / 1000;
          const leg2Mins = Math.round((toDest.duration?.value || 0) / 60);

          const totalViaStationKm = leg1Km + leg2Km;
          const actualDetourKm = Math.max(0.1, Math.round((totalViaStationKm - directRouteDistanceKm) * 10) / 10);
          const actualDetourMins = Math.max(1, Math.round(actualDetourKm * 1.8));

          results.push({
            stationId: station.id,
            actualRoadDetourKm: actualDetourKm,
            actualRoadDetourMinutes: actualDetourMins,
            drivingDistanceToStationKm: Math.round(leg1Km * 10) / 10,
            drivingTimeToStationMinutes: leg1Mins,
            calculationMethod: 'GOOGLE_DISTANCE_MATRIX',
          });
        }
      });

      if (results.length > 0) {
        detourCache.set(cacheKey, results);
        return results;
      }
    } catch (err) {
      console.warn('[GoogleRouting] Distance Matrix calculation error, falling back:', err);
    }
  }

  // Fallback: Haversine projection with road curvature factor (1.25x)
  const fallbackResults: StationDetourResult[] = stations.map((s) => {
    const d1 = haversineDistance(origin.lat, origin.lng, s.latitude, s.longitude) * 1.2;
    const d2 = haversineDistance(s.latitude, s.longitude, destination.lat, destination.lng) * 1.2;
    const detourKm = Math.max(0.2, Math.round((d1 + d2 - directRouteDistanceKm) * 0.45 * 10) / 10);
    const detourMins = Math.max(1, Math.round(detourKm * 1.8));
    const etaMins = Math.max(2, Math.round((d1 / 55) * 60));

    return {
      stationId: s.id,
      actualRoadDetourKm: detourKm,
      actualRoadDetourMinutes: detourMins,
      drivingDistanceToStationKm: Math.round(d1 * 10) / 10,
      drivingTimeToStationMinutes: etaMins,
      calculationMethod: 'POLYLINE_PROJECTION',
    };
  });

  detourCache.set(cacheKey, fallbackResults);
  return fallbackResults;
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
