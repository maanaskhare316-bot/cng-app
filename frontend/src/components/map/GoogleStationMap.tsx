import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { StationSummaryDto } from '../../types';
import { loadGoogleMaps, isGoogleMapsLoaded } from '../../services/googleMapsLoader';
import type { GoogleRouteOption } from '../../services/googleRoutingService';
import {
  Loader2,
  AlertTriangle,
  Star,
  Zap,
  Locate,
  Crosshair,
  Key,
  ExternalLink,
  Navigation,
  Compass,
  Layers,
  Fuel,
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
  alternativeRoutes?: GoogleRouteOption[];
  selectedRouteIndex?: number;
  onSelectRouteIndex?: (index: number) => void;
}

function getPressureColor(bar: number | null | undefined): string {
  if (!bar) return '#64748B';
  if (bar >= 195) return '#10B981'; // Emerald (High Pressure)
  if (bar >= 175) return '#F59E0B'; // Amber (Moderate)
  return '#EF4444';                 // Coral / Red (Low)
}

// Minimal Navigation Map Style matching Deep Navy & Soft Slate
const NAV_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0F172A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0F172A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#E2E8F0' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#132337' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E293B' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0F172A' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#CBD5E1' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2C3E55' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1E293B' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#F8FAFC' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1E293B' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#090D16' }] },
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
  alternativeRoutes = [],
  selectedRouteIndex = 0,
  onSelectRouteIndex,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const startDestMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyCircleRef = useRef<any>(null);
  const primaryPolylineRef = useRef<any>(null);
  const altPolylinesRef = useRef<any[]>([]);
  const trafficLayerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap');
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Auth Error Listener
  useEffect(() => {
    const handleAuthError = () => {
      setLoadError(
        'Google Maps API Key not active or billing not enabled. You can provide an API key in the Setup modal or switch to OpenStreetMap.'
      );
      if (onAuthError) onAuthError();
    };
    window.addEventListener('google-maps-auth-error', handleAuthError);
    return () => window.removeEventListener('google-maps-auth-error', handleAuthError);
  }, [onAuthError]);

  // Load Google Maps Script
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
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
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
        styles: mapType === 'roadmap' ? NAV_MAP_STYLES : [],
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

  const changeMapType = (type: 'roadmap' | 'satellite' | 'terrain') => {
    setMapType(type);
    if (mapRef.current) {
      mapRef.current.setMapTypeId(type);
      mapRef.current.setOptions({
        styles: type === 'roadmap' ? NAV_MAP_STYLES : [],
      });
    }
  };

  // Browser Geolocation — Locate & Continuous Live Tracking
  const updateUserPositionOnMap = useCallback((pos: GeolocationPosition, shouldPan: boolean = false) => {
    if (!mapRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;

    const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const accuracy = pos.coords.accuracy || 25;
    setUserLocation(userPos);

    // 1. User Location Pulsing Dot Marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(userPos);
    } else {
      const userSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="#16B8C9" fill-opacity="0.25">
            <animate attributeName="r" values="10;17;10" dur="2s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.4;0.05;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="18" cy="18" r="7" fill="#16B8C9" stroke="#ffffff" stroke-width="2.5" />
          <circle cx="18" cy="18" r="2.5" fill="#ffffff" />
        </svg>
      `;

      userMarkerRef.current = new google.maps.Marker({
        position: userPos,
        map: mapRef.current,
        title: `Your Location (GPS ±${Math.round(accuracy)}m)`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(userSvg)}`,
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        },
        zIndex: 1200,
      });
    }

    // 2. GPS Accuracy Circle
    if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.setCenter(userPos);
      userAccuracyCircleRef.current.setRadius(accuracy);
    } else {
      userAccuracyCircleRef.current = new google.maps.Circle({
        strokeColor: '#16B8C9',
        strokeOpacity: 0.45,
        strokeWeight: 1,
        fillColor: '#16B8C9',
        fillOpacity: 0.1,
        map: mapRef.current,
        center: userPos,
        radius: accuracy,
        zIndex: 50,
      });
    }

    if (shouldPan) {
      mapRef.current.panTo(userPos);
      if (mapRef.current.getZoom() < 13) {
        mapRef.current.setZoom(13);
      }
    }
  }, []);

  const handleLocateOnce = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        updateUserPositionOnMap(pos, true);
      },
      (err) => {
        setLocating(false);
        setLocationError(`GPS error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  const toggleLiveTracking = () => {
    if (!navigator.geolocation) return;

    if (isLiveTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveTracking(false);
    } else {
      setIsLiveTracking(true);
      setLocationError(null);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          updateUserPositionOnMap(pos, false);
        },
        (err) => {
          setLocationError(`Live GPS error: ${err.message}`);
          setIsLiveTracking(false);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    }
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
    if (userLocation) {
      bounds.extend(userLocation);
      hasPoints = true;
    }
    stations.forEach((s) => {
      bounds.extend({ lat: s.latitude, lng: s.longitude });
      hasPoints = true;
    });

    if (hasPoints) {
      mapRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  };

  // Render Start, Destination & Smart CNG Station Markers
  useEffect(() => {
    if (!mapRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    startDestMarkersRef.current.forEach((m) => m.setMap(null));
    startDestMarkersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // Start Marker (Origin)
    if (startPoint) {
      const startMarker = new google.maps.Marker({
        position: { lat: startPoint.lat, lng: startPoint.lng },
        map: mapRef.current,
        title: 'Start Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#16B8C9',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
        },
        label: { text: 'A', color: '#14283F', fontSize: '11px', fontWeight: 'bold' },
        zIndex: 600,
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
          fillColor: '#B54747',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
        },
        label: { text: 'B', color: '#FFFFFF', fontSize: '11px', fontWeight: 'bold' },
        zIndex: 600,
      });
      startDestMarkersRef.current.push(destMarker);
      bounds.extend({ lat: destPoint.lat, lng: destPoint.lng });
      hasPoints = true;
    }

    // Render CNG Station Markers with Live Telemetry Badges
    stations.forEach((station) => {
      const pos = { lat: station.latitude, lng: station.longitude };
      bounds.extend(pos);
      hasPoints = true;

      const isBest = station.recommendationCategory === 'BEST_OVERALL';
      const isFastest = station.recommendationCategory === 'FASTEST_REFUELING';
      const isSelected = selectedStationId === station.id;
      const pressureBar = station.currentPressureBar ? Math.round(station.currentPressureBar) : 200;
      const color = isBest ? '#10B981' : isFastest ? '#16B8C9' : getPressureColor(station.currentPressureBar);

      const waitMin = station.estimatedWaitMinutes ?? Math.max(1, Math.round((station.vehiclesWaiting ?? 0) * 2));
      const vehiclesCount = station.vehiclesWaiting ?? 0;

      const pressureText = `${pressureBar} Bar`;
      const queueText = `🚗 ${vehiclesCount} • ~${waitMin}m`;

      const strokeBorder = isSelected ? '#16B8C9' : '#FFFFFF';
      const strokeWidth = isSelected ? '2.8' : '1.8';

      const pinSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="76" height="52" viewBox="0 0 76 52">
          <defs>
            <filter id="cng_sh_${station.id}" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.45"/>
            </filter>
          </defs>
          <path d="M 6 0 H 70 A 6 6 0 0 1 76 6 V 36 A 6 6 0 0 1 70 42 H 44 L 38 50 L 32 42 H 6 A 6 6 0 0 1 0 36 V 6 A 6 6 0 0 1 6 0 Z" 
                fill="${color}" stroke="${strokeBorder}" stroke-width="${strokeWidth}" filter="url(#cng_sh_${station.id})"/>
          <rect x="4" y="4" width="68" height="17" rx="4" fill="#14283F" />
          <text x="38" y="16.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="900" text-anchor="middle" fill="${color}">${pressureText}</text>
          <text x="38" y="34.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" text-anchor="middle" fill="#FFFFFF">${queueText}</text>
          ${isBest ? '<circle cx="70" cy="5" r="6.5" fill="#F59E0B" stroke="#FFFFFF" stroke-width="1.2"/><text x="70" y="8" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#000000">★</text>' : ''}
          ${isFastest && !isBest ? '<circle cx="70" cy="5" r="6.5" fill="#16B8C9" stroke="#FFFFFF" stroke-width="1.2"/><text x="70" y="8" font-size="8" font-weight="bold" text-anchor="middle" fill="#FFFFFF">⚡</text>' : ''}
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
            ? '⚡ High Pressure (Peak Fill)'
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
          ? `<div style="margin-top:6px; padding:6px 8px; background:#14283F; border-radius:8px; border:1px solid #1D3854; font-size:10px;">
              <span style="color:#16B8C9; font-weight:800; text-transform:uppercase;">Arrival Forecast (${pred.etaClockTime}):</span>
              <div style="display:flex; justify-content:space-between; margin-top:2px; color:#F8FAFC;">
                <span>Queue: <strong>${pred.predictedQueueAtArrival} Cars</strong> (~${pred.predictedWaitMinutesAtArrival}m)</span>
                <span>Pressure: <strong>~${pred.predictedPressureBarAtArrival} Bar</strong></span>
              </div>
            </div>`
          : '';

        const contentString = `
          <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width:280px; padding:2px; background:#F8FAFC; color:#14283F; border-radius:12px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <span style="background:#E3F4EC; color:#26734D; padding:2px 7px; border-radius:6px; font-size:9.5px; font-weight:800; border:1px solid #C0E4D0;">
                ● ${verificationLabel}
              </span>
              ${
                isBest
                  ? `<span style="background:#FFF2DB; color:#98651C; padding:2px 7px; border-radius:6px; font-size:9.5px; font-weight:900; border:1px solid #FFE2A4;">
                      ★ BEST CHOICE
                    </span>`
                  : isFastest
                  ? `<span style="background:#EBF8FF; color:#16B8C9; padding:2px 7px; border-radius:6px; font-size:9.5px; font-weight:900; border:1px solid #BEE3F8;">
                      ⚡ FASTEST REFUEL
                    </span>`
                  : ''
              }
            </div>
            <h4 style="margin:0 0 2px 0; font-size:13px; font-weight:800; color:#14283F; line-height:1.2;">${station.name}</h4>
            <p style="margin:0 0 8px 0; font-size:11px; color:#64748B;">${station.operator || 'CNG'} • ${station.city}</p>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px; background:#E8EEF5; padding:8px; border-radius:10px; border:1px solid #DCE5EE;">
              <div>
                <span style="font-size:9.5px; color:#64748B; font-weight:800; text-transform:uppercase;">Gas Pressure</span>
                <div style="font-size:15px; font-weight:900; color:${color};">${pressureBar} Bar</div>
                <div style="font-size:9.5px; color:#64748B;">${psi} PSI</div>
                <div style="font-size:9px; font-weight:700; color:${color}; margin-top:2px;">${pressureStatus}</div>
              </div>
              <div>
                <span style="font-size:9.5px; color:#64748B; font-weight:800; text-transform:uppercase;">Waiting Queue</span>
                <div style="font-size:15px; font-weight:900; color:#14283F;">${vehiclesCount} Cars</div>
                <div style="font-size:9.5px; color:#64748B;">~${waitMin} min wait</div>
                <div style="font-size:9px; color:#26734D; font-weight:700; margin-top:2px;">${station.activeDispensers ?? 4}/${station.totalDispensers ?? 4} Nozzles</div>
              </div>
            </div>

            ${arrivalText}

            <div style="font-size:10.5px; color:#14283F; margin-top:6px; margin-bottom:8px; display:flex; justify-content:space-between;">
              <span>🛣️ <strong>Actual Detour:</strong> ${detourInfo}</span>
              <span style="color:#26734D; font-weight:700;">₹${station.verifiedPricePerKg ?? 82.5}/kg</span>
            </div>

            <div style="display:flex; gap:6px; margin-top:6px;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}" target="_blank"
                 style="flex:1; text-align:center; background:#16B8C9; color:#FFFFFF; padding:8px 10px; border-radius:8px; font-size:11px; font-weight:800; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px;">
                 Navigate Maps ↗
              </a>
              <a href="/stations/${station.id}" 
                 style="flex:1; text-align:center; background:#14283F; color:#FFFFFF; padding:8px 10px; border-radius:8px; font-size:11px; font-weight:800; text-decoration:none; display:flex; align-items:center; justify-content:center;">
                 Details
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
      mapRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      const listener = google.maps.event.addListener(mapRef.current, 'idle', () => {
        if (mapRef.current && mapRef.current.getZoom() > 14) {
          mapRef.current.setZoom(14);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [stations, selectedStationId, startPoint, destPoint, onStationClick]);

  // Render Primary & Alternative Routes Polylines
  useEffect(() => {
    if (!mapRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;

    // Clear primary polyline
    if (primaryPolylineRef.current) {
      primaryPolylineRef.current.setMap(null);
      primaryPolylineRef.current = null;
    }

    // Clear alternative polylines
    altPolylinesRef.current.forEach((p) => p.setMap(null));
    altPolylinesRef.current = [];

    // Draw Alternative Routes first (under primary)
    if (alternativeRoutes && alternativeRoutes.length > 0) {
      alternativeRoutes.forEach((alt, idx) => {
        if (idx === selectedRouteIndex) return; // Draw selected as primary

        const altPath = alt.geometry.map((pt) => ({ lat: pt[0], lng: pt[1] }));
        const altLine = new google.maps.Polyline({
          path: altPath,
          geodesic: true,
          strokeColor: '#64748B',
          strokeOpacity: 0.6,
          strokeWeight: 4,
          map: mapRef.current,
          zIndex: 400,
        });

        altLine.addListener('click', () => {
          if (onSelectRouteIndex) onSelectRouteIndex(idx);
        });

        altPolylinesRef.current.push(altLine);
      });
    }

    // Determine geometry for primary route
    const activeRouteGeom =
      alternativeRoutes.length > 0 && alternativeRoutes[selectedRouteIndex]
        ? alternativeRoutes[selectedRouteIndex].geometry
        : routeGeometry;

    if (activeRouteGeom && activeRouteGeom.length > 0) {
      const path = activeRouteGeom.map((pt) => ({ lat: pt[0], lng: pt[1] }));
      primaryPolylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#16B8C9', // Electric Cyan
        strokeOpacity: 0.95,
        strokeWeight: 6,
        map: mapRef.current,
        zIndex: 500,
      });
    }
  }, [routeGeometry, alternativeRoutes, selectedRouteIndex, onSelectRouteIndex]);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-[#DCE5EE] bg-[#0C1220]"
      style={{ height }}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Loading State Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#090D16]/85 backdrop-blur-sm text-slate-100">
          <Loader2 size={36} className="text-[#16B8C9] animate-spin mb-2" />
          <p className="text-xs font-bold text-white">Connecting Google Maps Platform...</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Initializing Google Routes & Places API</p>
        </div>
      )}

      {/* Load / Auth Error Fallback Overlay */}
      {loadError && !isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#090D16]/95 text-white p-6 text-center backdrop-blur-md">
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
                className="px-4 py-2 rounded-xl bg-[#16B8C9] hover:bg-[#119EAD] text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
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

      {/* Floating Controls Bar on Top-Left */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
        {/* Traffic Layer Toggle */}
        <button
          type="button"
          onClick={toggleTraffic}
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shadow-md transition flex items-center gap-1 ${
            trafficEnabled
              ? 'bg-[#F59E0B] text-slate-950 font-black'
              : 'bg-[#0F172A]/90 backdrop-blur-md text-slate-200 border border-slate-700 hover:bg-[#1A2336]'
          }`}
          title="Toggle Google Maps Live Traffic"
        >
          <span>🚦</span> {trafficEnabled ? 'Traffic ON' : 'Traffic'}
        </button>

        {/* Map Type Toggle */}
        <div className="bg-[#0F172A]/90 backdrop-blur-md rounded-xl shadow-md p-0.5 flex border border-slate-700 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => changeMapType('roadmap')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mapType === 'roadmap' ? 'bg-[#16B8C9] text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Road
          </button>
          <button
            type="button"
            onClick={() => changeMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mapType === 'satellite' ? 'bg-[#16B8C9] text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => changeMapType('terrain')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mapType === 'terrain' ? 'bg-[#16B8C9] text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Terrain
          </button>
        </div>

        {/* Locate User Once */}
        <button
          type="button"
          onClick={handleLocateOnce}
          disabled={locating}
          className="bg-[#0F172A]/90 hover:bg-[#1A2336] text-slate-200 p-1.5 rounded-xl shadow-md border border-slate-700 transition text-[11px] font-bold flex items-center gap-1"
          title="Locate my position on map"
        >
          <Locate size={14} className={locating ? 'animate-spin text-[#16B8C9]' : 'text-[#16B8C9]'} />
          <span className="hidden sm:inline">My Location</span>
        </button>

        {/* Live Continuous Tracking Toggle */}
        <button
          type="button"
          onClick={toggleLiveTracking}
          className={`p-1.5 rounded-xl shadow-md border transition text-[11px] font-bold flex items-center gap-1 ${
            isLiveTracking
              ? 'bg-[#16B8C9] text-white border-[#16B8C9]'
              : 'bg-[#0F172A]/90 text-slate-300 border-slate-700 hover:bg-[#1A2336]'
          }`}
          title="Toggle live continuous GPS location tracking"
        >
          <Compass size={14} className={isLiveTracking ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">{isLiveTracking ? 'Tracking Live' : 'Track GPS'}</span>
        </button>

        {/* Fit Bounds */}
        <button
          type="button"
          onClick={fitAllBounds}
          className="bg-[#0F172A]/90 hover:bg-[#1A2336] text-slate-200 p-1.5 rounded-xl shadow-md border border-slate-700 transition text-[11px] font-bold flex items-center gap-1"
          title="Fit all stations and route in view"
        >
          <Crosshair size={14} className="text-[#10B981]" />
          <span className="hidden sm:inline">Fit All</span>
        </button>
      </div>

      {locationError && (
        <div className="absolute top-12 left-2.5 z-10 bg-rose-950/90 border border-rose-700 text-rose-200 text-[11px] px-3 py-1.5 rounded-xl backdrop-blur-md shadow-md">
          {locationError}
        </div>
      )}

      {/* Floating Telemetry Legend on Bottom */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto z-10 bg-[#0F172A]/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 shadow-lg text-[10px] sm:text-[11px] text-slate-300 flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4 flex-wrap">
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
