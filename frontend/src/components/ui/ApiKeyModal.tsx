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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#F8FAFC] rounded-[14px] shadow-modal border border-[#DCE5EE] max-w-lg w-full overflow-hidden text-[#243447]">
        {/* Header */}
        <div className="bg-[#14283F] px-6 py-4 text-white flex items-center justify-between border-b border-[#1D3854]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Key size={18} className="text-[#16B8C9]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Google Maps API Setup</h3>
              <p className="text-xs text-[#E3EAF0]">Official Google Maps JavaScript Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-[#64748B] leading-relaxed">
            This app natively supports the official Google Maps JavaScript API (Directions & Traffic). Enter your Google Maps API Key below. (Without a key, the app continues working seamlessly in preview mode or on OpenStreetMap!)
          </p>

          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
              Google Maps API Key
            </label>
            <div className="relative">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-[#DCE5EE] bg-[#F8FAFC] text-[#243447] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16B8C9] transition"
              />
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#64748B] hover:text-[#14283F] bg-[#E8EEF5] px-2 py-1 rounded border border-[#DCE5EE]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#E8EEF5] border border-[#DCE5EE] rounded-xl p-3.5 text-xs text-[#243447] space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#14283F]">
              <ShieldCheck size={16} className="text-[#16B8C9]" />
              <span>How to get a Google Maps API Key?</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[#64748B] pl-1 text-[11px] leading-relaxed">
              <li>Open Google Cloud Console and enable <strong>Maps JavaScript API</strong>.</li>
              <li>Also enable <strong>Directions API</strong> and <strong>Places API</strong>.</li>
              <li>Go to Credentials, create an API Key, and paste it here.</li>
            </ol>
            <a
              href="https://console.cloud.google.com/google/maps-apis/overview"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16B8C9] hover:text-[#119EAD] transition"
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
              className="px-4 py-2 rounded-xl border border-[#DCE5EE] text-xs font-bold text-[#64748B] hover:text-[#14283F] hover:bg-[#E8EEF5] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
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
