import React from 'react';
import {
  CheckCircle2,
  Clock,
  Users,
  AlertTriangle,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import type { DataVerificationStatus } from '../../types';

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

  type BadgeConfig = {
    label: string;
    bg: string;
    border: string;
    text: string;
    dot: string;
    pulse: boolean;
    icon: React.ElementType;
  };

  let badgeConfig: BadgeConfig = {
    label: 'LIVE VERIFIED',
    bg: 'bg-[#E3F4EC]',
    border: 'border-[#C0E4D0]',
    text: 'text-[#26734D]',
    dot: 'bg-[#26734D]',
    pulse: true,
    icon: ShieldCheck,
  };

  switch (status) {
    case 'LIVE_VERIFIED':
      badgeConfig = {
        label: 'LIVE VERIFIED',
        bg: 'bg-[#E3F4EC]',
        border: 'border-[#C0E4D0]',
        text: 'text-[#26734D]',
        dot: 'bg-[#26734D]',
        pulse: true,
        icon: ShieldCheck,
      };
      break;
    case 'RECENTLY_UPDATED':
      badgeConfig = {
        label: 'RECENTLY UPDATED',
        bg: 'bg-[#EBF8FF]',
        border: 'border-[#BEE3F8]',
        text: 'text-[#1A6BC4]',
        dot: 'bg-[#16B8C9]',
        pulse: false,
        icon: CheckCircle2,
      };
      break;
    case 'COMMUNITY_REPORTED':
      badgeConfig = {
        label: 'COMMUNITY REPORTED',
        bg: 'bg-[#FFF2DB]',
        border: 'border-[#FFD88A]',
        text: 'text-[#98651C]',
        dot: 'bg-[#98651C]',
        pulse: false,
        icon: Users,
      };
      break;
    case 'STALE_DATA':
      badgeConfig = {
        label: 'STALE DATA',
        bg: 'bg-[#F4F7FA]',
        border: 'border-[#E3EAF0]',
        text: 'text-[#718096]',
        dot: 'bg-[#A0AEC0]',
        pulse: false,
        icon: Clock,
      };
      break;
    case 'UNAVAILABLE':
      badgeConfig = {
        label: 'UNAVAILABLE',
        bg: 'bg-[#FCEAEA]',
        border: 'border-[#F4BBBB]',
        text: 'text-[#B54747]',
        dot: 'bg-[#B54747]',
        pulse: false,
        icon: XCircle,
      };
      break;
  }

  const Icon = badgeConfig.icon;
  const isSmall = size === 'sm';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Primary Badge */}
      <span
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-lg border ${
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

      {/* Demo Data Tag */}
      {isDemoData && (
        <span
          title="Simulated telemetry for demonstration."
          className={`inline-flex items-center gap-1 bg-[#F0EEFF] border border-[#D4C5FF] text-[#6B4EFF] font-bold uppercase tracking-wider rounded-lg ${
            isSmall ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
          }`}
        >
          DEMO DATA
        </span>
      )}

      {/* Time Ago */}
      {showTimeAgo && lastUpdatedTimestamp && (
        <span className="text-[10.5px] text-[#718096] flex items-center gap-1">
          <Clock size={11} className="text-[#A0AEC0]" />
          <span>{timeAgo}</span>
        </span>
      )}

      {/* Source */}
      {showSource && dataSourceLabel && (
        <span className="text-[10.5px] text-[#A0AEC0] font-medium hidden sm:inline-flex items-center gap-1">
          • <span>{dataSourceLabel}</span>
        </span>
      )}

      {/* Confidence */}
      {confidenceScore !== undefined && confidenceScore > 0 && (
        <span
          className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${
            confidenceScore >= 85
              ? 'bg-[#E3F4EC] text-[#26734D] border-[#C0E4D0]'
              : confidenceScore >= 70
              ? 'bg-[#EBF8FF] text-[#1A6BC4] border-[#BEE3F8]'
              : 'bg-[#F4F7FA] text-[#718096] border-[#E3EAF0]'
          }`}
        >
          {confidenceScore}% Reliability
        </span>
      )}
    </div>
  );
};

export default DataStatusBadge;
