import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StationMap } from '../components/map/StationMap';
import { PlacesAutocompleteInput } from '../components/map/PlacesAutocompleteInput';
import { CORRIDORS, DEFAULT_CORRIDOR } from '../data/corridors';
import type { Corridor, RouteSearchRequest } from '../types';
import type { ResolvedPlace } from '../services/googlePlacesService';

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
    const temp = { ...startLoc };
    setStartLoc(destLoc);
    setDestLoc(temp);
  };

  const handleStartSelected = (place: ResolvedPlace) => {
    setSelectedCorridorId('');
    setStartLoc({
      address: place.address,
      lat: place.lat,
      lng: place.lng,
    });
  };

  const handleDestSelected = (place: ResolvedPlace) => {
    setSelectedCorridorId('');
    setDestLoc({
      address: place.address,
      lat: place.lat,
      lng: place.lng,
    });
  };

  const handleFindBestStation = async () => {
    if (!startLoc.lat || !startLoc.lng || !destLoc.lat || !destLoc.lng) {
      setSearchError('Please select valid start and destination locations using the autocomplete suggestions.');
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

          {/* Locations Input with Google Places Autocomplete */}
          <div className="space-y-3 relative">
            {/* Start Location */}
            <PlacesAutocompleteInput
              id="start-location-input"
              label="Origin (Start Location)"
              value={startLoc.address}
              onChange={(val) => setStartLoc((prev) => ({ ...prev, address: val }))}
              onPlaceSelected={handleStartSelected}
              icon="start"
              showCurrentLocationButton={true}
              placeholder="e.g. Connaught Place, New Delhi"
            />

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
            <PlacesAutocompleteInput
              id="dest-location-input"
              label="Destination"
              value={destLoc.address}
              onChange={(val) => setDestLoc((prev) => ({ ...prev, address: val }))}
              onPlaceSelected={handleDestSelected}
              icon="dest"
              placeholder="e.g. Taj Mahal, Agra"
            />
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
