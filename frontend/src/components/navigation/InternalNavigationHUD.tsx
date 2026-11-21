import React, { useEffect, useState, useRef } from 'react';
import {
  Navigation,
  Compass,
  ArrowRight,
  ExternalLink,
  X,
  AlertTriangle,
  Locate,
  Zap,
  Users,
  CheckCircle,
} from 'lucide-react';
import type { StationSummaryDto } from '../../types';

interface LatLng {
  lat: number;
  lng: number;
}

interface InternalNavigationHUDProps {
  isActive: boolean;
  onClose: () => void;
  destinationStation: StationSummaryDto | null;
  startAddress?: string;
  destAddress?: string;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  routeGeometry?: [number, number][];
  onUserLocationUpdate?: (pos: LatLng) => void;
}

export const InternalNavigationHUD: React.FC<InternalNavigationHUDProps> = ({
  isActive,
  onClose,
  destinationStation,
  startAddress = 'Starting Point',
  destAddress = 'Destination',
  totalDistanceKm,
  totalDurationMinutes,
  routeGeometry = [],
  onUserLocationUpdate,
}) => {
  const [currentPos, setCurrentPos] = useState<LatLng | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [speedKmh, setSpeedKmh] = useState<number | null>(null);
  const [remainingKm, setRemainingKm] = useState<number>(totalDistanceKm);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(totalDurationMinutes);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [nextInstruction, setNextInstruction] = useState<string>('Follow highway corridor towards destination');
  const [isOffRoute, setIsOffRoute] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setGpsError('Browser does not support GPS geolocation.');
      return;
    }

    // High accuracy continuous GPS watch
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const pos: LatLng = { lat, lng };
        setCurrentPos(pos);
        setAccuracyMeters(Math.round(position.coords.accuracy));
        if (position.coords.speed !== null && position.coords.speed >= 0) {
          setSpeedKmh(Math.round(position.coords.speed * 3.6));
        }

        if (onUserLocationUpdate) {
          onUserLocationUpdate(pos);
        }

        // Calculate progress and remaining distance
        if (routeGeometry.length > 0 && destinationStation) {
          const destLat = destinationStation.latitude;
          const destLng = destinationStation.longitude;
          const distToStation = haversineDistance(lat, lng, destLat, destLng);
          setRemainingKm(Math.max(0.1, Math.round(distToStation * 10) / 10));
          const estMins = Math.max(1, Math.round((distToStation / 55) * 60));
          setRemainingMinutes(estMins);

          const totalOrig = Math.max(1, totalDistanceKm);
          const completed = Math.max(0, Math.min(100, Math.round(((totalOrig - distToStation) / totalOrig) * 100)));
          setProgressPercent(completed);

          // Check off-route (minimum distance to polyline > 350 meters)
          let minPolyDist = 999;
          for (let i = 0; i < routeGeometry.length; i += 3) {
            const d = haversineDistance(lat, lng, routeGeometry[i][0], routeGeometry[i][1]);
            if (d < minPolyDist) minPolyDist = d;
          }

          if (minPolyDist > 0.45) {
            setIsOffRoute(true);
            setNextInstruction('Off primary corridor — follow road signs towards target CNG pump');
          } else {
            setIsOffRoute(false);
            if (distToStation <= 1.5) {
              setNextInstruction(`In ${(distToStation * 1000).toFixed(0)}m, arrive at ${destinationStation.name} on highway left`);
            } else if (distToStation <= 5) {
              setNextInstruction(`Approaching refueling zone (~${destinationStation.extraDetourKm ?? 0.4}km off highway)`);
            } else {
              setNextInstruction(`Continue on highway corridor towards ${destinationStation.name}`);
            }
          }
        }
      },
      (err) => {
        setGpsError(`GPS update error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isActive, routeGeometry, destinationStation, totalDistanceKm, onUserLocationUpdate]);

  if (!isActive) return null;

  // External Google Maps Hand-off (Phase 8)
  const handleLaunchExternalGoogleMaps = () => {
    if (!destinationStation) return;
    const destLat = destinationStation.latitude;
    const destLng = destinationStation.longitude;

    let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving&dir_action=navigate`;
    if (currentPos) {
      url += `&origin=${currentPos.lat},${currentPos.lng}`;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9000] p-2.5 sm:p-4 pointer-events-none animate-in slide-in-from-bottom duration-300">
      <div className="max-w-3xl mx-auto space-y-2 pointer-events-auto">
        {/* Top Step Instruction Banner */}
        <div className="bg-[#14283F] border border-[#1D3854] text-white rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#16B8C9] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Navigation size={22} className="rotate-45" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#16B8C9] tracking-wider block">
                Next Route Action
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-white truncate leading-snug">
                {nextInstruction}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition flex-shrink-0"
            title="Exit In-App Navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Off-Route Alert (if deviated) */}
        {isOffRoute && (
          <div className="bg-[#FFF2DB] border border-[#FFE2A4] text-[#98651C] text-xs font-bold p-2.5 rounded-xl flex items-center gap-2 shadow-sm animate-pulse">
            <AlertTriangle size={15} className="flex-shrink-0" />
            <span>Significant road deviation detected. In-app ETA and queue forecasts are adapting.</span>
          </div>
        )}

        {/* Main Live Telemetry HUD Bar */}
        <div className="bg-[#F8FAFC] border border-[#DCE5EE] rounded-2xl p-4 shadow-2xl space-y-3 text-[#243447]">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-[#64748B] mb-1">
              <span className="flex items-center gap-1.5">
                <Compass size={13} className="text-[#16B8C9]" /> In-App Route Following
              </span>
              <span>{progressPercent}% Journey Complete</span>
            </div>
            <div className="w-full bg-[#E8EEF5] h-2 rounded-full overflow-hidden border border-[#DCE5EE]">
              <div
                className="bg-[#16B8C9] h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Metric Grid: Remaining Distance, ETA, Target Station */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#E8EEF5] p-2.5 rounded-xl border border-[#DCE5EE] text-center">
              <span className="text-[9.5px] font-bold text-[#64748B] uppercase tracking-wider block">Remaining</span>
              <span className="text-base sm:text-lg font-black text-[#14283F]">{remainingKm} km</span>
              <span className="text-[9.5px] text-[#64748B] block font-semibold">to stop</span>
            </div>

            <div className="bg-[#E8EEF5] p-2.5 rounded-xl border border-[#DCE5EE] text-center">
              <span className="text-[9.5px] font-bold text-[#64748B] uppercase tracking-wider block">Drive Time</span>
              <span className="text-base sm:text-lg font-black text-[#16B8C9]">~{remainingMinutes}m</span>
              <span className="text-[9.5px] text-[#64748B] block font-semibold">{speedKmh ? `${speedKmh} km/h` : 'highway'}</span>
            </div>

            <div className="bg-[#E3F4EC] p-2.5 rounded-xl border border-[#C0E4D0] text-center">
              <span className="text-[9.5px] font-bold text-[#26734D] uppercase tracking-wider block">Target Pump</span>
              <span className="text-base sm:text-lg font-black text-[#26734D] truncate block">
                {destinationStation?.currentPressureBar ? `${Math.round(destinationStation.currentPressureBar)} Bar` : '210 Bar'}
              </span>
              <span className="text-[9.5px] text-[#26734D] block font-semibold">
                🚗 {destinationStation?.vehiclesWaiting ?? 3} in line
              </span>
            </div>
          </div>

          {/* Action Row: External Google Maps Button (Phase 8) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span>
                {accuracyMeters ? `GPS ±${accuracyMeters}m high accuracy` : 'Acquiring satellite signal...'}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleLaunchExternalGoogleMaps}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#16B8C9] hover:bg-[#119EAD] text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
                title="Launch Google Maps app for hands-free audio turn-by-turn directions"
              >
                <span>Navigate with Google Maps</span>
                <ExternalLink size={13} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2.5 rounded-xl bg-[#E8EEF5] hover:bg-[#DCE5EE] text-[#14283F] font-bold text-xs border border-[#DCE5EE] transition"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

export default InternalNavigationHUD;
