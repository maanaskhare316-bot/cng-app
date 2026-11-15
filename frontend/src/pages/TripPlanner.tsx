import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  ArrowUpDown,
  Search,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  TrendingUp,
  Car,
  Fuel,
  Info,
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

  // Suggestions state for manual typing
  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [showStartDrop, setShowStartDrop] = useState(false);
  const [showDestDrop, setShowDestDrop] = useState(false);

  const startTimer = useRef<any>(null);
  const destTimer = useRef<any>(null);

  // Select a preset corridor
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

  // Swap Start & Destination
  const handleSwap = () => {
    setStartLoc(destLoc);
    setDestLoc(startLoc);
  };

  // Autocomplete typing handlers
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
      setSearchError('कृपया मान्य शुरुआत और गंतव्य (Origin & Destination) चुनें!');
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
      setSearchError(err?.message || 'रूट खोजने में विफल रहा। पुनः प्रयास करें।');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-900/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} className="text-amber-400" />
            AI Smart CNG Station Recommender
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-2">
            कम गाड़ी और ज्यादा प्रेशर वाला बेस्ट CNG पंप खोजें
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Google Maps API इंटीग्रेशन के साथ अपनी यात्रा की योजना बनाएं। हमारा स्मार्ट एल्गोरिदम आपको रास्ते का वह CNG स्टेशन सुझाएगा जहाँ न्यूनतम भीड़ (कम कतार) और अधिकतम 200+ Bar प्रेशर मिले!
          </p>
        </div>
      </div>

      {/* Main Grid: Inputs + Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 5 cols */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
          {/* Popular Corridors Quick Pick */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
              लोकप्रिय राजमार्ग (Quick Corridors)
            </label>
            <div className="flex flex-wrap gap-2">
              {CORRIDORS.map((c) => {
                const isSelected = selectedCorridorId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCorridorSelect(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{c.emoji}</span>
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locations Input */}
          <div className="space-y-3 relative">
            {/* Start Location */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                शुरुआत (Start Location)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-emerald-600">
                  <MapPin size={18} />
                </span>
                <input
                  type="text"
                  value={startLoc.address}
                  onChange={(e) => handleStartTyping(e.target.value)}
                  placeholder="उदा. Connaught Place, New Delhi"
                  className="w-full pl-11 pr-9 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                {startLoc.lat && <span className="absolute right-3 text-emerald-500 font-bold text-xs">✓</span>}
              </div>

              {/* Suggestions dropdown */}
              {showStartDrop && startSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
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
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border-b border-slate-100 last:border-0 transition"
                    >
                      <span className="font-bold">{s.display_name.split(',')[0]}</span>
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
                className="p-2 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 border border-slate-200 shadow-sm transition"
              >
                <ArrowUpDown size={16} />
              </button>
            </div>

            {/* Destination Location */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                गंतव्य (Destination)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-red-500">
                  <Navigation size={18} />
                </span>
                <input
                  type="text"
                  value={destLoc.address}
                  onChange={(e) => handleDestTyping(e.target.value)}
                  placeholder="उदा. Taj Mahal, Agra"
                  className="w-full pl-11 pr-9 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                {destLoc.lat && <span className="absolute right-3 text-emerald-500 font-bold text-xs">✓</span>}
              </div>

              {/* Suggestions dropdown */}
              {showDestDrop && destSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
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
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border-b border-slate-100 last:border-0 transition"
                    >
                      <span className="font-bold">{s.display_name.split(',')[0]}</span>
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
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>अधिकतम डिटूर (Max Extra Detour)</span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-emerald-700 font-black">
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
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              हाइवे से अधिकतम कितनी दूरी पर CNG पंप ढूंढना है।
            </p>
          </div>

          {/* Error Notice */}
          {searchError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-200">
              {searchError}
            </div>
          )}

          {/* Search Button */}
          <button
            type="button"
            onClick={handleFindBestStation}
            disabled={isSearching}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>रास्ते का विश्लेषण हो रहा है...</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>बेस्ट CNG पंप खोजें (FIND BEST CNG STATION)</span>
              </>
            )}
          </button>

          {/* Algorithm Promise Badges */}
          <div className="grid grid-cols-2 gap-2 text-center text-slate-600 text-xs">
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
              <Zap size={16} className="text-emerald-600" />
              <div className="text-left">
                <p className="font-bold text-emerald-950">200+ Bar प्रेशर</p>
                <p className="text-[10px] text-emerald-700">तेज़ गैस व फुल टैंक</p>
              </div>
            </div>
            <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              <div className="text-left">
                <p className="font-bold text-blue-950">कम गाड़ी</p>
                <p className="text-[10px] text-blue-700">जीरो वेटिंग टाइम</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Map View: 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3 px-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800">लाइव मैप दृश्य (Live Route & Stations Map)</h3>
              <p className="text-xs text-slate-400">Google Maps API से पावर्ड - स्टेशनों के मार्कर पर क्लिक करके लाइव प्रेशर व कतार देखें</p>
            </div>
          </div>

          <StationMap
            stations={stations}
            startPoint={startLoc.lat && startLoc.lng ? { lat: startLoc.lat, lng: startLoc.lng } : undefined}
            destPoint={destLoc.lat && destLoc.lng ? { lat: destLoc.lat, lng: destLoc.lng } : undefined}
            height="520px"
          />
        </div>
      </div>
    </div>
  );
}
