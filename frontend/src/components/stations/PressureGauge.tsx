import React from 'react';
import { Gauge, Zap, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

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

  // Status classification
  const isHigh = v >= 195;
  const isMedium = v >= 175 && v < 195;
  const isLow = v > 0 && v < 175;

  const color = isHigh ? '#10b981' : isMedium ? '#f59e0b' : v > 0 ? '#ef4444' : '#94a3b8';
  const psi = Math.round(v * 14.5038);

  const statusTitle = isHigh
    ? 'उच्च प्रेशर (High Pressure)'
    : isMedium
    ? 'मध्यम प्रेशर (Moderate)'
    : v > 0
    ? 'कम प्रेशर (Low Pressure)'
    : 'डेटा अनुपलब्ध (No Data)';

  const statusDesc = isHigh
    ? 'तेज़ गैस भराई व 100% फुल टैंक क्षमता (~9-10 kg)'
    : isMedium
    ? 'सामान्य गैस भराई (~7-8 kg क्षमता)'
    : v > 0
    ? 'धीमी भराई, सिलेंडर अधूरा भरेगा (~5-6 kg)'
    : 'सेंसर ऑफलाइन';

  const dimensions =
    size === 'sm'
      ? { width: 120, height: 75, r: 42, stroke: 9 }
      : size === 'lg'
      ? { width: 220, height: 135, r: 75, stroke: 16 }
      : { width: 170, height: 105, r: 58, stroke: 13 };

  const { width, height, r, stroke } = dimensions;
  const cx = width / 2;
  const cy = height - 12;

  // Arc calculations
  const needleAngle = Math.PI - pct * Math.PI;
  const needleX = cx + (r - 12) * Math.cos(needleAngle);
  const needleY = cy - (r - 12) * Math.sin(needleAngle);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
          {/* Background Track Arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          {/* Low Pressure Zone (140-175) */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx - r * 0.55} ${cy - r * 0.83}`}
            fill="none"
            stroke="#fecaca"
            strokeWidth={stroke - 2}
            strokeLinecap="round"
          />

          {/* High Pressure Zone (195-240) */}
          <path
            d={`M ${cx + r * 0.25} ${cy - r * 0.96} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#a7f3d0"
            strokeWidth={stroke - 2}
            strokeLinecap="round"
          />

          {/* Active Value Arc */}
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
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
          <circle cx={cx} cy={cy} r="5" fill="#0f172a" />
        </svg>

        {/* Center Value */}
        <div className="text-center -mt-3">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-black tracking-tight" style={{ color }}>
              {v > 0 ? Math.round(v) : '—'}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase">Bar</span>
          </div>
          {v > 0 && (
            <span className="text-[11px] font-mono text-slate-400">
              {psi.toLocaleString()} PSI
            </span>
          )}
        </div>
      </div>

      {/* Details Box */}
      {showDetails && (
        <div className="mt-2 text-center max-w-[240px]">
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isHigh
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : isMedium
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : v > 0
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isHigh ? <Zap size={12} /> : isMedium ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            <span>{statusTitle}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-tight">{statusDesc}</p>
        </div>
      )}
    </div>
  );
};

export default PressureGauge;
