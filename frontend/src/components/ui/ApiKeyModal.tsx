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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 max-w-lg w-full overflow-hidden text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between border-b border-emerald-600/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Key size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Google Maps API Setup</h3>
              <p className="text-xs text-emerald-200">Official Google Maps JavaScript Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            This app natively supports the official Google Maps JavaScript API (Directions & Traffic). Enter your Google Maps API Key below. (Without a key, the app continues working seamlessly in preview mode or on OpenStreetMap!)
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Google Maps API Key
            </label>
            <div className="relative">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-slate-700 bg-[#162032] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded border border-slate-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#131d2e] border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <ShieldCheck size={16} />
              <span>How to get a Google Maps API Key?</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 text-[11px] leading-relaxed">
              <li>Open Google Cloud Console and enable <strong>Maps JavaScript API</strong>.</li>
              <li>Also enable <strong>Directions API</strong> and <strong>Places API</strong>.</li>
              <li>Go to Credentials, create an API Key, and paste it here.</li>
            </ol>
            <a
              href="https://console.cloud.google.com/google/maps-apis/overview"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition"
            >
              <span>Google Cloud Console</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              {saved ? (
                <>
                  <CheckCircle size={14} /> Saved & Applied!
                </>
              ) : (
                'Save & Apply Key'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
