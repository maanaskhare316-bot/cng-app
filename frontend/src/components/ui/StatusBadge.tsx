import React from 'react';

export type StationStatus = 'available' | 'busy' | 'offline' | 'low-pressure';

interface StatusBadgeProps {
  status: StationStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  StationStatus,
  { label: string; dot: string; badge: string }
> = {
  available: {
    label: 'Available',
    dot:   'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  },
  busy: {
    label: 'Busy',
    dot:   'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  offline: {
    label: 'Offline',
    dot:   'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 border-slate-300',
  },
  'low-pressure': {
    label: 'Low Pressure',
    dot:   'bg-red-500',
    badge: 'bg-red-100 text-red-700 border-red-300',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.offline;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 text-[11px] font-semibold',
        'border px-2 py-0.5 rounded-full whitespace-nowrap',
        cfg.badge,
        className,
      ].join(' ')}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} aria-hidden="true" />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
