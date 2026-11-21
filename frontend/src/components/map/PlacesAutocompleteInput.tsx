import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Crosshair,
  X,
  Loader2,
  Fuel,
  Navigation,
  AlertCircle,
} from 'lucide-react';
import {
  searchPlacesAutocomplete,
  resolvePlaceCoordinates,
  reverseGeocodeLatLng,
  type PlacePrediction,
  type ResolvedPlace,
} from '../../services/googlePlacesService';
import { isGoogleMapsLoaded } from '../../services/googleMapsLoader';

interface PlacesAutocompleteInputProps {
  id?: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: ResolvedPlace) => void;
  icon?: 'start' | 'dest' | 'station' | 'search';
  showCurrentLocationButton?: boolean;
  className?: string;
}

export const PlacesAutocompleteInput: React.FC<PlacesAutocompleteInputProps> = ({
  id,
  label,
  value,
  placeholder = 'Search address, landmark or highway...',
  onChange,
  onPlaceSelected,
  icon = 'search',
  showCurrentLocationButton = false,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Synchronize internal state with external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle outside click to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    onChange(text);
    setLocationError(null);
    setSelectedIndex(-1);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (text.trim().length >= 2) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const results = await searchPlacesAutocomplete(text, {
            country: 'in',
          });
          setPredictions(results);
          setIsOpen(results.length > 0);
        } catch {
          setPredictions([]);
          setIsOpen(false);
        } finally {
          setIsLoading(false);
        }
      }, 250);
    } else {
      setPredictions([]);
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    setInputValue(prediction.description);
    setIsOpen(false);
    setIsLoading(true);

    try {
      const resolved = await resolvePlaceCoordinates(prediction);
      if (resolved) {
        setInputValue(resolved.address);
        onChange(resolved.address);
        onPlaceSelected(resolved);
      } else {
        onChange(prediction.description);
      }
    } catch {
      onChange(prediction.description);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setPredictions([]);
    setIsOpen(false);
    setLocationError(null);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const address = await reverseGeocodeLatLng(lat, lng);
          const resolved: ResolvedPlace = {
            address,
            name: 'Current Location',
            lat,
            lng,
          };
          setInputValue(address);
          onChange(address);
          onPlaceSelected(resolved);
        } catch {
          const fallback = `Current Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
          setInputValue(fallback);
          onChange(fallback);
          onPlaceSelected({
            address: fallback,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location access was denied. Please allow location in your browser settings.');
        } else if (err.code === err.TIMEOUT) {
          setLocationError('Location request timed out. Please try again.');
        } else {
          setLocationError('Unable to retrieve your current GPS position.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : predictions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < predictions.length) {
        handleSelectPrediction(predictions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const iconElement =
    icon === 'start' ? (
      <div className="w-2.5 h-2.5 rounded-full bg-[#16B8C9] ring-4 ring-[#16B8C9]/20 flex-shrink-0" />
    ) : icon === 'dest' ? (
      <MapPin size={16} className="text-[#B54747] flex-shrink-0" />
    ) : icon === 'station' ? (
      <Fuel size={16} className="text-[#16B8C9] flex-shrink-0" />
    ) : (
      <Navigation size={15} className="text-[#14283F] flex-shrink-0" />
    );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
          {label}
        </label>
        {isGoogleMapsLoaded() && (
          <span className="text-[10px] text-[#16B8C9] font-bold flex items-center gap-1">
            <span>●</span> Places API
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        <div className="absolute left-3.5 flex items-center pointer-events-none">
          {iconElement}
        </div>

        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-9 pr-20 py-2.5 bg-[#F8FAFC] border border-[#DCE5EE] text-xs sm:text-sm text-[#14283F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16B8C9] focus:border-[#16B8C9] transition placeholder-[#94A3B8] font-medium"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {isLoading && <Loader2 size={15} className="text-[#16B8C9] animate-spin" />}

          {inputValue && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-[#64748B] hover:text-[#14283F] hover:bg-[#E8EEF5] transition"
              title="Clear input"
            >
              <X size={14} />
            </button>
          )}

          {showCurrentLocationButton && (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                isLocating
                  ? 'bg-[#E8EEF5] text-[#16B8C9] border-[#DCE5EE]'
                  : 'bg-[#E8EEF5] hover:bg-[#DCE5EE] text-[#14283F] border-[#DCE5EE]'
              }`}
              title="Use current GPS location"
            >
              {isLocating ? (
                <Loader2 size={14} className="animate-spin text-[#16B8C9]" />
              ) : (
                <Crosshair size={14} className="text-[#16B8C9]" />
              )}
            </button>
          )}
        </div>
      </div>

      {locationError && (
        <div className="flex items-center gap-1.5 text-[11px] text-[#B54747] font-semibold mt-1">
          <AlertCircle size={12} className="flex-shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Autocomplete Predictions Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#F8FAFC] border border-[#DCE5EE] rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in duration-150">
          <div className="p-1.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#DCE5EE] bg-[#E8EEF5] flex items-center justify-between">
            <span>Suggestions from Google Places</span>
            <span className="text-[9px] text-[#16B8C9]">Select or press Enter</span>
          </div>

          <div className="py-1">
            {predictions.map((p, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={p.placeId || idx}
                  type="button"
                  onClick={() => handleSelectPrediction(p)}
                  className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition text-xs ${
                    isSelected
                      ? 'bg-[#14283F] text-white'
                      : 'hover:bg-[#E8EEF5] text-[#243447]'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {p.isCngRelated ? (
                      <Fuel size={14} className={isSelected ? 'text-[#16B8C9]' : 'text-[#16B8C9]'} />
                    ) : (
                      <MapPin size={14} className={isSelected ? 'text-slate-300' : 'text-[#64748B]'} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold truncate text-xs ${isSelected ? 'text-white' : 'text-[#14283F]'}`}>
                      {p.mainText}
                    </div>
                    {p.secondaryText && (
                      <div className={`text-[11px] truncate ${isSelected ? 'text-slate-300' : 'text-[#64748B]'}`}>
                        {p.secondaryText}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacesAutocompleteInput;
