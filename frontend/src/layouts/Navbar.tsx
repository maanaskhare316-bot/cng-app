import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Key, Navigation, Fuel } from 'lucide-react';
import { ApiKeyModal } from '../components/ui/ApiKeyModal';
import { SmartAlertDrawer } from '../components/stations/SmartAlertDrawer';
import { getStoredGoogleApiKey } from '../services/googleMapsLoader';
import { useAppContext } from '../context/AppContext';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/plan': 'Plan Journey',
  '/results': 'Route Results',
  '/stations': 'CNG Stations',
  '/monitoring': 'Live Monitoring',
  '/compare': 'Compare Stations',
  '/settings': 'Settings',
};

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    stations,
    alerts,
    dismissAlert,
    clearAllAlerts,
    settings,
    updateAlertPreferences,
  } = useAppContext();

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const hasGoogleKey = !!getStoredGoogleApiKey();

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  const pageTitle =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith('/stations/') ? 'Station Details' : 'CNG Navigator');

  return (
    <>
      <div className="h-[58px] flex items-center justify-between px-3 sm:px-6 gap-2 sm:gap-3 bg-white border-b border-[#E3EAF0] sticky top-0 z-40 shadow-sm">
        {/* Left: Mobile Menu + Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 rounded-xl text-[#718096] hover:bg-[#F4F7FA] hover:text-[#14283F] transition-colors flex-shrink-0"
          >
            <Menu size={20} />
          </button>

          {/* Brand logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#14283F] flex items-center justify-center flex-shrink-0">
              <Fuel size={14} className="text-[#16B8C9]" />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-extrabold text-[#14283F] tracking-tight">CNG Navigator</span>
            </div>
          </div>

          <div className="hidden md:block w-px h-5 bg-[#E3EAF0]" />
          <span className="hidden md:block text-sm font-medium text-[#718096]">{pageTitle}</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Station count pill */}
          <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-[#14283F] bg-[#F4F7FA] border border-[#E3EAF0] px-3 py-1.5 rounded-xl">
            ⛽ {stations.length} stations
          </span>

          {/* Alert Bell */}
          <button
            type="button"
            onClick={() => setIsAlertDrawerOpen(true)}
            aria-label="Smart Corridor Alerts"
            className="relative p-2 rounded-xl bg-[#F4F7FA] hover:bg-[#E3EAF0] text-[#718096] hover:text-[#14283F] border border-[#E3EAF0] transition"
          >
            <Bell size={16} />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 bg-[#B54747] text-[10px] font-black text-white rounded-full ring-2 ring-white animate-pulse">
                {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Plan Trip CTA */}
          <button
            onClick={() => navigate('/plan')}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold bg-[#14283F] hover:bg-[#1D3854] text-white px-3.5 py-1.5 rounded-xl transition"
          >
            <Navigation size={13} />
            <span>Plan Trip</span>
          </button>

          {/* API Key Button */}
          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border transition ${
              hasGoogleKey
                ? 'bg-[#E3F4EC] text-[#26734D] border-[#26734D]/20 hover:bg-[#D0EDDF]'
                : 'bg-[#FFF2DB] text-[#98651C] border-[#98651C]/20 hover:bg-[#FFE9C0]'
            }`}
          >
            <Key size={13} />
            <span className="hidden sm:inline">{hasGoogleKey ? 'Maps Active' : 'API Key'}</span>
            <span className="sm:hidden">{hasGoogleKey ? '✓' : 'Key'}</span>
          </button>
        </div>
      </div>

      {/* Smart Alerts Drawer */}
      <SmartAlertDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        alerts={alerts}
        onDismissAlert={dismissAlert}
        onClearAll={clearAllAlerts}
        preferences={settings.alertPreferences}
        onUpdatePreferences={updateAlertPreferences}
      />

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={() => {}}
      />
    </>
  );
};

export default Navbar;
