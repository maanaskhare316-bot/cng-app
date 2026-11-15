import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Key, Sparkles, Navigation } from 'lucide-react';
import { ApiKeyModal } from '../components/ui/ApiKeyModal';
import { getStoredGoogleApiKey } from '../services/googleMapsLoader';
import { useAppContext } from '../context/AppContext';

const PAGE_TITLES: Record<string, string> = {
  '/':           'डैशबोर्ड (Dashboard)',
  '/plan':       'यात्रा योजना (Plan Trip)',
  '/results':    'यात्रा परिणाम (Route Results)',
  '/stations':   'CNG स्टेशन (Stations)',
  '/monitoring': 'लाइव मॉनिटरिंग (Live Telemetry)',
  '/compare':    'तुलना (Compare)',
  '/settings':   'सेटिंग्स (Settings)',
};

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { stations } = useAppContext();

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const hasGoogleKey = !!getStoredGoogleApiKey();

  const pageTitle =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith('/stations/') ? 'स्टेशन विवरण (Station Details)' : 'CNG Navigator');

  return (
    <>
      <div className="h-[60px] flex items-center justify-between px-4 sm:px-6 gap-3 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        {/* Left: Hamburger + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-extrabold text-slate-800 truncate">
            {pageTitle}
          </span>
        </div>

        {/* Center: Brand pill (Mobile / Desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold text-emerald-800">
          <span>⛽</span>
          <span>CNG Navigator • Google Maps Powered</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Plan Trip CTA */}
          <button
            onClick={() => navigate('/plan')}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl shadow-sm transition"
          >
            <Navigation size={13} />
            <span>बेस्ट पंप खोजें</span>
          </button>

          {/* Google Maps API Key quick pill */}
          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
              hasGoogleKey
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
          >
            <Key size={13} className={hasGoogleKey ? 'text-emerald-600' : 'text-amber-600'} />
            <span className="hidden sm:inline">{hasGoogleKey ? 'Google Maps Active' : 'Google API Key'}</span>
          </button>

          {/* Active stations count */}
          <span className="hidden lg:inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
            🏭 {stations.length} पंप
          </span>
        </div>
      </div>

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={() => {}}
      />
    </>
  );
};

export default Navbar;
