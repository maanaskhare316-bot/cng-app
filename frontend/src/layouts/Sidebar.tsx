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
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Plan Trip', icon: Navigation, to: '/plan' },
  { label: 'Route Results', icon: Route, to: '/results' },
  { label: 'CNG Stations', icon: Fuel, to: '/stations' },
  { label: 'Live Monitoring', icon: Activity, to: '/monitoring' },
  { label: 'Compare Stations', icon: BarChart2, to: '/compare' },
  { label: 'Settings', icon: Settings, to: '/settings' },
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
      className="flex flex-col h-full bg-[#F8FAFC] select-none border-r border-[#DCE5EE]"
      style={{ width: 240 }}
    >
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#DCE5EE]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#14283F] flex items-center justify-center flex-shrink-0">
            <Fuel size={18} className="text-[#16B8C9]" />
          </div>
          <div>
            <div className="text-sm font-extrabold leading-tight text-[#14283F]">
              CNG Navigator
            </div>
            <div className="text-[10px] text-[#16B8C9] font-semibold leading-tight">
              Smart Station Finder
            </div>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#14283F] hover:bg-[#E8EEF5] transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => {
          const active = isActive(to);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={isMobile ? onClose : undefined}
              className={[
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold',
                'transition-all duration-150 cursor-pointer',
                active
                  ? 'bg-[#14283F] text-white shadow-xs'
                  : 'text-[#64748B] hover:bg-[#E8EEF5] hover:text-[#243447]',
              ].join(' ')}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2.5 : 2}
                className={active ? 'text-[#16B8C9]' : 'text-[#94A3B8]'}
              />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#DCE5EE]">
        <p className="text-[10px] text-[#94A3B8] font-mono text-center">
          CNG Navigator v2.0
        </p>
      </div>
    </nav>
  );
};

export default Sidebar;
