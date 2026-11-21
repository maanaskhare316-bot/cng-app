import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  ArrowUpDown,
  Search,
  Sparkles,
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
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-16 px-1 sm:px-0 text-[#243447]">
      {/* Hero Header */}
      <div className="bg-[#F8FAFC] rounded-[14px] p-5 sm:p-8 border border-[#DCE5EE] shadow-card relative overflow-hidden border-l-4 border-l-[#16B8C9]">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 bg-[#E8EEF5] text-[#14283F] border border-[#DCE5EE] px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2.5">
            <Sparkles size={13} className="text-[#16B8C9]" />
            AI Smart CNG Station Recommender
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight mb-2 text-[#14283F]">
            Find the Best CNG Station on Your Route
          </h1>
          <p className="text-[#64748B] text-xs sm:text-sm leading-relaxed">
            Plan your highway trip with Google Maps. Identifies the optimal filling station with <strong>shortest queue</strong> and <strong>highest pressure (&gt;200 Bar)</strong> for faster, 100% full-tank fills!
          </p>
        </div>
      </div>

      {/* Main Grid: Inputs + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Form: 5 cols */}
        <div className="lg:col-span-5 bg-[#F8FAFC] rounded-[14px] p-4 sm:p-6 shadow-card border border-[#DCE5EE] space-y-5">
          {/* Popular Corridors */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-2">
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
                        ? 'bg-[#14283F] text-white border-[#14283F] shadow-xs'
                        : 'bg-[#E8EEF5] text-[#64748B] border-[#DCE5EE] hover:bg-[#DCE5EE] hover:text-[#14283F]'
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
              <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Origin (Start Location)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#16B8C9]">
                  <MapPin size={16} />
                </span>
                <input
                  type="text"
                  value={startLoc.address}
                  onChange={(e) => handleStartTyping(e.target.value)}
                  placeholder="e.g. Connaught Place, New Delhi"
                  className="w-full pl-9 pr-8 py-2.5 sm:py-3 rounded-xl border border-[#DCE5EE] bg-[#F8FAFC] text-xs sm:text-sm text-[#243447] placeholder-[#94A3B8] font-medium focus:outline-none focus:ring-2 focus:ring-[#16B8C9] transition"
                />
                {startLoc.lat && <span className="absolute right-3 text-[#26734D] font-bold text-xs">✓</span>}
              </div>

              {showStartDrop && startSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-[#F8FAFC] border border-[#DCE5EE] rounded-xl shadow-modal max-h-44 overflow-y-auto">
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
                      className="w-full text-left px-3 py-2 text-xs text-[#243447] hover:bg-[#E8EEF5] border-b border-[#DCE5EE] last:border-0 transition"
                    >
                      <span className="font-bold text-[#14283F]">{s.display_name.split(',')[0]}</span>
                      <span className="text-[#64748B] ml-1 truncate">
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
                className="p-1.5 rounded-full bg-[#E8EEF5] hover:bg-[#DCE5EE] text-[#64748B] hover:text-[#16B8C9] border border-[#DCE5EE] shadow-xs transition"
              >
                <ArrowUpDown size={14} />
              </button>
            </div>

            {/* Destination Location */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Destination
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#B54747]">
                  <Navigation size={16} />
                </span>
                <input
                  type="text"
                  value={destLoc.address}
                  onChange={(e) => handleDestTyping(e.target.value)}
                  placeholder="e.g. Taj Mahal, Agra"
                  className="w-full pl-9 pr-8 py-2.5 sm:py-3 rounded-xl border border-[#DCE5EE] bg-[#F8FAFC] text-xs sm:text-sm text-[#243447] placeholder-[#94A3B8] font-medium focus:outline-none focus:ring-2 focus:ring-[#16B8C9] transition"
                />
                {destLoc.lat && <span className="absolute right-3 text-[#26734D] font-bold text-xs">✓</span>}
              </div>

              {showDestDrop && destSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-[#F8FAFC] border border-[#DCE5EE] rounded-xl shadow-modal max-h-44 overflow-y-auto">
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
                      className="w-full text-left px-3 py-2 text-xs text-[#243447] hover:bg-[#E8EEF5] border-b border-[#DCE5EE] last:border-0 transition"
                    >
                      <span className="font-bold text-[#14283F]">{s.display_name.split(',')[0]}</span>
                      <span className="text-[#64748B] ml-1 truncate">
                        {s.display_name.split(',').slice(1, 3).join(',')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Max Detour Slider */}
          <div className="bg-[#E8EEF5] p-3.5 rounded-xl border border-[#DCE5EE]">
            <div className="flex items-center justify-between text-xs font-bold text-[#14283F] mb-1">
              <span>Max Highway Detour</span>
              <span className="bg-[#F8FAFC] px-2 py-0.5 rounded-md border border-[#DCE5EE] text-[#14283F] font-black">
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
              className="w-full accent-[#16B8C9] bg-[#CBD5E1] cursor-pointer"
            />
          </div>

          {searchError && (
            <div className="p-3 bg-[#FCEAEA] text-[#B54747] text-xs font-semibold rounded-xl border border-[#F4BBBB]">
              {searchError}
            </div>
          )}

          {/* Search Button */}
          <button
            type="button"
            onClick={handleFindBestStation}
            disabled={isSearching}
            className="w-full py-3.5 px-5 rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
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
        <div className="lg:col-span-7 bg-[#F8FAFC] rounded-[14px] p-3 sm:p-4 shadow-card border border-[#DCE5EE]">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-[#14283F]">Map Preview</h3>
              <p className="text-[11px] text-[#64748B]">Google Maps API with live station telemetry pins</p>
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
