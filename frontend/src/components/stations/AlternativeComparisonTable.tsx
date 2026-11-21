import React from 'react';
import {
  Clock,
  Gauge,
  Users,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import type { StationSummaryDto } from '../../types';
import DataStatusBadge from './DataStatusBadge';

interface AlternativeComparisonTableProps {
  stations: StationSummaryDto[];
  onSelectStation?: (station: StationSummaryDto) => void;
}

export const AlternativeComparisonTable: React.FC<AlternativeComparisonTableProps> = ({
  stations,
  onSelectStation,
}) => {
  const topThree = stations.slice(0, 3);

  if (topThree.length === 0) return null;

  return (
    <div className="bg-[#F8FAFC] rounded-[14px] border border-[#DCE5EE] p-4 sm:p-6 shadow-card space-y-4 text-[#243447] overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE5EE] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#E8EEF5] text-[#14283F] border border-[#DCE5EE] rounded-xl text-sm">
              ⚖️
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-[#14283F] tracking-wide">
              Alternative Station Comparison
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Side-by-side telemetry, arrival forecasts, and detour trade-offs for top 3 corridor choices
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#14283F] bg-[#E8EEF5] border border-[#DCE5EE] px-2.5 py-1 rounded-full">
            Top 3 Ranked
          </span>
          <span className="sm:hidden text-[10px] text-[#64748B]">Swipe horizontally →</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1 scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-[#DCE5EE] text-[10.5px] uppercase tracking-wider text-[#64748B]">
              <th className="py-3 px-3 font-extrabold w-[25%]">Evaluation Metric</th>
              {topThree.map((st, i) => {
                const isBest = st.recommendationCategory === 'BEST_OVERALL';
                const isFastest = st.recommendationCategory === 'FASTEST_REFUELING';
                const isNearest = st.recommendationCategory === 'NEAREST_STATION';

                let badgeLabel = `#${i + 1} Alternative`;
                let badgeStyle = 'bg-[#E8EEF5] text-[#64748B] border-[#DCE5EE]';

                if (isBest) {
                  badgeLabel = '★ Best Overall';
                  badgeStyle = 'bg-[#E3F4EC] text-[#26734D] border-[#C0E4D0] font-black shadow-xs';
                } else if (isFastest) {
                  badgeLabel = '⚡ Fastest Refuel';
                  badgeStyle = 'bg-[#EBF8FF] text-[#16B8C9] border-[#BEE3F8] font-black shadow-xs';
                } else if (isNearest) {
                  badgeLabel = '📍 Nearest Station';
                  badgeStyle = 'bg-[#E8EEF5] text-[#14283F] border-[#DCE5EE] font-black';
                }

                return (
                  <th
                    key={st.id}
                    className={`py-3 px-3 w-[25%] font-extrabold rounded-t-[12px] transition ${
                      isBest ? 'bg-[#E8EEF5] border-t border-x border-[#DCE5EE]' : ''
                    }`}
                  >
                    <span className={`inline-block text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1.5 ${badgeStyle}`}>
                      {badgeLabel}
                    </span>
                    <div className="text-xs sm:text-sm font-black text-[#14283F] truncate">{st.name}</div>
                    <div className="text-[10.5px] text-[#64748B] font-semibold truncate mt-0.5">
                      {st.operator || 'CNG'} • {st.city}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#DCE5EE] text-xs">
            <tr className="bg-[#E8EEF5]/50">
              <td className="py-2.5 px-3 font-bold text-[#14283F]">Why Recommended</td>
              {topThree.map((st) => (
                <td key={st.id} className="py-2.5 px-3 text-[11px] text-[#243447] leading-relaxed font-medium">
                  {st.recommendationReason || 'Optimal highway pump.'}
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2.5 px-3 font-semibold text-[#64748B] flex items-center gap-1.5">
                <Gauge size={13} className="text-[#26734D]" /> Current Pressure
              </td>
              {topThree.map((st) => {
                const p = st.currentPressureBar ? Math.round(st.currentPressureBar) : 200;
                return (
                  <td key={st.id} className="py-2.5 px-3 font-black">
                    <span className={p >= 195 ? 'text-[#26734D]' : 'text-[#98651C]'}>{p} Bar</span>
                    <span className="text-[10px] text-[#64748B] ml-1 font-semibold">
                      {p >= 195 ? '(Fast Flow)' : '(Standard)'}
                    </span>
                  </td>
                );
              })}
            </tr>

            <tr className="bg-[#E8EEF5]/50">
              <td className="py-2.5 px-3 font-semibold text-[#64748B] flex items-center gap-1.5">
                <Gauge size={13} className="text-[#16B8C9]" /> Expected at Arrival
              </td>
              {topThree.map((st) => {
                const pred = st.arrivalPrediction;
                if (!pred || !pred.predictionAvailable) {
                  return (
                    <td key={st.id} className="py-2.5 px-3 text-[11px] text-[#64748B] italic">
                      Unavailable
                    </td>
                  );
                }
                return (
                  <td key={st.id} className="py-2.5 px-3 font-black text-[#14283F]">
                    ~{pred.predictedPressureBarAtArrival} Bar
                    <span className="text-[10px] text-[#64748B] ml-1 font-normal">(est.)</span>
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="py-2.5 px-3 font-semibold text-[#64748B] flex items-center gap-1.5">
                <Users size={13} className="text-[#16B8C9]" /> Current Queue
              </td>
              {topThree.map((st) => (
                <td key={st.id} className="py-2.5 px-3 font-bold text-[#14283F]">
                  {st.vehiclesWaiting ?? 0} Cars{' '}
                  <span className="text-[10.5px] text-[#64748B] font-normal">
                    (~{st.estimatedWaitMinutes ?? 2}m wait)
                  </span>
                </td>
              ))}
            </tr>

            <tr className="bg-[#E8EEF5]/50">
              <td className="py-2.5 px-3 font-semibold text-[#64748B] flex items-center gap-1.5">
                <Users size={13} className="text-[#98651C]" /> Arrival Queue (ETA)
              </td>
              {topThree.map((st) => {
                const pred = st.arrivalPrediction;
                if (!pred || !pred.predictionAvailable) {
                  return (
                    <td key={st.id} className="py-2.5 px-3 text-[11px] text-[#64748B] italic">
                      Unavailable
                    </td>
                  );
                }
                return (
                  <td key={st.id} className="py-2.5 px-3 font-black text-[#98651C]">
                    {pred.predictedQueueAtArrival} Cars{' '}
                    <span className="text-[10.5px] text-[#64748B] font-medium">
                      (~{pred.predictedWaitMinutesAtArrival}m wait)
                    </span>
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="py-2.5 px-3 font-semibold text-[#64748B] flex items-center gap-1.5">
                <Navigation size={13} className="text-[#16B8C9]" /> Detour Overhead
              </td>
              {topThree.map((st) => (
                <td key={st.id} className="py-2.5 px-3 font-bold text-[#14283F]">
                  +{st.extraDetourKm ?? 0.4} km{' '}
                  <span className="text-[10.5px] text-[#64748B] font-normal">
                    (~{st.estimatedDetourMinutes ?? 1} min)
                  </span>
                </td>
              ))}
            </tr>

            <tr className="bg-[#E8EEF5]/50">
              <td className="py-2.5 px-3 font-semibold text-[#64748B] flex items-center gap-1.5">
                <Clock size={13} className="text-[#16B8C9]" /> Distance &amp; ETA
              </td>
              {topThree.map((st) => {
                const dist = st.distanceFromStartKm ?? 10;
                const eta = st.arrivalPrediction?.etaMinutes ?? Math.round((dist / 65) * 60);
                return (
                  <td key={st.id} className="py-2.5 px-3 font-bold text-[#243447]">
                    {dist} km • <span className="text-[#26734D] font-black">~{eta} mins</span>
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="py-2.5 px-3 font-semibold text-[#64748B] flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#16B8C9]" /> Data Freshness
              </td>
              {topThree.map((st) => (
                <td key={st.id} className="py-2.5 px-3">
                  <DataStatusBadge
                    status={st.verificationStatus}
                    lastUpdatedTimestamp={st.lastUpdatedTimestamp}
                    showSource={false}
                    size="sm"
                  />
                </td>
              ))}
            </tr>

            <tr className="bg-[#E8EEF5]/50">
              <td className="py-2.5 px-3 font-semibold text-[#64748B]">Confidence Level</td>
              {topThree.map((st) => {
                const conf = st.arrivalPrediction?.confidenceLevel || 'MEDIUM';
                const pct = st.arrivalPrediction?.confidencePercentage || st.dataConfidenceScore || 80;
                return (
                  <td key={st.id} className="py-2.5 px-3">
                    <span
                      className={`text-[9.5px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                        conf === 'HIGH'
                          ? 'bg-[#E3F4EC] text-[#26734D] border-[#C0E4D0]'
                          : conf === 'MEDIUM'
                          ? 'bg-[#EBF8FF] text-[#16B8C9] border-[#BEE3F8]'
                          : 'bg-[#FFF2DB] text-[#98651C] border-[#FFE2A4]'
                      }`}
                    >
                      {conf} ({pct}%)
                    </span>
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="py-3.5 px-3 font-bold text-[#64748B]">Navigation Action</td>
              {topThree.map((st) => (
                <td key={st.id} className="py-3.5 px-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-3.5 rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white font-bold text-[11px] transition flex items-center gap-1 shadow-xs"
                    >
                      <span>Navigate ↗</span>
                    </a>
                    {onSelectStation && (
                      <button
                        type="button"
                        onClick={() => onSelectStation(st)}
                        className="py-1.5 px-2.5 rounded-xl bg-[#E8EEF5] hover:bg-[#DCE5EE] border border-[#DCE5EE] text-[#14283F] font-bold text-[11px] transition"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlternativeComparisonTable;
