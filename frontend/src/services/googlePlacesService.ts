// Google Places API (New & Classic Autocomplete) Service
// Handles session tokens, place predictions, coordinate resolution, and in-memory caching.

import { getGoogle, isGoogleMapsLoaded } from './googleMapsLoader';
import { nominatimSearch } from './api';

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  isCngRelated?: boolean;
}

export interface ResolvedPlace {
  placeId?: string;
  address: string;
  name?: string;
  lat: number;
  lng: number;
}

// In-memory query cache to avoid duplicate API calls
const predictionCache = new Map<string, PlacePrediction[]>();
const detailsCache = new Map<string, ResolvedPlace>();

// Autocomplete Session Token manager for cost-efficient billing
let currentSessionToken: any = null;

export function getOrCreateSessionToken(): any {
  const google = getGoogle();
  if (!google?.maps?.places?.AutocompleteSessionToken) return null;
  if (!currentSessionToken) {
    currentSessionToken = new google.maps.places.AutocompleteSessionToken();
  }
  return currentSessionToken;
}

export function resetSessionToken(): void {
  currentSessionToken = null;
}

/**
 * Search places autocomplete using Google Places API (with Nominatim fallback).
 */
export async function searchPlacesAutocomplete(
  query: string,
  options?: {
    cngFilter?: boolean;
    country?: string; // e.g. 'in'
    locationBias?: { lat: number; lng: number; radiusKm?: number };
  }
): Promise<PlacePrediction[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cacheKey = `${trimmed}_${options?.cngFilter ? 'cng' : 'all'}_${options?.country || 'in'}`;
  if (predictionCache.has(cacheKey)) {
    return predictionCache.get(cacheKey)!;
  }

  const google = getGoogle();
  if (isGoogleMapsLoaded() && google?.maps?.places?.AutocompleteService) {
    try {
      const service = new google.maps.places.AutocompleteService();
      const token = getOrCreateSessionToken();

      const request: any = {
        input: trimmed,
        sessionToken: token || undefined,
        componentRestrictions: options?.country ? { country: options.country } : { country: 'in' },
      };

      if (options?.locationBias) {
        request.locationBias = new google.maps.Circle({
          center: { lat: options.locationBias.lat, lng: options.locationBias.lng },
          radius: (options.locationBias.radiusKm || 50) * 1000,
        });
      }

      const predictions: PlacePrediction[] = await new Promise((resolve) => {
        service.getPlacePredictions(request, (results: any[], status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            const parsed = results.map((r: any) => ({
              placeId: r.place_id,
              description: r.description,
              mainText: r.structured_formatting?.main_text || r.description,
              secondaryText: r.structured_formatting?.secondary_text || '',
              isCngRelated: /cng|gas|petrol|fuel|pump/i.test(r.description),
            }));
            resolve(parsed);
          } else {
            resolve([]);
          }
        });
      });

      if (predictions.length > 0) {
        predictionCache.set(cacheKey, predictions);
        return predictions;
      }
    } catch (err) {
      console.warn('[GooglePlaces] Autocomplete error, falling back:', err);
    }
  }

  // Graceful fallback to Nominatim geocoding if Google Maps is not available
  try {
    const fallbackResults = await nominatimSearch(trimmed);
    const converted: PlacePrediction[] = fallbackResults.map((r) => {
      const parts = r.display_name.split(',');
      const main = parts[0]?.trim() || r.display_name;
      const sec = parts.slice(1, 4).join(',').trim();
      return {
        placeId: `nom_${r.place_id}`,
        description: r.display_name,
        mainText: main,
        secondaryText: sec,
        isCngRelated: /cng/i.test(r.display_name),
      };
    });
    predictionCache.set(cacheKey, converted);
    return converted;
  } catch {
    return [];
  }
}

/**
 * Resolves a selected prediction to exact coordinates and formatted address.
 */
export async function resolvePlaceCoordinates(prediction: PlacePrediction): Promise<ResolvedPlace | null> {
  if (detailsCache.has(prediction.placeId)) {
    return detailsCache.get(prediction.placeId)!;
  }

  // If this was a Nominatim fallback prediction
  if (prediction.placeId.startsWith('nom_')) {
    const raw = await nominatimSearch(prediction.description);
    if (raw && raw.length > 0) {
      const r = raw[0];
      const resolved: ResolvedPlace = {
        placeId: prediction.placeId,
        address: r.display_name,
        name: prediction.mainText,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      };
      detailsCache.set(prediction.placeId, resolved);
      return resolved;
    }
  }

  const google = getGoogle();
  if (isGoogleMapsLoaded() && google?.maps) {
    // 1. Try PlacesService.getDetails
    try {
      const dummyDiv = document.createElement('div');
      const placesService = new google.maps.places.PlacesService(dummyDiv);
      const token = getOrCreateSessionToken();

      const result: ResolvedPlace | null = await new Promise((resolve) => {
        placesService.getDetails(
          {
            placeId: prediction.placeId,
            fields: ['name', 'formatted_address', 'geometry', 'place_id'],
            sessionToken: token || undefined,
          },
          (place: any, status: any) => {
            resetSessionToken(); // Reset token after final details fetch (Google Places billing requirement)
            if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
              resolve({
                placeId: place.place_id,
                address: place.formatted_address || prediction.description,
                name: place.name || prediction.mainText,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              });
            } else {
              resolve(null);
            }
          }
        );
      });

      if (result) {
        detailsCache.set(prediction.placeId, result);
        return result;
      }
    } catch (e) {
      console.warn('[GooglePlaces] getDetails failed, attempting Geocoder:', e);
    }

    // 2. Geocoder fallback using placeId or address string
    try {
      const geocoder = new google.maps.Geocoder();
      const geoResult: ResolvedPlace | null = await new Promise((resolve) => {
        geocoder.geocode({ placeId: prediction.placeId }, (results: any[], status: any) => {
          if (status === 'OK' && results && results[0]?.geometry?.location) {
            const loc = results[0].geometry.location;
            resolve({
              placeId: prediction.placeId,
              address: results[0].formatted_address || prediction.description,
              name: prediction.mainText,
              lat: loc.lat(),
              lng: loc.lng(),
            });
          } else {
            resolve(null);
          }
        });
      });

      if (geoResult) {
        detailsCache.set(prediction.placeId, geoResult);
        return geoResult;
      }
    } catch (err) {
      console.warn('[GooglePlaces] Geocoder failed:', err);
    }
  }

  return null;
}

/**
 * Reverse geocode latitude and longitude to a human-friendly address string.
 */
export async function reverseGeocodeLatLng(lat: number, lng: number): Promise<string> {
  const google = getGoogle();
  if (isGoogleMapsLoaded() && google?.maps?.Geocoder) {
    try {
      const geocoder = new google.maps.Geocoder();
      const address: string | null = await new Promise((resolve) => {
        geocoder.geocode({ location: { lat, lng } }, (results: any[], status: any) => {
          if (status === 'OK' && results && results[0]?.formatted_address) {
            resolve(results[0].formatted_address);
          } else {
            resolve(null);
          }
        });
      });
      if (address) return address;
    } catch {}
  }

  // Nominatim fallback
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) return data.display_name;
    }
  } catch {}

  return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
}
