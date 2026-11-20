import React from 'react';
import {
  CheckCircle2,
  Clock,
  Users,
  AlertTriangle,
  XCircle,
  Radio,
  ShieldCheck,
  Info,
} from 'lucide-react';
import type { DataVerificationStatus, PredictionConfidence } from '../../types';

interface DataStatusBadgeProps {
  status: DataVerificationStatus;
  dataSourceLabel?: string;
  lastUpdatedTimestamp?: string;
  confidenceScore?: number;
  showSource?: boolean;
  showTimeAgo?: boolean;
  isDemoData?: boolean;
  size?: 'sm' | 'md';
}

function getTimeAgo(timestamp?: string): string {
  if (!timestamp) return 'Time unknown';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMins = Math.max(1, Math.round(diffMs / (60 * 1000)));

  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

export const DataStatusBadge: React.FC<DataStatusBadgeProps> = ({
  status,
  dataSourceLabel,
  lastUpdatedTimestamp,
  confidenceScore,
  showSource = true,
  showTimeAgo = true,
  isDemoData = true,
  size = 'md',
}) => {
  const timeAgo = getTimeAgo(lastUpdatedTimestamp);

  let badgeConfig = {
    label: 'LIVE VERIFIED',
    bg: 'bg-emerald-950/70',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    pulse: true,
    icon: ShieldCheck,
  };

  switch (status) {
    case 'LIVE_VERIFIED':
      badgeConfig = {
        label: 'LIVE VERIFIED',
        bg: 'bg-emerald-950/70',
        border: 'border-emerald-500/40',
        text: 'text-emerald-400',
        dot: 'bg-emerald-400',
        pulse: true,
        icon: ShieldCheck,
      };
      break;

    case 'RECENTLY_UPDATED':
      badgeConfig = {
        label: 'RECENTLY UPDATED',
        bg: 'bg-sky-950/70',
        border: 'border-sky-500/40',
        text: 'text-sky-400',
        dot: 'bg-sky-400',
        pulse: false,
        icon: CheckCircle2,
      };
      break;

    case 'COMMUNITY_REPORTED':
      badgeConfig = {
        label: 'COMMUNITY REPORTED',
        bg: 'bg-amber-950/70',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        dot: 'bg-amber-400',
        pulse: false,
        icon: Users,
      };
      break;

    case 'STALE_DATA':
      badgeConfig = {
        label: 'STALE DATA',
        bg: 'bg-slate-900/80',
        border: 'border-slate-700',
        text: 'text-slate-400',
        dot: 'bg-slate-500',
        pulse: false,
        icon: Clock,
      };
      break;

    case 'UNAVAILABLE':
      badgeConfig = {
        label: 'UNAVAILABLE',
        bg: 'bg-red-950/70',
        border: 'border-red-500/40',
        text: 'text-red-400',
        dot: 'bg-red-400',
        pulse: false,
        icon: XCircle,
      };
      break;
  }

  const Icon = badgeConfig.icon;
  const isSmall = size === 'sm';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Primary Verification Badge */}
      <span
        className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wider rounded-lg border ${
          badgeConfig.bg
        } ${badgeConfig.border} ${badgeConfig.text} ${
          isSmall ? 'text-[9.5px] px-2 py-0.5' : 'text-[10.5px] px-2.5 py-1'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {badgeConfig.pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${badgeConfig.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${badgeConfig.dot}`} />
        </span>
        <Icon size={isSmall ? 11 : 12} />
        <span>{badgeConfig.label}</span>
      </span>

      {/* Demo Data Tag if applicable */}
      {isDemoData && (
        <span
          title="This station runs on simulated telemetry for demonstration."
          className={`inline-flex items-center gap-1 bg-purple-950/50 border border-purple-500/30 text-purple-300 font-bold uppercase tracking-wider rounded-lg ${
            isSmall ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
          }`}
        >
          <span>DEMO DATA</span>
        </span>
      )}

      {/* Time Ago */}
      {showTimeAgo && lastUpdatedTimestamp && (
        <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
          <Clock size={11} className="text-slate-500" />
          <span>{timeAgo}</span>
        </span>
      )}

      {/* Source Tag */}
      {showSource && dataSourceLabel && (
        <span className="text-[10.5px] text-slate-500 font-medium hidden sm:inline-flex items-center gap-1">
          • <span>{dataSourceLabel}</span>
        </span>
      )}

      {/* Confidence Score */}
      {confidenceScore !== undefined && confidenceScore > 0 && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
            confidenceScore >= 85
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'
              : confidenceScore >= 70
              ? 'bg-sky-950/60 text-sky-400 border border-sky-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {confidenceScore}% Reliability
        </span>
      )}
    </div>
  );
};

export default DataStatusBadge;
