import React from 'react';
import { Users, Clock, Fuel, CheckCircle } from 'lucide-react';

interface QueueVisualizerProps {
  vehiclesWaiting: number | null | undefined;
  estimatedWaitMinutes: number | null | undefined;
  activeDispensers?: number | null;
  totalDispensers?: number | null;
  showAnimation?: boolean;
}

export const QueueVisualizer: React.FC<QueueVisualizerProps> = ({
  vehiclesWaiting = 0,
  estimatedWaitMinutes,
  activeDispensers = 4,
  totalDispensers = 4,
  showAnimation = true,
}) => {
  const count = vehiclesWaiting ?? 0;
  const wait = estimatedWaitMinutes ?? Math.max(1, Math.round(count * 2));
  const active = activeDispensers ?? 4;
  const total = totalDispensers ?? Math.max(active, 4);

  const isLow = count <= 3;
  const isMedium = count > 3 && count <= 8;

  const badgeClass = isLow
    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
    : isMedium
    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
    : 'bg-rose-950/60 text-rose-300 border-rose-500/40';

  const badgeText = isLow ? 'Short Queue' : isMedium ? 'Moderate Queue' : 'Heavy Queue';

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 text-slate-100">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-950/60 text-blue-400 rounded-xl border border-blue-500/30">
            <Users size={16} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Live Queue Status
            </h4>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white">{count}</span>
              <span className="text-xs font-semibold text-slate-400">Vehicles in line</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-slate-400 text-xs">
            <Clock size={13} /> <span>Wait Time</span>
          </div>
          <span className="text-lg font-black text-amber-400">~{wait} min</span>
        </div>
      </div>

      {/* Visual Lane of Cars */}
      <div className="bg-[#090d16] rounded-xl p-3 border border-slate-800 mb-3 shadow-inner">
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-wider">
          <span>Vehicles Waiting</span>
          <span>Active Dispensers</span>
        </div>

        <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {count === 0 ? (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle size={14} /> No queue! Zero wait time
              </span>
            ) : (
              <>
                {Array.from({ length: Math.min(count, 8) }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`text-xl ${showAnimation ? 'animate-pulse' : ''}`}
                    title={`Car #${count - idx}`}
                    style={{ animationDuration: `${1.5 + idx * 0.2}s` }}
                  >
                    🚗
                  </span>
                ))}
                {count > 8 && (
                  <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                    +{count - 8} more
                  </span>
                )}
              </>
            )}
          </div>

          <span className="text-slate-600 font-bold px-2">➔</span>

          {/* Dispenser Nozzles Indicator */}
          <div className="flex items-center gap-1 bg-[#162032] border border-slate-800 px-2 py-1.5 rounded-xl flex-shrink-0">
            <Fuel size={14} className="text-emerald-400" />
            <span className="text-xs font-black text-slate-200">
              {active}/{total}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">Active</span>
          </div>
        </div>
      </div>

      {/* Bottom Status Banner */}
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${badgeClass}`}>
          ● {badgeText}
        </span>
        <span className="text-[11px] text-slate-400 font-semibold">
          Avg. {Math.round(wait / Math.max(1, count))}m per car
        </span>
      </div>
    </div>
  );
};

export default QueueVisualizer;
