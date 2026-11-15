import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Navigation,
  Route,
  Fuel,
  Activity,
  BarChart2,
  Settings,
  X,
  Zap,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  label: string;
  hindiLabel: string;
  icon: React.ElementType;
  to: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', hindiLabel: 'डैशबोर्ड', icon: LayoutDashboard, to: '/' },
  { label: 'Plan Journey', hindiLabel: 'यात्रा प्लान करें', icon: Navigation, to: '/plan' },
  { label: 'Route Results', hindiLabel: 'मार्ग परिणाम', icon: Route, to: '/results' },
  { label: 'CNG Stations', hindiLabel: 'पंप सूची', icon: Fuel, to: '/stations' },
  { label: 'Live Telemetry', hindiLabel: 'लाइव मॉनिटरिंग', icon: Activity, to: '/monitoring' },
  { label: 'Compare Stations', hindiLabel: 'स्टेशन तुलना', icon: BarChart2, to: '/compare' },
  { label: 'Settings', hindiLabel: 'सेटिंग्स', icon: Settings, to: '/settings' },
];

interface SidebarProps {
  onClose: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, isMobile = false }) => {
  const location = useLocation();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <nav
      className="flex flex-col h-full bg-[#0a0f1d] text-white select-none border-r border-slate-800"
      style={{ width: 250 }}
    >
      {/* ── Logo / Brand ─────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
            <Zap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-black leading-tight tracking-wide text-white">
              CNG Navigator
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold leading-tight">
              Google Maps Smart Finder
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Feature Highlights Pill ──────────────────── */}
      <div className="px-4 py-3">
        <div className="bg-emerald-950/60 border border-emerald-500/20 rounded-2xl p-2.5 text-[11px] text-emerald-300 flex items-center gap-2">
          <Sparkles size={14} className="text-amber-400 flex-shrink-0" />
          <span>कम गाड़ी &amp; ज्यादा प्रेशर वाला स्टेशन सुझाव</span>
        </div>
      </div>

      {/* ── Navigation Items ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {navItems.map(({ label, hindiLabel, icon: Icon, to }) => {
          const active = isActive(to);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={isMobile ? onClose : undefined}
              className={[
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold',
                'transition-all duration-150 cursor-pointer',
                active
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={17}
                  strokeWidth={active ? 2.5 : 2}
                  className={active ? 'text-white' : 'text-slate-400'}
                />
                <span>{label}</span>
              </div>
              <span
                className={`text-[10px] font-normal ${
                  active ? 'text-emerald-100 font-semibold' : 'text-slate-500'
                }`}
              >
                {hindiLabel}
              </span>
            </NavLink>
          );
        })}
      </div>

      {/* ── Bottom Footer ────────────────────────────── */}
      <div className="p-4 border-t border-white/10 text-center">
        <p className="text-[10px] text-slate-500">
          CNG Navigator v1.0 • Google Maps JS API
        </p>
      </div>
    </nav>
  );
};

export default Sidebar;
