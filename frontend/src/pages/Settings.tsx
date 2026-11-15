import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RotateCcw, Info, Key, ShieldCheck, CheckCircle2, MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getStoredGoogleApiKey, storeGoogleApiKey, resetGoogleMapsLoader } from '../services/googleMapsLoader';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-3.5">
        <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, clearSelection } = useAppContext();
  const navigate = useNavigate();

  const [apiKey, setApiKey] = useState(getStoredGoogleApiKey());
  const [saved, setSaved] = useState(false);

  const save = (patch: any) => {
    updateSettings(patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveApiKey = () => {
    storeGoogleApiKey(apiKey);
    resetGoogleMapsLoader();
    save({ googleMapsApiKey: apiKey, mapProvider: 'google' });
  };

  const handleClearApiKey = () => {
    setApiKey('');
    storeGoogleApiKey('');
    resetGoogleMapsLoader();
    save({ googleMapsApiKey: '' });
  };

  const resetAll = () => {
    localStorage.clear();
    clearSelection();
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure Google Maps API and telemetry preferences</p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-700 animate-in fade-in">
            <CheckCircle2 size={16} /> Settings saved successfully
          </div>
        )}
      </div>

      {/* Google Maps API Settings */}
      <Section title="Google Maps API Configuration">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Google Maps JavaScript API Key
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. AIzaSyB..."
              className="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleSaveApiKey}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
            >
              Save Key
            </button>
            {apiKey && (
              <button
                type="button"
                onClick={handleClearApiKey}
                className="px-3 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            When provided, the app activates official Google Maps JavaScript API with live traffic and turn-by-turn navigation. Without a key, OpenStreetMap is automatically used with full offline support.
          </p>
        </div>

        <SettingRow
          label="Default Map Engine"
          description="Choose preferred interactive map provider"
        >
          <div className="flex gap-2">
            {[
              { id: 'google', label: '🗺️ Google Maps' },
              { id: 'leaflet', label: '🌐 OpenStreetMap' },
            ].map((eng) => (
              <button
                key={eng.id}
                type="button"
                onClick={() => save({ mapProvider: eng.id })}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                  settings.mapProvider === eng.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {eng.label}
              </button>
            ))}
          </div>
        </SettingRow>
      </Section>

      {/* Live Simulation Settings */}
      <Section title="Live Telemetry Simulation">
        <SettingRow
          label="Enable Live Data Simulation"
          description="Simulate real-time vehicle arrivals and compressor pressure fluctuations every 10 seconds"
        >
          <Toggle
            checked={settings.simulationEnabled}
            onChange={(v) => save({ simulationEnabled: v })}
          />
        </SettingRow>

        <SettingRow
          label={`Max Acceptable Detour: +${settings.maxDetourKm} km`}
          description="Maximum highway detour distance for recommending CNG pumps"
        >
          <input
            type="range"
            min={1}
            max={15}
            value={settings.maxDetourKm}
            onChange={(e) => save({ maxDetourKm: Number(e.target.value) })}
            className="w-36 accent-emerald-600"
          />
        </SettingRow>

        <SettingRow
          label="Default Vehicle Type"
          description="Used to estimate queue wait times and filling duration"
        >
          <div className="flex gap-1.5">
            {['car', 'auto', 'bus', 'truck'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => save({ defaultVehicleType: v })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition border ${
                  settings.defaultVehicleType === v
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </SettingRow>
      </Section>

      {/* Reset */}
      <div className="bg-red-50/60 border border-red-200 rounded-3xl p-5 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-extrabold text-red-900 uppercase tracking-wider">
            Reset Data & Cache
          </h4>
          <p className="text-xs text-red-700 mt-0.5">
            Clear all saved preferences, API keys, custom reports, and station comparisons
          </p>
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
        >
          Reset All
        </button>
      </div>
    </div>
  );
}
