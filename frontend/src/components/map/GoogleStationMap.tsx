import React, { useEffect, useRef, useState } from 'react';
import type { StationSummaryDto } from '../../types';
import { loadGoogleMaps, isGoogleMapsLoaded, hasGoogleMapsAuthFailed } from '../../services/googleMapsLoader';
import {
  Loader2,
  AlertTriangle,
  Layers,
  Navigation,
  Star,
  Zap,
  Gauge,
  Users,
  Locate,
  Crosshair,
  Key,
  ExternalLink,
} from 'lucide-react';

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
  onSwitchToOSM?: () => void;
  onEnterKey?: () => void;
}

function getPressureColor(bar: number | null | undefined): string {
  if (!bar) return '#64748b';
  if (bar >= 195) return '#10b981'; // Emerald (High Pressure)
  if (bar >= 175) return '#f59e0b'; // Amber (Moderate)
  return '#f43f5e';                 // Rose / Red (Low)
}

// Sleek Dark Cockpit Vector Map Style
const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0d2226' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f293d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#161e2e' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2b3954' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1c2638' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f8fafc' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1a2336' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#090d16' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
];

export const GoogleStationMap: React.FC<GoogleStationMapProps> = ({
  stations,
  routeGeometry,
  startPoint,
  destPoint,
  selectedStationId,
  onStationClick,
  height = '500px',
  onAuthError,
  onSwitchToOSM,
  onEnterKey,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const startDestMarkersRef = useRef<any[]>([]);
  const userLocationMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const trafficLayerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const handleAuthError = () => {
      setLoadError(
        'Google Maps API key not active or billing not enabled. You can enter an API key or switch to OpenStreetMap.'
      );
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
          setLoadError(
            'Google Maps API requires a valid API key. Enter your Key or switch to OpenStreetMap.'
          );
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
        gestureHandling: 'greedy',
        styles: mapType === 'roadmap' ? DARK_MAP_STYLES : [],
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
      mapRef.current.setOptions({
        styles: type === 'roadmap' ? DARK_MAP_STYLES : [],
      });
    }
  };

  const locateUser = () => {
    if (!navigator.geolocation || !mapRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(userPos);

        if (userLocationMarkerRef.current) {
          userLocationMarkerRef.current.setMap(null);
        }

        userLocationMarkerRef.current = new google.maps.Marker({
          position: userPos,
          map: mapRef.current,
          title: 'Your Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#38bdf8',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
          zIndex: 1100,
        });

        mapRef.current.panTo(userPos);
        mapRef.current.setZoom(13);
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation error:', err.message);
      },
      { timeout: 8000 }
    );
  };

  const fitAllBounds = () => {
    if (!mapRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    if (startPoint) {
      bounds.extend({ lat: startPoint.lat, lng: startPoint.lng });
      hasPoints = true;
    }
    if (destPoint) {
      bounds.extend({ lat: destPoint.lat, lng: destPoint.lng });
      hasPoints = true;
    }
    stations.forEach((s) => {
      bounds.extend({ lat: s.latitude, lng: s.longitude });
      hasPoints = true;
    });

    if (hasPoints) {
      mapRef.current.fitBounds(bounds);
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
          scale: 9,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
        },
        label: { text: 'S', color: '#ffffff', fontSize: '11px', fontWeight: 'bold' },
        zIndex: 500,
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
          scale: 9,
          fillColor: '#f43f5e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
        },
        label: { text: 'D', color: '#ffffff', fontSize: '11px', fontWeight: 'bold' },
        zIndex: 500,
      });
      startDestMarkersRef.current.push(destMarker);
      bounds.extend({ lat: destPoint.lat, lng: destPoint.lng });
      hasPoints = true;
    }

    // Station Markers with Live Telemetry Badges
    stations.forEach((station) => {
      const pos = { lat: station.latitude, lng: station.longitude };
      bounds.extend(pos);
      hasPoints = true;

      const isBest = station.recommendationCategory === 'BEST_OVERALL';
      const isSelected = selectedStationId === station.id;
      const pressureBar = station.currentPressureBar ? Math.round(station.currentPressureBar) : 200;
      const color = isBest ? '#10b981' : getPressureColor(station.currentPressureBar);

      const waitMin = station.estimatedWaitMinutes ?? Math.max(1, Math.round((station.vehiclesWaiting ?? 0) * 2));
      const vehiclesCount = station.vehiclesWaiting ?? 0;

      const pressureText = `${pressureBar} Bar`;
      const queueText = `🚗 ${vehiclesCount} • ~${waitMin}m`;

      const pinSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="76" height="52" viewBox="0 0 76 52">
          <defs>
            <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.45"/>
            </filter>
          </defs>
          <path d="M 6 0 H 70 A 6 6 0 0 1 76 6 V 36 A 6 6 0 0 1 70 42 H 44 L 38 50 L 32 42 H 6 A 6 6 0 0 1 0 36 V 6 A 6 6 0 0 1 6 0 Z" 
                fill="${color}" stroke="#ffffff" stroke-width="1.8" filter="url(#sh)"/>
          <rect x="4" y="4" width="68" height="17" rx="4" fill="#0b0f19" />
          <text x="38" y="16.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="900" text-anchor="middle" fill="${color}">${pressureText}</text>
          <text x="38" y="34.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" text-anchor="middle" fill="#ffffff">${queueText}</text>
          ${isBest ? '<circle cx="70" cy="5" r="6.5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.2"/><text x="70" y="8" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#000000">★</text>' : ''}
        </svg>
      `;

      const marker = new google.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: `${station.name} | ${pressureBar} Bar | ${vehiclesCount} Vehicles in Queue (~${waitMin}m wait)`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvg)}`,
          scaledSize: new google.maps.Size(76, 52),
          anchor: new google.maps.Point(38, 50),
        },
        zIndex: isBest ? 1000 : isSelected ? 900 : 100,
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      });

      marker.addListener('click', () => {
        if (onStationClick) onStationClick(station);

        const pressureStatus =
          pressureBar >= 195
            ? '⚡ High Pressure (Fast Full Tank)'
            : pressureBar >= 175
            ? '⚖️ Moderate Pressure'
            : '⚠️ Low Pressure';

        const psi = Math.round(pressureBar * 14.5038);
        const detourInfo =
          station.extraDetourKm != null
            ? `+${station.extraDetourKm.toFixed(1)} km (~${station.estimatedDetourMinutes ?? 1} min)`
            : 'Direct highway route';

        const verificationLabel = (station.verificationStatus || 'LIVE_VERIFIED').replace('_', ' ');
        const pred = station.arrivalPrediction;
        const arrivalText = pred && pred.predictionAvailable
          ? `<div style="margin-top:6px; padding:6px; background:#0c1d2e; border-radius:8px; border:1px solid #1e3a5f; font-size:10px;">
              <span style="color:#38bdf8; font-weight:800; text-transform:uppercase;">Forecast at Arrival:</span>
              <div style="display:flex; justify-content:space-between; margin-top:2px; color:#e2e8f0;">
                <span>Queue: <strong>${pred.predictedQueueAtArrival} Cars</strong> (~${pred.predictedWaitMinutesAtArrival}m)</span>
                <span>Pressure: <strong>~${pred.predictedPressureBarAtArrival} Bar</strong></span>
              </div>
            </div>`
          : '';

        const contentString = `
          <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width:280px; padding:3px; background:#0f172a; color:#f8fafc; border-radius:12px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <span style="background:#064e3b; color:#a7f3d0; padding:2px 7px; border-radius:6px; font-size:9.5px; font-weight:800; border:1px solid #059669;">
                ● ${verificationLabel}
              </span>
              ${
                isBest
                  ? `<span style="background:#f59e0b; color:#000; padding:2px 7px; border-radius:6px; font-size:9.5px; font-weight:900;">
                      ★ BEST CHOICE
                    </span>`
                  : ''
              }
            </div>
            <h4 style="margin:0 0 2px 0; font-size:13px; font-weight:800; color:#ffffff; line-height:1.2;">${station.name}</h4>
            <p style="margin:0 0 8px 0; font-size:11px; color:#94a3b8;">${station.operator || 'CNG'} • ${station.city}</p>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px; background:#162032; padding:8px; border-radius:10px; border:1px solid #1e293b;">
              <div>
                <span style="font-size:9.5px; color:#94a3b8; font-weight:800; text-transform:uppercase;">Measured Gas Pressure</span>
                <div style="font-size:15px; font-weight:900; color:${color};">${pressureBar} Bar</div>
                <div style="font-size:9.5px; color:#64748b;">${psi} PSI</div>
                <div style="font-size:9px; font-weight:700; color:${color}; margin-top:2px;">${pressureStatus}</div>
              </div>
              <div>
                <span style="font-size:9.5px; color:#94a3b8; font-weight:800; text-transform:uppercase;">Measured Queue</span>
                <div style="font-size:15px; font-weight:900; color:#f8fafc;">${vehiclesCount} Cars</div>
                <div style="font-size:9.5px; color:#64748b;">~${waitMin} min wait</div>
                <div style="font-size:9px; color:#34d399; font-weight:700; margin-top:2px;">${station.activeDispensers ?? 4}/${station.totalDispensers ?? 4} Nozzles</div>
              </div>
            </div>

            ${arrivalText}

            <div style="font-size:10.5px; color:#cbd5e1; margin-top:6px; margin-bottom:8px; display:flex; justify-content:space-between;">
              <span>🛣️ <strong>Detour:</strong> ${detourInfo}</span>
              <span style="color:#a7f3d0; font-weight:700;">₹${station.verifiedPricePerKg ?? 82.5}/kg</span>
            </div>

            <div style="display:flex; gap:6px; margin-top:6px;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}" target="_blank"
                 style="flex:1; text-align:center; background:#059669; color:#ffffff; padding:8px 10px; border-radius:8px; font-size:11px; font-weight:800; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px;">
                 Navigate Maps ↗
              </a>
              <a href="/stations/${station.id}" 
                 style="flex:1; text-align:center; background:#1e293b; color:#e2e8f0; padding:8px 10px; border-radius:8px; font-size:11px; font-weight:800; text-decoration:none; display:flex; align-items:center; justify-content:center; border:1px solid #334155;">
                 Details & Telemetry
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
        if (mapRef.current && mapRef.current.getZoom() > 14) {
          mapRef.current.setZoom(14);
        }
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
          strokeColor: '#10b981',
          strokeWeight: 6,
          strokeOpacity: 0.9,
        },
      });

      const stopStation =
        stations.find((s) => s.id === selectedStationId) ||
        stations.find((s) => s.recommendationCategory === 'BEST_OVERALL');

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
        strokeColor: '#10b981',
        strokeOpacity: 0.95,
        strokeWeight: 5,
        map: mapRef.current,
      });
    }
  }, [startPoint, destPoint, routeGeometry, selectedStationId, stations]);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-slate-800 bg-[#0c1220]"
      style={{ height }}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#090d16]/85 backdrop-blur-sm text-slate-100">
          <Loader2 size={36} className="text-emerald-400 animate-spin mb-2" />
          <p className="text-xs font-bold text-white">Connecting Google Maps API...</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Fetching pump station telemetry</p>
        </div>
      )}

      {/* Load / Auth Error Fallback Overlay */}
      {loadError && !isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#090d16]/95 text-white p-6 text-center backdrop-blur-md">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl mb-3 border border-amber-500/30">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-base font-extrabold text-white mb-1">Google Maps Setup Required</h3>
          <p className="text-xs text-slate-300 max-w-md mb-5 leading-relaxed">{loadError}</p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {onEnterKey && (
              <button
                type="button"
                onClick={onEnterKey}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Key size={14} /> Enter Google Maps API Key
              </button>
            )}
            {onSwitchToOSM && (
              <button
                type="button"
                onClick={onSwitchToOSM}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
              >
                🗺️ Switch to OpenStreetMap
              </button>
            )}
            <a
              href="https://www.google.com/maps/search/cng+station+near+me"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 transition flex items-center gap-1.5"
            >
              <ExternalLink size={13} /> Open in Google Maps
            </a>
          </div>
        </div>
      )}

      {/* Floating Map Controls on Top-Left */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={toggleTraffic}
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shadow-md transition flex items-center gap-1 ${
            trafficEnabled
              ? 'bg-amber-500 text-slate-950 font-black'
              : 'bg-[#0f172a]/90 backdrop-blur-md text-slate-200 border border-slate-700 hover:bg-[#1a2336]'
          }`}
          title="Toggle Google Maps Live Traffic"
        >
          <span>🚦</span> {trafficEnabled ? 'Traffic ON' : 'Traffic'}
        </button>

        <div className="bg-[#0f172a]/90 backdrop-blur-md rounded-xl shadow-md p-0.5 flex border border-slate-700 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => changeMapType('roadmap')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mapType === 'roadmap' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => changeMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mapType === 'satellite' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
        </div>

        <button
          type="button"
          onClick={locateUser}
          disabled={locating}
          className="bg-[#0f172a]/90 hover:bg-[#1a2336] text-slate-200 p-1.5 rounded-xl shadow-md border border-slate-700 transition text-[11px] font-bold flex items-center gap-1"
          title="Locate my position on map"
        >
          <Locate size={14} className={locating ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
          <span className="hidden sm:inline">My Location</span>
        </button>

        <button
          type="button"
          onClick={fitAllBounds}
          className="bg-[#0f172a]/90 hover:bg-[#1a2336] text-slate-200 p-1.5 rounded-xl shadow-md border border-slate-700 transition text-[11px] font-bold flex items-center gap-1"
          title="Fit all stations in view"
        >
          <Crosshair size={14} className="text-emerald-400" />
          <span className="hidden sm:inline">Fit All</span>
        </button>
      </div>

      {/* Floating Telemetry Legend on Bottom */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto z-10 bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 shadow-lg text-[10px] sm:text-[11px] text-slate-300 flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4 flex-wrap">
        <span className="flex items-center gap-1 font-bold text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm"></span> 200+ Bar (High)
        </span>
        <span className="flex items-center gap-1 font-bold text-amber-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm"></span> 175-195 Bar
        </span>
        <span className="flex items-center gap-1 font-bold text-rose-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm"></span> &lt;175 Bar
        </span>
        <span className="flex items-center gap-1 font-bold text-white">
          <Star size={12} className="text-amber-400 fill-amber-400" /> Best Choice
        </span>
      </div>
    </div>
  );
};

export default GoogleStationMap;
