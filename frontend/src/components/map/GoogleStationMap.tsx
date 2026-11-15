import React, { useEffect, useRef, useState } from 'react';
import type { StationSummaryDto } from '../../types';
import { loadGoogleMaps, isGoogleMapsLoaded, hasGoogleMapsAuthFailed } from '../../services/googleMapsLoader';
import { Loader2, AlertTriangle, Layers, Navigation, RefreshCw, Star, Zap, Gauge, Users } from 'lucide-react';

export interface LatLng {
  lat: number;
  lng: number;
}

interface GoogleStationMapProps {
  stations: StationSummaryDto[];
  routeGeometry?: [number, number][];
  startPoint?: LatLng;
  destPoint?: LatLng;
  selectedStationId?: number | null;
  onStationClick?: (station: StationSummaryDto) => void;
  height?: string;
  onAuthError?: () => void;
}

function getPressureColor(bar: number | null): string {
  if (bar === null) return '#64748b'; // slate
  if (bar >= 195) return '#10b981';   // emerald - high
  if (bar >= 175) return '#f59e0b';   // amber - medium
  return '#ef4444';                   // red - low
}

export const GoogleStationMap: React.FC<GoogleStationMapProps> = ({
  stations,
  routeGeometry,
  startPoint,
  destPoint,
  selectedStationId,
  onStationClick,
  height = '500px',
  onAuthError,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const startDestMarkersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const trafficLayerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap');

  // Listen to auth error event
  useEffect(() => {
    const handleAuthError = () => {
      setLoadError('Google Maps API authentication failed. Check your API key or billing status.');
      if (onAuthError) onAuthError();
    };
    window.addEventListener('google-maps-auth-error', handleAuthError);
    return () => window.removeEventListener('google-maps-auth-error', handleAuthError);
  }, [onAuthError]);

  // Load Google Maps script
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    loadGoogleMaps()
      .then((success) => {
        if (!isMounted) return;
        if (success && (window as any).google?.maps) {
          setIsLoading(false);
          initMap();
        } else {
          setIsLoading(false);
          setLoadError('Google Maps could not be loaded. Please check your API key.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsLoading(false);
        setLoadError(err?.message || 'Failed to load Google Maps script.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Map
  const initMap = () => {
    if (!mapContainerRef.current || !(window as any).google?.maps) return;

    const google = (window as any).google;

    // Default center (India / Delhi or first station)
    const defaultCenter = startPoint
      ? { lat: startPoint.lat, lng: startPoint.lng }
      : stations.length > 0
      ? { lat: stations[0].latitude, lng: stations[0].longitude }
      : { lat: 28.6139, lng: 77.209 };

    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 11,
        mapTypeId: mapType,
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: true,
        zoomControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
          { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
        ],
      });

      infoWindowRef.current = new google.maps.InfoWindow();
      trafficLayerRef.current = new google.maps.TrafficLayer();
    }
  };

  // Toggle Traffic Layer
  const toggleTraffic = () => {
    if (!mapRef.current || !trafficLayerRef.current) return;
    if (trafficEnabled) {
      trafficLayerRef.current.setMap(null);
      setTrafficEnabled(false);
    } else {
      trafficLayerRef.current.setMap(mapRef.current);
      setTrafficEnabled(true);
    }
  };

  // Toggle Map Type
  const changeMapType = (type: 'roadmap' | 'satellite' | 'terrain') => {
    setMapType(type);
    if (mapRef.current) {
      mapRef.current.setMapTypeId(type);
    }
  };

  // Render Markers and Bounds
  useEffect(() => {
    if (!mapRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;

    // Clear existing station markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Clear start/dest markers
    startDestMarkersRef.current.forEach((m) => m.setMap(null));
    startDestMarkersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // ── Start Marker ──
    if (startPoint) {
      const startMarker = new google.maps.Marker({
        position: { lat: startPoint.lat, lng: startPoint.lng },
        map: mapRef.current,
        title: 'Start Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        label: {
          text: 'S',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 'bold',
        },
      });
      startDestMarkersRef.current.push(startMarker);
      bounds.extend({ lat: startPoint.lat, lng: startPoint.lng });
      hasPoints = true;
    }

    // ── Destination Marker ──
    if (destPoint) {
      const destMarker = new google.maps.Marker({
        position: { lat: destPoint.lat, lng: destPoint.lng },
        map: mapRef.current,
        title: 'Destination',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        label: {
          text: 'D',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 'bold',
        },
      });
      startDestMarkersRef.current.push(destMarker);
      bounds.extend({ lat: destPoint.lat, lng: destPoint.lng });
      hasPoints = true;
    }

    // ── Station Markers ──
    stations.forEach((station) => {
      const pos = { lat: station.latitude, lng: station.longitude };
      bounds.extend(pos);
      hasPoints = true;

      const isBest = station.recommendationCategory === 'BEST_OVERALL';
      const isSelected = selectedStationId === station.id;
      const pressureVal = station.currentPressureBar ? `${Math.round(station.currentPressureBar)}B` : 'CNG';
      const color = isBest ? '#059669' : getPressureColor(station.currentPressureBar);

      // Custom SVG Pin Icon
      const pinSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.35"/>
            </filter>
          </defs>
          <path d="M19 0 C8.5 0 0 8.5 0 19 C0 31 19 48 19 48 C19 48 38 31 38 19 C38 8.5 29.5 0 19 0 Z" 
                fill="${color}" stroke="#ffffff" stroke-width="2.5" filter="url(#shadow)"/>
          <circle cx="19" cy="18" r="14" fill="#ffffff" />
          <text x="19" y="21" font-family="Arial, sans-serif" font-size="10" font-weight="bold" 
                text-anchor="middle" fill="${color}">${pressureVal}</text>
          ${isBest ? '<circle cx="30" cy="8" r="7" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5"/><text x="30" y="11" font-size="9" text-anchor="middle" fill="#ffffff">★</text>' : ''}
        </svg>
      `;

      const marker = new google.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: `${station.name} (${station.currentPressureBar ?? 0} Bar)`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvg)}`,
          scaledSize: new google.maps.Size(38, 48),
          anchor: new google.maps.Point(19, 48),
        },
        zIndex: isBest ? 1000 : isSelected ? 900 : 100,
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      });

      marker.addListener('click', () => {
        if (onStationClick) onStationClick(station);

        const waitMin = station.estimatedWaitMinutes ?? Math.round((station.vehiclesWaiting ?? 0) * 2);
        const pressureBar = station.currentPressureBar ? Math.round(station.currentPressureBar) : null;
        const pressureStatus = pressureBar && pressureBar >= 195 ? 'तेज़ गैस भराई (Fast Fill)' : pressureBar && pressureBar >= 175 ? 'मध्यम प्रेशर (Medium)' : 'कम प्रेशर (Slow Fill)';
        const detourInfo = station.extraDetourKm != null ? `+${station.extraDetourKm.toFixed(1)} km detour (~${station.estimatedDetourMinutes ?? 2} min)` : 'On highway route';

        const contentString = `
          <div style="font-family:system-ui, -apple-system, sans-serif; max-width:280px; padding:4px;">
            ${isBest ? `
              <div style="background:#ecfdf5; color:#065f46; padding:3px 8px; border-radius:999px; font-size:11px; font-weight:bold; display:inline-flex; align-items:center; gap:4px; margin-bottom:6px; border:1px solid #a7f3d0;">
                ⭐ Best Recommendation (कम गाड़ी + ज्यादा प्रेशर)
              </div>
            ` : ''}
            <h4 style="margin:0 0 2px 0; font-size:14px; font-weight:700; color:#0f172a;">${station.name}</h4>
            <p style="margin:0 0 8px 0; font-size:11px; color:#64748b;">${station.operator || 'CNG'} • ${station.address}, ${station.city}</p>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px; background:#f8fafc; padding:8px; border-radius:8px; border:1px solid #e2e8f0;">
              <div>
                <span style="font-size:10px; color:#64748b; font-weight:600; text-transform:uppercase;">गैस प्रेशर</span>
                <div style="font-size:15px; font-weight:800; color:${color};">${pressureBar ? `${pressureBar} Bar` : 'N/A'}</div>
                <div style="font-size:10px; color:#64748b;">${pressureStatus}</div>
              </div>
              <div>
                <span style="font-size:10px; color:#64748b; font-weight:600; text-transform:uppercase;">वाहनों की कतार</span>
                <div style="font-size:15px; font-weight:800; color:#0f172a;">${station.vehiclesWaiting ?? 0} Gaadi</div>
                <div style="font-size:10px; color:#64748b;">~${waitMin} min wait</div>
              </div>
            </div>

            <div style="font-size:11px; color:#475569; margin-bottom:8px;">
              🛣️ <strong>डिटूर:</strong> ${detourInfo}
            </div>

            <div style="display:flex; gap:6px; margin-top:6px;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}" target="_blank"
                 style="flex:1; text-align:center; background:#10b981; color:#ffffff; padding:6px 10px; border-radius:6px; font-size:11px; font-weight:600; text-decoration:none;">
                 Directions ↗
              </a>
              <a href="/stations/${station.id}" 
                 style="flex:1; text-align:center; background:#0f172a; color:#ffffff; padding:6px 10px; border-radius:6px; font-size:11px; font-weight:600; text-decoration:none;">
                 View Live Details
              </a>
            </div>
          </div>
        `;

        infoWindowRef.current.setContent(contentString);
        infoWindowRef.current.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if we have points
    if (hasPoints && mapRef.current) {
      mapRef.current.fitBounds(bounds);
      const listener = google.maps.event.addListener(mapRef.current, 'idle', () => {
        if (mapRef.current.getZoom() > 14) mapRef.current.setZoom(14);
        google.maps.event.removeListener(listener);
      });
    }
  }, [stations, selectedStationId, startPoint, destPoint]);

  // Render Route Polyline & Directions
  useEffect(() => {
    if (!mapRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;

    // Clear old directions / polylines
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Try Google Directions Service if start and dest are present
    if (startPoint && destPoint) {
      const directionsService = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#059669',
          strokeWeight: 6,
          strokeOpacity: 0.85,
        },
      });

      // If a station is selected or best recommended, set it as a waypoint
      const stopStation = stations.find((s) => s.id === selectedStationId) || stations.find((s) => s.recommendationCategory === 'BEST_OVERALL');
      const waypoints = stopStation
        ? [{ location: { lat: stopStation.latitude, lng: stopStation.longitude }, stopover: true }]
        : [];

      directionsService.route(
        {
          origin: { lat: startPoint.lat, lng: startPoint.lng },
          destination: { lat: destPoint.lat, lng: destPoint.lng },
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === google.maps.DirectionsStatus.OK && directionsRendererRef.current) {
            directionsRendererRef.current.setDirections(result);
          } else if (routeGeometry && routeGeometry.length > 0) {
            // Fallback to coordinates path if directions service fails or has quota limits
            drawGeometryPolyline(routeGeometry);
          }
        }
      );
    } else if (routeGeometry && routeGeometry.length > 0) {
      drawGeometryPolyline(routeGeometry);
    }

    function drawGeometryPolyline(geom: [number, number][]) {
      const path = geom.map((pt) => ({ lat: pt[0], lng: pt[1] }));
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#10b981',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map: mapRef.current,
      });
    }
  }, [startPoint, destPoint, routeGeometry, selectedStationId, stations]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-100" style={{ height }}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 size={36} className="text-emerald-600 animate-spin mb-2" />
          <p className="text-sm font-semibold text-slate-700">Loading Google Maps API...</p>
        </div>
      )}

      {/* Load Error Banner */}
      {loadError && (
        <div className="absolute top-4 left-4 right-4 z-20 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-3 shadow-lg flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Google Maps Notice</p>
            <p className="mt-0.5">{loadError}</p>
            <p className="mt-1 text-[11px] text-amber-700">Tip: You can use the map toggle in the top-right to switch to OpenStreetMap anytime.</p>
          </div>
        </div>
      )}

      {/* Map Floating Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
        {/* Traffic toggle */}
        <button
          type="button"
          onClick={toggleTraffic}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 ${
            trafficEnabled ? 'bg-amber-500 text-white' : 'bg-white/95 text-slate-700 hover:bg-white'
          }`}
        >
          <span>🚦</span> {trafficEnabled ? 'Traffic ON' : 'Traffic'}
        </button>

        {/* Map Type toggle */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md p-0.5 flex border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => changeMapType('roadmap')}
            className={`px-2.5 py-1 rounded-lg transition ${mapType === 'roadmap' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => changeMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg transition ${mapType === 'satellite' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-[11px] text-slate-700 flex items-center gap-3">
        <span className="flex items-center gap-1 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> 200+ Bar (High)
        </span>
        <span className="flex items-center gap-1 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> 175-195 Bar (Med)
        </span>
        <span className="flex items-center gap-1 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> &lt;175 Bar (Low)
        </span>
        <span className="flex items-center gap-1 font-semibold text-emerald-800">
          <Star size={12} className="text-amber-500 fill-amber-500" /> Best Choice
        </span>
      </div>
    </div>
  );
};

export default GoogleStationMap;
