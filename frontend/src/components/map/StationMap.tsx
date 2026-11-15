import React, { useState, useEffect } from 'react';
import type { StationSummaryDto } from '../../types';
import GoogleStationMap from './GoogleStationMap';
import { ApiKeyModal } from '../ui/ApiKeyModal';
import { getStoredGoogleApiKey } from '../../services/googleMapsLoader';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Key } from 'lucide-react';

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

function pressureColor(bar: number | null): string {
  if (bar === null) return '#94a3b8';
  if (bar >= 195) return '#059669';
  if (bar >= 175) return '#d97706';
  return '#dc2626';
}

function LeafletAutoFit({ stations, startPoint, destPoint }: { stations: StationSummaryDto[]; startPoint?: LatLng; destPoint?: LatLng }) {
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
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
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
    return defaultEngine;
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
    setEngine('google');
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-sm">
      {/* Sleek Map Switcher on Top-Right */}
      <div className="absolute top-2 right-2 z-[1000] flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200 text-xs">
        <button
          type="button"
          onClick={() => handleEngineChange('google')}
          className={`px-2 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
            engine === 'google'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Google</span>
        </button>
        <button
          type="button"
          onClick={() => handleEngineChange('leaflet')}
          className={`px-2 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
            engine === 'leaflet'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>OSM</span>
        </button>

        <button
          type="button"
          onClick={() => setIsKeyModalOpen(true)}
          title="Google Maps API Key Setup"
          className="p-1 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
        >
          <Key size={13} className={hasApiKey ? 'text-emerald-600' : 'text-amber-500'} />
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
        />
      ) : (
        <div style={{ height }} className="w-full relative">
          <MapContainer
            center={startPoint ? [startPoint.lat, startPoint.lng] : [28.6139, 77.209]}
            zoom={10}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LeafletAutoFit stations={stations} startPoint={startPoint} destPoint={destPoint} />

            {routeGeometry && routeGeometry.length > 0 && (
              <Polyline
                positions={routeGeometry}
                pathOptions={{ color: '#059669', weight: 5, opacity: 0.85 }}
              />
            )}

            {startPoint && (
              <CircleMarker
                center={[startPoint.lat, startPoint.lng]}
                radius={7}
                pathOptions={{ color: '#ffffff', fillColor: '#10b981', fillOpacity: 1, weight: 2 }}
              >
                <Popup><strong>Start Location</strong></Popup>
              </CircleMarker>
            )}

            {destPoint && (
              <CircleMarker
                center={[destPoint.lat, destPoint.lng]}
                radius={7}
                pathOptions={{ color: '#ffffff', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }}
              >
                <Popup><strong>Destination</strong></Popup>
              </CircleMarker>
            )}

            {stations.map((s) => {
              const isBest = s.recommendationCategory === 'BEST_OVERALL';
              const isSelected = selectedStationId === s.id;
              const color = isBest ? '#059669' : pressureColor(s.currentPressureBar);

              return (
                <CircleMarker
                  key={s.id}
                  center={[s.latitude, s.longitude]}
                  radius={isBest ? 13 : isSelected ? 11 : 9}
                  pathOptions={{
                    color: isBest ? '#f59e0b' : '#ffffff',
                    weight: isBest ? 3 : 2,
                    fillColor: color,
                    fillOpacity: 1,
                  }}
                  eventHandlers={{
                    click: () => onStationClick && onStationClick(s),
                  }}
                >
                  <Popup>
                    <div className="p-1 max-w-[210px] text-xs font-sans">
                      {isBest && (
                        <div className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1">
                          ⭐ Best Recommendation
                        </div>
                      )}
                      <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                      <p className="text-xs text-slate-500 mb-2">{s.address}, {s.city}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Pressure</div>
                          <div className="font-extrabold text-sm" style={{ color }}>{s.currentPressureBar ? `${Math.round(s.currentPressureBar)} Bar` : 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Queue</div>
                          <div className="font-extrabold text-sm text-slate-800">{s.vehiclesWaiting ?? 0} Cars</div>
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-center bg-emerald-600 text-white text-xs py-1.5 rounded-lg font-semibold hover:bg-emerald-700 transition"
                      >
                        Navigate with Google Maps ↗
                      </a>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
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
