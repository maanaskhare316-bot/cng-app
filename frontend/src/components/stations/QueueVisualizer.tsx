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
    ? 'bg-[#E3F4EC] text-[#26734D] border-[#C0E4D0]'
    : isMedium
    ? 'bg-[#FFF2DB] text-[#98651C] border-[#FFE2A4]'
    : 'bg-[#FCEAEA] text-[#B54747] border-[#F4BBBB]';

  const badgeText = isLow ? 'Short Queue' : isMedium ? 'Moderate Queue' : 'Heavy Queue';

  return (
    <div className="bg-[#F8FAFC] border border-[#DCE5EE] rounded-[14px] p-4 text-[#243447] shadow-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#E8EEF5] text-[#14283F] rounded-xl border border-[#DCE5EE]">
            <Users size={16} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Live Queue Status
            </h4>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-[#14283F]">{count}</span>
              <span className="text-xs font-semibold text-[#64748B]">Vehicles in line</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-[#64748B] text-xs">
            <Clock size={13} /> <span>Wait Time</span>
          </div>
          <span className="text-lg font-black text-[#98651C]">~{wait} min</span>
        </div>
      </div>

      {/* Visual Lane of Cars */}
      <div className="bg-[#E8EEF5] rounded-xl p-3 border border-[#DCE5EE] mb-3">
        <div className="flex items-center justify-between text-[10px] text-[#64748B] font-bold mb-2 uppercase tracking-wider">
          <span>Vehicles Waiting</span>
          <span>Active Dispensers</span>
        </div>

        <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {count === 0 ? (
              <span className="text-xs font-semibold text-[#26734D] flex items-center gap-1">
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
                  <span className="text-xs font-bold bg-[#F8FAFC] text-[#64748B] px-2 py-0.5 rounded-md border border-[#DCE5EE]">
                    +{count - 8} more
                  </span>
                )}
              </>
            )}
          </div>

          <span className="text-[#64748B] font-bold px-2">➔</span>

          {/* Dispenser Nozzles Indicator */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#DCE5EE] px-2 py-1.5 rounded-xl flex-shrink-0">
            <Fuel size={14} className="text-[#26734D]" />
            <span className="text-xs font-black text-[#14283F]">
              {active}/{total}
            </span>
            <span className="text-[10px] text-[#64748B] font-semibold">Active</span>
          </div>
        </div>
      </div>

      {/* Bottom Status Banner */}
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${badgeClass}`}>
          ● {badgeText}
        </span>
        <span className="text-[11px] text-[#64748B] font-semibold">
          Avg. {Math.round(wait / Math.max(1, count))}m per car
        </span>
      </div>
    </div>
  );
};

export default QueueVisualizer;
