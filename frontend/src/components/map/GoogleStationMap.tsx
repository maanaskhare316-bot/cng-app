import React, { useEffect, useRef, useState } from 'react';
import type { StationSummaryDto } from '../../types';
import { loadGoogleMaps, isGoogleMapsLoaded } from '../../services/googleMapsLoader';
import { Loader2, AlertTriangle, Layers, Navigation, Star, Zap, Gauge, Users } from 'lucide-react';

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
  if (bar === null) return '#64748b';
  if (bar >= 195) return '#059669';   // emerald
  if (bar >= 175) return '#d97706';   // amber
  return '#dc2626';                   // red
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
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  useEffect(() => {
    const handleAuthError = () => {
      setLoadError('Google Maps API Key not active or billing not enabled. You can switch to OpenStreetMap using the toggle above.');
      if (onAuthError) onAuthError();
    };
    window.addEventListener('google-maps-auth-error', handleAuthError);
    return () => window.removeEventListener('google-maps-auth-error', handleAuthError);
  }, [onAuthError]);

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
          setLoadError('Google Maps API ready in development mode. Switch to OpenStreetMap anytime.');
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

  const initMap = () => {
    if (!mapContainerRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;

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
        streetViewControl: false,
        zoomControl: true,
        gestureHandling: 'greedy', // mobile-friendly pan & pinch
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
          { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
        ],
      });

      infoWindowRef.current = new google.maps.InfoWindow();
      trafficLayerRef.current = new google.maps.TrafficLayer();
    }
  };

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

  const changeMapType = (type: 'roadmap' | 'satellite') => {
    setMapType(type);
    if (mapRef.current) {
      mapRef.current.setMapTypeId(type);
    }
  };

  // Render Markers
  useEffect(() => {
    if (!mapRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    startDestMarkersRef.current.forEach((m) => m.setMap(null));
    startDestMarkersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // Start Marker
    if (startPoint) {
      const startMarker = new google.maps.Marker({
        position: { lat: startPoint.lat, lng: startPoint.lng },
        map: mapRef.current,
        title: 'Start Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
        },
        label: { text: 'S', color: '#ffffff', fontSize: '10px', fontWeight: 'bold' },
      });
      startDestMarkersRef.current.push(startMarker);
      bounds.extend({ lat: startPoint.lat, lng: startPoint.lng });
      hasPoints = true;
    }

    // Destination Marker
    if (destPoint) {
      const destMarker = new google.maps.Marker({
        position: { lat: destPoint.lat, lng: destPoint.lng },
        map: mapRef.current,
        title: 'Destination',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
        },
        label: { text: 'D', color: '#ffffff', fontSize: '10px', fontWeight: 'bold' },
      });
      startDestMarkersRef.current.push(destMarker);
      bounds.extend({ lat: destPoint.lat, lng: destPoint.lng });
      hasPoints = true;
    }

    // Station Markers
    stations.forEach((station) => {
      const pos = { lat: station.latitude, lng: station.longitude };
      bounds.extend(pos);
      hasPoints = true;

      const isBest = station.recommendationCategory === 'BEST_OVERALL';
      const isSelected = selectedStationId === station.id;
      const pressureVal = station.currentPressureBar ? `${Math.round(station.currentPressureBar)}B` : 'CNG';
      const color = isBest ? '#059669' : getPressureColor(station.currentPressureBar);

      // Clean SVG pin
      const pinSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
          <defs>
            <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.3"/>
            </filter>
          </defs>
          <path d="M20 0 C9 0 0 9 0 20 C0 32 20 48 20 48 C20 48 40 32 40 20 C40 9 31 0 20 0 Z" 
                fill="${color}" stroke="#ffffff" stroke-width="2.5" filter="url(#sh)"/>
          <circle cx="20" cy="18" r="13" fill="#ffffff" />
          <text x="20" y="22" font-family="-apple-system, system-ui, sans-serif" font-size="9.5" font-weight="800" 
                text-anchor="middle" fill="${color}">${pressureVal}</text>
          ${isBest ? '<circle cx="32" cy="8" r="7" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5"/><text x="32" y="11" font-size="9" text-anchor="middle" fill="#ffffff">★</text>' : ''}
        </svg>
      `;

      const marker = new google.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: `${station.name} (${station.currentPressureBar ?? 0} Bar)`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvg)}`,
          scaledSize: new google.maps.Size(40, 48),
          anchor: new google.maps.Point(20, 48),
        },
        zIndex: isBest ? 1000 : isSelected ? 900 : 100,
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      });

      marker.addListener('click', () => {
        if (onStationClick) onStationClick(station);

        const waitMin = station.estimatedWaitMinutes ?? Math.round((station.vehiclesWaiting ?? 0) * 2);
        const pressureBar = station.currentPressureBar ? Math.round(station.currentPressureBar) : null;
        const pressureStatus = pressureBar && pressureBar >= 195 ? 'High Pressure (Fast Fill)' : pressureBar && pressureBar >= 175 ? 'Moderate Pressure' : 'Low Pressure';
        const detourInfo = station.extraDetourKm != null ? `+${station.extraDetourKm.toFixed(1)} km detour (~${station.estimatedDetourMinutes ?? 1} min)` : 'On highway route';

        const contentString = `
          <div style="font-family:-apple-system, system-ui, sans-serif; max-width:270px; padding:3px;">
            ${isBest ? `
              <div style="background:#ecfdf5; color:#065f46; padding:3px 8px; border-radius:999px; font-size:10.5px; font-weight:800; display:inline-flex; align-items:center; gap:4px; margin-bottom:6px; border:1px solid #a7f3d0;">
                ⭐ Best Recommendation (Short Queue & High Bar)
              </div>
            ` : ''}
            <h4 style="margin:0 0 2px 0; font-size:13px; font-weight:700; color:#0f172a; line-height:1.2;">${station.name}</h4>
            <p style="margin:0 0 6px 0; font-size:11px; color:#64748b;">${station.operator || 'CNG'} • ${station.city}</p>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px; background:#f8fafc; padding:8px; border-radius:8px; border:1px solid #e2e8f0;">
              <div>
                <span style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase;">Pressure</span>
                <div style="font-size:15px; font-weight:800; color:${color};">${pressureBar ? `${pressureBar} Bar` : 'N/A'}</div>
                <div style="font-size:10px; color:#64748b;">${pressureStatus}</div>
              </div>
              <div>
                <span style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase;">Queue</span>
                <div style="font-size:15px; font-weight:800; color:#0f172a;">${station.vehiclesWaiting ?? 0} Vehicles</div>
                <div style="font-size:10px; color:#64748b;">~${waitMin} min wait</div>
              </div>
            </div>

            <div style="font-size:11px; color:#475569; margin-bottom:8px;">
              🛣️ <strong>Detour:</strong> ${detourInfo}
            </div>

            <div style="display:flex; gap:6px; margin-top:6px;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}" target="_blank"
                 style="flex:1; text-align:center; background:#059669; color:#ffffff; padding:7px 10px; border-radius:8px; font-size:11px; font-weight:700; text-decoration:none;">
                 Directions ↗
              </a>
              <a href="/stations/${station.id}" 
                 style="flex:1; text-align:center; background:#0f172a; color:#ffffff; padding:7px 10px; border-radius:8px; font-size:11px; font-weight:700; text-decoration:none;">
                 Live Telemetry
              </a>
            </div>
          </div>
        `;

        infoWindowRef.current.setContent(contentString);
        infoWindowRef.current.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    if (hasPoints && mapRef.current) {
      mapRef.current.fitBounds(bounds);
      const listener = google.maps.event.addListener(mapRef.current, 'idle', () => {
        if (mapRef.current.getZoom() > 14) mapRef.current.setZoom(14);
        google.maps.event.removeListener(listener);
      });
    }
  }, [stations, selectedStationId, startPoint, destPoint]);

  // Route Polyline & Directions
  useEffect(() => {
    if (!mapRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (routeGeometry && routeGeometry.length > 0) {
      drawGeometryPolyline(routeGeometry);
    }

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
            // Remove the fallback geometry polyline once Google Directions arrives
            if (polylineRef.current) {
              polylineRef.current.setMap(null);
              polylineRef.current = null;
            }
            directionsRendererRef.current.setDirections(result);
          }
        }
      );
    }

    function drawGeometryPolyline(geom: [number, number][]) {
      const path = geom.map((pt) => ({ lat: pt[0], lng: pt[1] }));
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#059669',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map: mapRef.current,
      });
    }
  }, [startPoint, destPoint, routeGeometry, selectedStationId, stations]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 size={32} className="text-emerald-600 animate-spin mb-2" />
          <p className="text-xs font-semibold text-slate-700">Loading Map...</p>
        </div>
      )}

      {/* Floating Map Controls - Responsive on Mobile */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={toggleTraffic}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-md transition flex items-center gap-1 ${
            trafficEnabled ? 'bg-amber-500 text-white' : 'bg-white/95 text-slate-700 hover:bg-white'
          }`}
        >
          <span>🚦</span> {trafficEnabled ? 'Traffic ON' : 'Traffic'}
        </button>

        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md p-0.5 flex border border-slate-200 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => changeMapType('roadmap')}
            className={`px-2 py-0.5 rounded-lg transition ${mapType === 'roadmap' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => changeMapType('satellite')}
            className={`px-2 py-0.5 rounded-lg transition ${mapType === 'satellite' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Compact Legend on Bottom */}
      <div className="absolute bottom-2 left-2 right-2 sm:right-auto z-10 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-md text-[10px] sm:text-[11px] text-slate-700 flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
        <span className="flex items-center gap-1 font-bold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span> 200+ Bar
        </span>
        <span className="flex items-center gap-1 font-bold text-amber-700">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> 175-195 Bar
        </span>
        <span className="flex items-center gap-1 font-bold text-red-600">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> &lt;175 Bar
        </span>
        <span className="flex items-center gap-1 font-bold text-slate-800">
          <Star size={11} className="text-amber-500 fill-amber-500" /> Best Choice
        </span>
      </div>
    </div>
  );
};

export default GoogleStationMap;
