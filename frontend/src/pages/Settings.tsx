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
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-700'}`}
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
    <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-lg overflow-hidden text-slate-100">
      <div className="bg-[#0c1220] border-b border-slate-800 px-6 py-3.5">
        <h2 className="font-extrabold text-white text-xs uppercase tracking-wider">{title}</h2>
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
        <p className="text-sm font-bold text-white">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
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
    <div className="max-w-3xl mx-auto space-y-6 pb-16 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">Configure Google Maps API and telemetry preferences</p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-300 animate-in fade-in">
            <CheckCircle2 size={16} /> Settings saved successfully
          </div>
        )}
      </div>

      {/* Google Maps Configuration */}
      <Section title="🗺️ Google Maps JavaScript API">
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Enter your Google Cloud Maps API key to activate full Google Vector Maps, Live Road Traffic Layer, and Directions Services.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              API Key (Places &amp; Directions Enabled)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-slate-700 bg-[#162032] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md"
              >
                Save Key
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  className="px-3 py-2.5 rounded-xl border border-slate-700 bg-[#162032] text-slate-300 hover:text-white font-bold text-xs transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#131d2e] border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <ShieldCheck size={16} />
              <span>Need a Google Maps Key?</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enable <strong>Maps JavaScript API</strong>, <strong>Directions API</strong>, and <strong>Places API</strong> on Google Cloud Console and paste the generated key above. Without a key, the app continues working on the high-tech Dark OpenStreetMap engine.
            </p>
          </div>
        </div>
      </Section>

      {/* Telemetry Preferences */}
      <Section title="⚡ Telemetry & Simulation Preferences">
        <SettingRow
          label="Live SCADA Telemetry Simulator"
          description="Simulates periodic vehicle queue fluctuations and compressor pressure cycles"
        >
          <Toggle
            checked={settings.simulationEnabled ?? true}
            onChange={(v) => save({ simulationEnabled: v })}
          />
        </SettingRow>

        <SettingRow
          label="Max Highway Detour Limit"
          description="Default maximum kilometer detour when filtering highway stations"
        >
          <span className="font-extrabold text-emerald-400 bg-[#162032] px-3 py-1 rounded-xl border border-slate-800 text-xs">
            {settings.maxDetourKm ?? 5} km
          </span>
        </SettingRow>
      </Section>

      {/* Danger Zone */}
      <Section title="⚠️ App Reset">
        <SettingRow
          label="Reset Local Application Cache"
          description="Clears all stored preferences, saved route history, and station selections"
        >
          <button
            type="button"
            onClick={resetAll}
            className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw size={13} />
            <span>Reset All Data</span>
          </button>
        </SettingRow>
      </Section>
    </div>
  );
}
