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
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : isMedium
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-red-100 text-red-800 border-red-300';

  const badgeText = isLow
    ? 'Short Queue'
    : isMedium
    ? 'Moderate Queue'
    : 'Heavy Queue';

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-xl">
            <Users size={16} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Live Queue Status
            </h4>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">{count}</span>
              <span className="text-xs font-semibold text-slate-600">Vehicles in line</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-slate-500 text-xs">
            <Clock size={13} /> <span>Wait Time</span>
          </div>
          <span className="text-lg font-bold text-slate-800">~{wait} min</span>
        </div>
      </div>

      {/* Visual Lane of Cars */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 mb-3 shadow-inner">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-2 uppercase">
          <span>Vehicles Waiting</span>
          <span>Active Dispensers</span>
        </div>

        <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {count === 0 ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
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
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                    +{count - 8} more
                  </span>
                )}
              </>
            )}
          </div>

          <span className="text-slate-300 font-bold px-2">➔</span>

          <div className="flex items-center gap-1 flex-shrink-0">
            {Array.from({ length: active }).map((_, i) => (
              <div
                key={i}
                className="w-7 h-8 bg-emerald-600 rounded-md flex flex-col items-center justify-center text-white text-[10px] font-bold shadow-sm"
                title="Active CNG Nozzle"
              >
                ⛽
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${badgeClass}`}>
          {badgeText}
        </span>

        <span className="text-slate-500 font-medium text-xs">
          <Fuel size={12} className="inline mr-1 text-emerald-600" />
          {active}/{total} Nozzles Active
        </span>
      </div>
    </div>
  );
};

export default QueueVisualizer;
