import React, { useState } from 'react';
import { Key, CheckCircle, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { getStoredGoogleApiKey, storeGoogleApiKey, resetGoogleMapsLoader } from '../../services/googleMapsLoader';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [apiKey, setApiKey] = useState(getStoredGoogleApiKey());
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    storeGoogleApiKey(apiKey);
    resetGoogleMapsLoader();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onKeySaved(apiKey);
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setApiKey('');
    storeGoogleApiKey('');
    resetGoogleMapsLoader();
    onKeySaved('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Key size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Google Maps API Setup</h3>
              <p className="text-xs text-emerald-100">Official Google Maps JavaScript Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            This app natively supports the official Google Maps JavaScript API (Directions & Traffic). Enter your Google Maps API Key below. (Without a key, the app continues working seamlessly in preview mode or on OpenStreetMap!)
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Google Maps API Key
            </label>
            <div className="relative">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 text-xs text-emerald-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <ShieldCheck size={16} />
              <span>How to get a Google Maps API Key?</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px] leading-relaxed">
              <li>Open Google Cloud Console and enable <strong>Maps JavaScript API</strong>.</li>
              <li>Also enable <strong>Directions API</strong> and <strong>Places API</strong>.</li>
              <li>Go to Credentials, create an API Key, and paste it here.</li>
            </ol>
            <a
              href="https://console.cloud.google.com/google/maps-apis/overview"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline mt-1"
            >
              Open Google Cloud Console <ExternalLink size={12} />
            </a>
          </div>

          {saved && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <CheckCircle size={16} /> Key saved successfully! Reloading map...
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <CheckCircle size={14} /> Save & Apply Key
          </button>
        </div>
      </div>
    </div>
  );
};
