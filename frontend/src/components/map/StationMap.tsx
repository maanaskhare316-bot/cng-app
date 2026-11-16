import React, { useState, useEffect } from 'react';
import type { StationSummaryDto } from '../../types';
import GoogleStationMap from './GoogleStationMap';
import { ApiKeyModal } from '../ui/ApiKeyModal';
import { getStoredGoogleApiKey } from '../../services/googleMapsLoader';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Key, Navigation, Star, Zap, Users, ExternalLink } from 'lucide-react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface LatLng {
  lat: number;
  lng: number;
}

interface StationMapProps {
  stations: StationSummaryDto[];
  routeGeometry?: [number, number][];
  startPoint?: LatLng;
  destPoint?: LatLng;
  selectedStationId?: number | null;
  onStationClick?: (station: StationSummaryDto) => void;
  height?: string;
  defaultEngine?: 'google' | 'leaflet';
}

function getPressureColor(bar: number | null | undefined): string {
  if (!bar) return '#64748b';
  if (bar >= 195) return '#10b981'; // Emerald
  if (bar >= 175) return '#f59e0b'; // Amber
  return '#f43f5e';                 // Rose / Red
}

function LeafletAutoFit({
  stations,
  startPoint,
  destPoint,
}: {
  stations: StationSummaryDto[];
  startPoint?: LatLng;
  destPoint?: LatLng;
}) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [];
    stations.forEach((s) => points.push([s.latitude, s.longitude]));
    if (startPoint) points.push([startPoint.lat, startPoint.lng]);
    if (destPoint) points.push([destPoint.lat, destPoint.lng]);

    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
  }, [map, stations, startPoint, destPoint]);
  return null;
}

export const StationMap: React.FC<StationMapProps> = ({
  stations,
  routeGeometry,
  startPoint,
  destPoint,
  selectedStationId,
  onStationClick,
  height = '500px',
  defaultEngine = 'google',
}) => {
  const [engine, setEngine] = useState<'google' | 'leaflet'>(() => {
    try {
      const saved = localStorage.getItem('cng_map_engine_preference');
      if (saved === 'leaflet' || saved === 'google') return saved;
    } catch {}
    const hasKey = !!getStoredGoogleApiKey();
    return hasKey ? 'google' : 'leaflet';
  });

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(() => !!getStoredGoogleApiKey());

  const handleEngineChange = (newEngine: 'google' | 'leaflet') => {
    setEngine(newEngine);
    try {
      localStorage.setItem('cng_map_engine_preference', newEngine);
    } catch {}
  };

  const handleKeySaved = (key: string) => {
    setHasApiKey(!!key);
    if (key.trim()) {
      handleEngineChange('google');
    }
  };

  const createStationDivIcon = (s: StationSummaryDto) => {
    const isBest = s.recommendationCategory === 'BEST_OVERALL';
    const pressureBar = s.currentPressureBar ? Math.round(s.currentPressureBar) : 200;
    const color = isBest ? '#10b981' : getPressureColor(s.currentPressureBar);
    const waitMin = s.estimatedWaitMinutes ?? Math.max(1, Math.round((s.vehiclesWaiting ?? 0) * 2));
    const vehiclesCount = s.vehiclesWaiting ?? 0;

    const pressureText = `${pressureBar} Bar`;
    const queueText = `🚗 ${vehiclesCount} • ~${waitMin}m`;

    const html = `
      <div style="position:relative; width:76px; height:52px; cursor:pointer;">
        <svg width="76" height="52" viewBox="0 0 76 52">
          <defs>
            <filter id="leaf_sh_${s.id}" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.5"/>
            </filter>
          </defs>
          <path d="M 6 0 H 70 A 6 6 0 0 1 76 6 V 36 A 6 6 0 0 1 70 42 H 44 L 38 50 L 32 42 H 6 A 6 6 0 0 1 0 36 V 6 A 6 6 0 0 1 6 0 Z" 
                fill="${color}" stroke="#ffffff" stroke-width="1.8" filter="url(#leaf_sh_${s.id})"/>
          <rect x="4" y="4" width="68" height="17" rx="4" fill="#0b0f19" />
          <text x="38" y="16.5" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="10" font-weight="900" text-anchor="middle" fill="${color}">${pressureText}</text>
          <text x="38" y="34.5" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="8.5" font-weight="800" text-anchor="middle" fill="#ffffff">${queueText}</text>
          ${isBest ? '<circle cx="70" cy="5" r="6.5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.2"/><text x="70" y="8" font-size="8" text-anchor="middle" fill="#000">★</text>' : ''}
        </svg>
      </div>
    `;

    return L.divIcon({
      className: 'custom-cng-station-pin',
      html,
      iconSize: [76, 52],
      iconAnchor: [38, 50],
      popupAnchor: [0, -48],
    });
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-slate-800 bg-[#0c1220]">
      {/* Sleek Dual-Engine Map Switcher on Top-Right */}
      <div className="absolute top-2.5 right-2.5 z-[1000] flex items-center gap-1 bg-[#0f172a]/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-700/80 text-xs">
        <button
          type="button"
          onClick={() => handleEngineChange('google')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
            engine === 'google'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Google Maps JavaScript API (Directions & Traffic)"
        >
          <span>Google Maps</span>
        </button>

        <button
          type="button"
          onClick={() => handleEngineChange('leaflet')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
            engine === 'leaflet'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="OpenStreetMap Dark Engine"
        >
          <span>Dark OSM</span>
        </button>

        <button
          type="button"
          onClick={() => setIsKeyModalOpen(true)}
          title="Google Maps API Key Setup"
          className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition ml-0.5"
        >
          <Key size={14} className={hasApiKey ? 'text-emerald-400' : 'text-amber-400'} />
        </button>
      </div>

      {engine === 'google' ? (
        <GoogleStationMap
          stations={stations}
          routeGeometry={routeGeometry}
          startPoint={startPoint}
          destPoint={destPoint}
          selectedStationId={selectedStationId}
          onStationClick={onStationClick}
          height={height}
          onAuthError={() => handleEngineChange('leaflet')}
          onSwitchToOSM={() => handleEngineChange('leaflet')}
          onEnterKey={() => setIsKeyModalOpen(true)}
        />
      ) : (
        <div style={{ height }} className="w-full relative">
          <MapContainer
            center={startPoint ? [startPoint.lat, startPoint.lng] : [28.6139, 77.209]}
            zoom={10}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
          >
            {/* CartoDB Dark Matter High-Tech Night Tiles */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <LeafletAutoFit stations={stations} startPoint={startPoint} destPoint={destPoint} />

            {routeGeometry && routeGeometry.length > 0 && (
              <Polyline
                positions={routeGeometry}
                pathOptions={{ color: '#10b981', weight: 5, opacity: 0.9 }}
              />
            )}

            {/* Start location marker */}
            {startPoint && (
              <Marker
                position={[startPoint.lat, startPoint.lng]}
                icon={L.divIcon({
                  className: 'start-marker-pin',
                  html: '<div style="background:#10b981; color:#fff; font-weight:bold; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.5); font-size:11px;">S</div>',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
              >
                <Popup>
                  <strong>Start Location</strong>
                </Popup>
              </Marker>
            )}

            {/* Destination marker */}
            {destPoint && (
              <Marker
                position={[destPoint.lat, destPoint.lng]}
                icon={L.divIcon({
                  className: 'dest-marker-pin',
                  html: '<div style="background:#f43f5e; color:#fff; font-weight:bold; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.5); font-size:11px;">D</div>',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
              >
                <Popup>
                  <strong>Destination</strong>
                </Popup>
              </Marker>
            )}

            {/* Station Markers */}
            {stations.map((s) => {
              const isBest = s.recommendationCategory === 'BEST_OVERALL';
              const pressureBar = s.currentPressureBar ? Math.round(s.currentPressureBar) : 200;
              const waitMin = s.estimatedWaitMinutes ?? Math.max(1, Math.round((s.vehiclesWaiting ?? 0) * 2));
              const color = isBest ? '#10b981' : getPressureColor(s.currentPressureBar);

              return (
                <Marker
                  key={s.id}
                  position={[s.latitude, s.longitude]}
                  icon={createStationDivIcon(s)}
                  eventHandlers={{
                    click: () => onStationClick && onStationClick(s),
                  }}
                >
                  <Popup>
                    <div className="p-1 max-w-[260px] text-xs font-sans text-slate-100">
                      {isBest && (
                        <div className="bg-emerald-950 text-emerald-300 text-[10.5px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 border border-emerald-500/40">
                          ⭐ Best Highway Choice
                        </div>
                      )}
                      <h4 className="font-bold text-sm text-white leading-tight mb-0.5">{s.name}</h4>
                      <p className="text-[11px] text-slate-400 mb-2">
                        {s.operator || 'CNG'} • {s.city}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#162032] p-2.5 rounded-xl border border-slate-800 mb-2.5">
                        <div>
                          <div className="text-[9.5px] text-slate-400 font-bold uppercase">Gas Pressure</div>
                          <div className="font-black text-base" style={{ color }}>
                            {pressureBar} Bar
                          </div>
                          <div className="text-[9.5px] text-slate-400">
                            {pressureBar >= 195 ? 'Fast Fill' : 'Moderate'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9.5px] text-slate-400 font-bold uppercase">Vehicles Queue</div>
                          <div className="font-black text-base text-slate-100">
                            {s.vehiclesWaiting ?? 0} Cars
                          </div>
                          <div className="text-[9.5px] text-slate-400">~{waitMin} min wait</div>
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-center bg-emerald-600 text-white text-[11px] py-1.5 px-2 rounded-lg font-bold hover:bg-emerald-500 transition"
                        >
                          Navigate Maps ↗
                        </a>
                        <a
                          href={`/stations/${s.id}`}
                          className="flex-1 text-center bg-slate-800 text-slate-200 border border-slate-700 text-[11px] py-1.5 px-2 rounded-lg font-bold hover:bg-slate-700 transition"
                        >
                          Telemetry
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map Telemetry Legend on Bottom */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto z-[1000] bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 shadow-lg text-[10px] sm:text-[11px] text-slate-300 flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4 flex-wrap">
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> 200+ Bar (High)
            </span>
            <span className="flex items-center gap-1 font-bold text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> 175-195 Bar
            </span>
            <span className="flex items-center gap-1 font-bold text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> &lt;175 Bar
            </span>
            <span className="flex items-center gap-1 font-bold text-white">
              <Star size={12} className="text-amber-400 fill-amber-400" /> Best Choice
            </span>
          </div>
        </div>
      )}

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={handleKeySaved}
      />
    </div>
  );
};

export default StationMap;
