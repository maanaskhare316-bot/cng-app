import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Key, Navigation, Zap } from 'lucide-react';
import { ApiKeyModal } from '../components/ui/ApiKeyModal';
import { getStoredGoogleApiKey } from '../services/googleMapsLoader';
import { useAppContext } from '../context/AppContext';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/plan': 'Plan Journey',
  '/results': 'Route Recommendations',
  '/stations': 'CNG Stations',
  '/monitoring': 'Live Telemetry',
  '/compare': 'Compare Stations',
  '/settings': 'Settings',
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
    (pathname.startsWith('/stations/') ? 'Station Details' : 'CNG Navigator');

  return (
    <>
      <div className="h-[58px] flex items-center justify-between px-3 sm:px-6 gap-2 sm:gap-3 bg-[#0c1220]/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        {/* Left: Mobile Menu + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors flex-shrink-0"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm sm:text-base font-extrabold text-white tracking-wide truncate">
            {pageTitle}
          </span>
        </div>

        {/* Center: Brand pill (Desktop only) */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-300">
          <Zap size={13} className="text-emerald-400" />
          <span>CNG Navigator • Google Maps Smart Finder</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => navigate('/plan')}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl shadow-md transition"
          >
            <Navigation size={13} />
            <span>Plan Trip</span>
          </button>

          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl border transition ${
              hasGoogleKey
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/40'
            }`}
          >
            <Key size={13} className={hasGoogleKey ? 'text-emerald-400' : 'text-amber-400'} />
            <span className="hidden sm:inline">{hasGoogleKey ? 'Google Maps Active' : 'API Key'}</span>
            <span className="sm:hidden">{hasGoogleKey ? 'Active' : 'Key'}</span>
          </button>

          <span className="hidden lg:inline-flex items-center gap-1 text-xs font-bold text-slate-300 bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
            ⛽ {stations.length} Pumps
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
