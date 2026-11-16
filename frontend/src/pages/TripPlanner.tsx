import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  ArrowUpDown,
  Search,
  Sparkles,
  Zap,
  Clock,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StationMap } from '../components/map/StationMap';
import { CORRIDORS, DEFAULT_CORRIDOR } from '../data/corridors';
import { nominatimSearch } from '../services/api';
import type { Corridor, RouteSearchRequest } from '../types';

interface LocationState {
  address: string;
  lat: number | null;
  lng: number | null;
}

export default function TripPlanner() {
  const navigate = useNavigate();
  const { planSmartRoute, stations, settings } = useAppContext();

  const [startLoc, setStartLoc] = useState<LocationState>({
    address: DEFAULT_CORRIDOR.startAddress,
    lat: DEFAULT_CORRIDOR.startLat,
    lng: DEFAULT_CORRIDOR.startLng,
  });

  const [destLoc, setDestLoc] = useState<LocationState>({
    address: DEFAULT_CORRIDOR.destAddress,
    lat: DEFAULT_CORRIDOR.destLat,
    lng: DEFAULT_CORRIDOR.destLng,
  });

  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(DEFAULT_CORRIDOR.id);
  const [maxDetour, setMaxDetour] = useState<number>(settings.maxDetourKm || 5);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [showStartDrop, setShowStartDrop] = useState(false);
  const [showDestDrop, setShowDestDrop] = useState(false);

  const startTimer = useRef<any>(null);
  const destTimer = useRef<any>(null);

  const handleCorridorSelect = (corridor: Corridor) => {
    setSelectedCorridorId(corridor.id);
    setStartLoc({
      address: corridor.startAddress,
      lat: corridor.startLat,
      lng: corridor.startLng,
    });
    setDestLoc({
      address: corridor.destAddress,
      lat: corridor.destLat,
      lng: corridor.destLng,
    });
  };

  const handleSwap = () => {
    setStartLoc(destLoc);
    setDestLoc(startLoc);
  };

  const handleStartTyping = (text: string) => {
    setStartLoc({ address: text, lat: null, lng: null });
    setSelectedCorridorId('');
    if (startTimer.current) clearTimeout(startTimer.current);
    if (text.length > 2) {
      startTimer.current = setTimeout(async () => {
        const res = await nominatimSearch(text);
        setStartSuggestions(res.slice(0, 5));
        setShowStartDrop(true);
      }, 300);
    } else {
      setStartSuggestions([]);
      setShowStartDrop(false);
    }
  };

  const handleDestTyping = (text: string) => {
    setDestLoc({ address: text, lat: null, lng: null });
    setSelectedCorridorId('');
    if (destTimer.current) clearTimeout(destTimer.current);
    if (text.length > 2) {
      destTimer.current = setTimeout(async () => {
        const res = await nominatimSearch(text);
        setDestSuggestions(res.slice(0, 5));
        setShowDestDrop(true);
      }, 300);
    } else {
      setDestSuggestions([]);
      setShowDestDrop(false);
    }
  };

  const handleFindBestStation = async () => {
    if (!startLoc.lat || !startLoc.lng || !destLoc.lat || !destLoc.lng) {
      setSearchError('Please select valid start and destination locations.');
      return;
    }

    setSearchError(null);
    setIsSearching(true);

    try {
      const req: RouteSearchRequest = {
        startLat: startLoc.lat,
        startLng: startLoc.lng,
        startAddress: startLoc.address,
        destLat: destLoc.lat,
        destLng: destLoc.lng,
        destAddress: destLoc.address,
        maxDetourKm: maxDetour,
      };

      await planSmartRoute(req);
      navigate('/results');
    } catch (err: any) {
      setSearchError(err?.message || 'Failed to search route. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-16 px-1 sm:px-0 text-slate-100">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0d1627] via-[#091a1d] to-[#0d1627] rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-900/40">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2.5">
            <Sparkles size={13} className="text-amber-400" />
            AI Smart CNG Station Recommender
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight mb-2 text-white">
            Find the Best CNG Station on Your Route
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Plan your highway trip with Google Maps. Identifies the optimal filling station with <strong>shortest queue</strong> and <strong>highest pressure (&gt;200 Bar)</strong> for faster, 100% full-tank fills!
          </p>
        </div>
      </div>

      {/* Main Grid: Inputs + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Form: 5 cols */}
        <div className="lg:col-span-5 bg-[#111827] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border border-slate-800 space-y-5">
          {/* Popular Corridors */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Popular Highway Corridors
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CORRIDORS.map((c) => {
                const isSelected = selectedCorridorId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCorridorSelect(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-[#162032] text-slate-300 border-slate-800 hover:bg-[#1e2a42] hover:text-white'
                    }`}
                  >
                    <span>{c.emoji}</span>
                    <span className="truncate max-w-[160px] sm:max-w-none">{c.label.split('(')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locations Input */}
          <div className="space-y-2.5 relative">
            {/* Start Location */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Origin (Start Location)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-emerald-400">
                  <MapPin size={16} />
                </span>
                <input
                  type="text"
                  value={startLoc.address}
                  onChange={(e) => handleStartTyping(e.target.value)}
                  placeholder="e.g. Connaught Place, New Delhi"
                  className="w-full pl-9 pr-8 py-2.5 sm:py-3 rounded-xl border border-slate-700 bg-[#162032] text-xs sm:text-sm text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                {startLoc.lat && <span className="absolute right-3 text-emerald-400 font-bold text-xs">✓</span>}
              </div>

              {showStartDrop && startSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl max-h-44 overflow-y-auto">
                  {startSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => {
                        setStartLoc({
                          address: s.display_name.split(',').slice(0, 3).join(','),
                          lat: parseFloat(s.lat),
                          lng: parseFloat(s.lon),
                        });
                        setShowStartDrop(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 border-b border-slate-800 last:border-0 transition"
                    >
                      <span className="font-bold text-white">{s.display_name.split(',')[0]}</span>
                      <span className="text-slate-400 ml-1 truncate">
                        {s.display_name.split(',').slice(1, 3).join(',')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap Start & Destination"
                className="p-1.5 rounded-full bg-[#162032] hover:bg-emerald-950 text-slate-400 hover:text-emerald-400 border border-slate-700 shadow-md transition"
              >
                <ArrowUpDown size={14} />
              </button>
            </div>

            {/* Destination Location */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Destination
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-rose-400">
                  <Navigation size={16} />
                </span>
                <input
                  type="text"
                  value={destLoc.address}
                  onChange={(e) => handleDestTyping(e.target.value)}
                  placeholder="e.g. Taj Mahal, Agra"
                  className="w-full pl-9 pr-8 py-2.5 sm:py-3 rounded-xl border border-slate-700 bg-[#162032] text-xs sm:text-sm text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                {destLoc.lat && <span className="absolute right-3 text-emerald-400 font-bold text-xs">✓</span>}
              </div>

              {showDestDrop && destSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl max-h-44 overflow-y-auto">
                  {destSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => {
                        setDestLoc({
                          address: s.display_name.split(',').slice(0, 3).join(','),
                          lat: parseFloat(s.lat),
                          lng: parseFloat(s.lon),
                        });
                        setShowDestDrop(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 border-b border-slate-800 last:border-0 transition"
                    >
                      <span className="font-bold text-white">{s.display_name.split(',')[0]}</span>
                      <span className="text-slate-400 ml-1 truncate">
                        {s.display_name.split(',').slice(1, 3).join(',')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Max Detour Slider */}
          <div className="bg-[#0c1220] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
              <span>Max Highway Detour</span>
              <span className="bg-[#162032] px-2 py-0.5 rounded-md border border-slate-700 text-emerald-400 font-black">
                +{maxDetour} km
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={maxDetour}
              onChange={(e) => setMaxDetour(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 cursor-pointer"
            />
          </div>

          {searchError && (
            <div className="p-3 bg-rose-950/60 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/40">
              {searchError}
            </div>
          )}

          {/* Search Button */}
          <button
            type="button"
            onClick={handleFindBestStation}
            disabled={isSearching}
            className="w-full py-3.5 px-5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Optimizing Route...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>FIND BEST CNG STATION</span>
              </>
            )}
          </button>
        </div>

        {/* Right Map Preview: 7 cols */}
        <div className="lg:col-span-7 bg-[#111827] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white">Map Preview</h3>
              <p className="text-[11px] text-slate-400">Google Maps API with live station telemetry pins</p>
            </div>
          </div>

          <StationMap
            stations={stations}
            startPoint={startLoc.lat && startLoc.lng ? { lat: startLoc.lat, lng: startLoc.lng } : undefined}
            destPoint={destLoc.lat && destLoc.lng ? { lat: destLoc.lat, lng: destLoc.lng } : undefined}
            height="460px"
          />
        </div>
      </div>
    </div>
  );
}
