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
    bg: 'bg-[#B8E65A]/15',
    border: 'border-[#B8E65A]/40',
    text: 'text-[#B8E65A]',
    dot: 'bg-[#B8E65A]',
    pulse: true,
    icon: ShieldCheck,
  };

  switch (status) {
    case 'LIVE_VERIFIED':
      badgeConfig = {
        label: 'LIVE VERIFIED',
        bg: 'bg-[#B8E65A]/15',
        border: 'border-[#B8E65A]/40',
        text: 'text-[#B8E65A]',
        dot: 'bg-[#B8E65A]',
        pulse: true,
        icon: ShieldCheck,
      };
      break;

    case 'RECENTLY_UPDATED':
      badgeConfig = {
        label: 'RECENTLY UPDATED',
        bg: 'bg-[#16C7B2]/15',
        border: 'border-[#16C7B2]/40',
        text: 'text-[#16C7B2]',
        dot: 'bg-[#16C7B2]',
        pulse: false,
        icon: CheckCircle2,
      };
      break;

    case 'COMMUNITY_REPORTED':
      badgeConfig = {
        label: 'COMMUNITY REPORTED',
        bg: 'bg-[#F4B740]/15',
        border: 'border-[#F4B740]/40',
        text: 'text-[#F4B740]',
        dot: 'bg-[#F4B740]',
        pulse: false,
        icon: Users,
      };
      break;

    case 'STALE_DATA':
      badgeConfig = {
        label: 'STALE DATA',
        bg: 'bg-[#17263A]',
        border: 'border-slate-700',
        text: 'text-[#758397]',
        dot: 'bg-[#758397]',
        pulse: false,
        icon: Clock,
      };
      break;

    case 'UNAVAILABLE':
      badgeConfig = {
        label: 'UNAVAILABLE',
        bg: 'bg-[#EF6464]/15',
        border: 'border-[#EF6464]/40',
        text: 'text-[#EF6464]',
        dot: 'bg-[#EF6464]',
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
          className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${
            confidenceScore >= 85
              ? 'bg-[#B8E65A]/10 text-[#B8E65A] border-[#B8E65A]/30'
              : confidenceScore >= 70
              ? 'bg-[#16C7B2]/10 text-[#16C7B2] border-[#16C7B2]/30'
              : 'bg-[#17263A] text-[#758397] border-slate-700'
          }`}
        >
          {confidenceScore}% Reliability
        </span>
      )}
    </div>
  );
};

export default DataStatusBadge;
