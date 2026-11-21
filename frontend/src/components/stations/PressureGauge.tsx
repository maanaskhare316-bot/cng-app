import React from 'react';
import { Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PressureGaugeProps {
  value: number | null | undefined;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const PressureGauge: React.FC<PressureGaugeProps> = ({
  value,
  min = 140,
  max = 240,
  size = 'md',
  showDetails = true,
}) => {
  const v = value ?? 0;
  const clamped = Math.min(max, Math.max(min, v));
  const pct = v === 0 ? 0 : (clamped - min) / (max - min);

  const isHigh = v >= 195;
  const isMedium = v >= 175 && v < 195;

  const color = isHigh ? '#26734D' : isMedium ? '#98651C' : v > 0 ? '#B54747' : '#64748B';
  const psi = Math.round(v * 14.5038);

  const statusTitle = isHigh
    ? 'High Pressure (200+ Bar)'
    : isMedium
    ? 'Moderate Pressure'
    : v > 0
    ? 'Low Pressure (<175 Bar)'
    : 'No Sensor Data';

  const statusDesc = isHigh
    ? 'Fast fill with 100% full cylinder capacity (~9-10 kg)'
    : isMedium
    ? 'Standard filling speed (~7-8 kg capacity)'
    : v > 0
    ? 'Slow fill, partial tank capacity (~5-6 kg)'
    : 'Offline sensor';

  const dimensions =
    size === 'sm'
      ? { width: 120, height: 75, r: 42, stroke: 9 }
      : size === 'lg'
      ? { width: 220, height: 135, r: 75, stroke: 16 }
      : { width: 170, height: 105, r: 58, stroke: 13 };

  const { width, height, r, stroke } = dimensions;
  const cx = width / 2;
  const cy = height - 12;

  const needleAngle = Math.PI - pct * Math.PI;
  const needleX = cx + (r - 12) * Math.cos(needleAngle);
  const needleY = cy - (r - 12) * Math.sin(needleAngle);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
          {/* Track Arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#DCE5EE"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          {/* Value Arc */}
          {v > 0 && (
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(needleAngle)} ${cy - r * Math.sin(needleAngle)}`}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          )}

          {/* Needle */}
          {v > 0 && (
            <line
              x1={cx}
              y1={cy}
              x2={needleX}
              y2={needleY}
              stroke="#14283F"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
          <circle cx={cx} cy={cy} r="4.5" fill="#14283F" />
        </svg>

        <div className="text-center -mt-3">
          <span className="text-2xl font-black leading-none block" style={{ color }}>
            {v > 0 ? `${Math.round(v)} Bar` : '—'}
          </span>
          <span className="text-[11px] font-semibold text-[#64748B] mt-0.5 block">
            {v > 0 ? `${psi} PSI` : 'No reading'}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="text-center mt-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8EEF5] border border-[#DCE5EE]">
            {isHigh ? (
              <CheckCircle2 size={13} className="text-[#26734D]" />
            ) : isMedium ? (
              <Zap size={13} className="text-[#98651C]" />
            ) : (
              <AlertTriangle size={13} className="text-[#B54747]" />
            )}
            <span style={{ color }}>{statusTitle}</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-1 max-w-[220px] leading-tight">{statusDesc}</p>
        </div>
      )}
    </div>
  );
};

export default PressureGauge;
