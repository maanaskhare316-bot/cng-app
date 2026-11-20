import React from 'react';
import {
  Star,
  Zap,
  Navigation,
  Clock,
  Gauge,
  Users,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
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
  // Take top 3 stations for comparison
  const topThree = stations.slice(0, 3);

  if (topThree.length === 0) return null;

  return (
    <div className="bg-[#101B2D] rounded-[16px] border border-[#17263A] p-4 sm:p-6 shadow-xl space-y-4 text-slate-100 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#17263A] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#16C7B2]/10 text-[#16C7B2] border border-[#16C7B2]/30 rounded-[10px]">
              ⚖️
            </span>
            <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
              Alternative Station Comparison
            </h3>
          </div>
          <p className="text-xs text-[#758397] mt-0.5">
            Side-by-side telemetry, arrival forecasts, and detour trade-offs for top 3 corridor choices
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#16C7B2] bg-[#16C7B2]/10 border border-[#16C7B2]/30 px-2.5 py-1 rounded-full">
            Top 3 Ranked
          </span>
          <span className="sm:hidden text-[10px] text-[#758397]">Swipe horizontally →</span>
        </div>
      </div>

      {/* Responsive Matrix Table / Cards */}
      <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-[#17263A] text-[10.5px] uppercase tracking-wider text-[#758397]">
              <th className="py-3 px-3 font-extrabold w-[25%]">Evaluation Metric</th>
              {topThree.map((st, i) => {
                const isBest = st.recommendationCategory === 'BEST_OVERALL';
                const isFastest = st.recommendationCategory === 'FASTEST_REFUELING';
                const isNearest = st.recommendationCategory === 'NEAREST_STATION';

                let badgeLabel = `#${i + 1} Alternative`;
                let badgeStyle = 'bg-[#17263A] text-[#758397] border-slate-700';

                if (isBest) {
                  badgeLabel = '★ Best Overall';
                  badgeStyle = 'bg-[#B8E65A] text-[#101B2D] border-[#B8E65A] font-black shadow-sm';
                } else if (isFastest) {
                  badgeLabel = '⚡ Fastest Refuel';
                  badgeStyle = 'bg-[#16C7B2] text-[#101B2D] border-[#16C7B2] font-black shadow-sm';
                } else if (isNearest) {
                  badgeLabel = '📍 Nearest Station';
                  badgeStyle = 'bg-[#17263A] text-[#16C7B2] border-[#16C7B2]/40 font-black';
                }

                return (
                  <th
                    key={st.id}
                    className={`py-3 px-3 w-[25%] font-extrabold rounded-t-[12px] transition ${
                      isBest ? 'bg-[#17263A]/70 border-t border-x border-[#16C7B2]/40' : ''
                    }`}
                  >
                    <span className={`inline-block text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1.5 ${badgeStyle}`}>
                      {badgeLabel}
                    </span>
                    <div className="text-xs sm:text-sm font-black text-white truncate">{st.name}</div>
                    <div className="text-[10.5px] text-[#758397] font-semibold truncate mt-0.5">
                      {st.operator || 'CNG'} • {st.city}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#17263A]/80 text-xs">
            {/* 1. Recommendation Reason */}
            <tr className="bg-[#17263A]/30">
              <td className="py-2.5 px-3 font-bold text-slate-300">Why Recommended</td>
              {topThree.map((st) => (
                <td key={st.id} className="py-2.5 px-3 text-[11px] text-[#F4F7FA] leading-relaxed font-medium">
                  {st.recommendationReason || 'Optimal highway pump.'}
                </td>
              ))}
            </tr>

            {/* 2. Current Gas Pressure */}
            <tr>
              <td className="py-2.5 px-3 font-semibold text-[#758397] flex items-center gap-1.5">
                <Gauge size={13} className="text-[#B8E65A]" /> Current Pressure
              </td>
              {topThree.map((st) => {
                const p = st.currentPressureBar ? Math.round(st.currentPressureBar) : 200;
                return (
                  <td key={st.id} className="py-2.5 px-3 font-black">
                    <span className={p >= 195 ? 'text-[#B8E65A]' : 'text-[#F4B740]'}>{p} Bar</span>
                    <span className="text-[10px] text-[#758397] ml-1 font-semibold">
                      {p >= 195 ? '(Fast Flow)' : '(Standard)'}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* 3. Expected Pressure at Arrival */}
            <tr className="bg-[#17263A]/30">
              <td className="py-2.5 px-3 font-semibold text-[#758397] flex items-center gap-1.5">
                <Gauge size={13} className="text-[#16C7B2]" /> Expected at Arrival
              </td>
              {topThree.map((st) => {
                const pred = st.arrivalPrediction;
                if (!pred || !pred.predictionAvailable) {
                  return (
                    <td key={st.id} className="py-2.5 px-3 text-[11px] text-[#758397] italic">
                      Unavailable
                    </td>
                  );
                }
                return (
                  <td key={st.id} className="py-2.5 px-3 font-black text-[#16C7B2]">
                    ~{pred.predictedPressureBarAtArrival} Bar
                    <span className="text-[10px] text-[#758397] ml-1 font-normal">(est.)</span>
                  </td>
                );
              })}
            </tr>

            {/* 4. Current Queue & Wait */}
            <tr>
              <td className="py-2.5 px-3 font-semibold text-[#758397] flex items-center gap-1.5">
                <Users size={13} className="text-[#16C7B2]" /> Current Queue
              </td>
              {topThree.map((st) => (
                <td key={st.id} className="py-2.5 px-3 font-bold text-white">
                  {st.vehiclesWaiting ?? 0} Cars{' '}
                  <span className="text-[10.5px] text-[#758397] font-normal">
                    (~{st.estimatedWaitMinutes ?? 2}m wait)
                  </span>
                </td>
              ))}
            </tr>

            {/* 5. Expected Queue at Arrival */}
            <tr className="bg-[#17263A]/30">
              <td className="py-2.5 px-3 font-semibold text-[#758397] flex items-center gap-1.5">
                <Users size={13} className="text-[#F4B740]" /> Arrival Queue (ETA)
              </td>
              {topThree.map((st) => {
                const pred = st.arrivalPrediction;
                if (!pred || !pred.predictionAvailable) {
                  return (
                    <td key={st.id} className="py-2.5 px-3 text-[11px] text-[#758397] italic">
                      Unavailable
                    </td>
                  );
                }
                return (
                  <td key={st.id} className="py-2.5 px-3 font-black text-[#F4B740]">
                    {pred.predictedQueueAtArrival} Cars{' '}
                    <span className="text-[10.5px] text-slate-300 font-medium">
                      (~{pred.predictedWaitMinutesAtArrival}m wait)
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* 6. Detour Overhead */}
            <tr>
              <td className="py-2.5 px-3 font-semibold text-[#758397] flex items-center gap-1.5">
                <Navigation size={13} className="text-[#16C7B2]" /> Detour Overhead
              </td>
              {topThree.map((st) => (
                <td key={st.id} className="py-2.5 px-3 font-bold text-white">
                  +{st.extraDetourKm ?? 0.4} km{' '}
                  <span className="text-[10.5px] text-[#758397] font-normal">
                    (~{st.estimatedDetourMinutes ?? 1} min)
                  </span>
                </td>
              ))}
            </tr>

            {/* 7. Travel Distance & ETA */}
            <tr className="bg-[#17263A]/30">
              <td className="py-2.5 px-3 font-semibold text-[#758397] flex items-center gap-1.5">
                <Clock size={13} className="text-[#16C7B2]" /> Distance &amp; ETA
              </td>
              {topThree.map((st) => {
                const dist = st.distanceFromStartKm ?? 10;
                const eta = st.arrivalPrediction?.etaMinutes ?? Math.round((dist / 65) * 60);
                return (
                  <td key={st.id} className="py-2.5 px-3 font-bold text-slate-200">
                    {dist} km • <span className="text-[#B8E65A] font-black">~{eta} mins</span>
                  </td>
                );
              })}
            </tr>

            {/* 8. Data Freshness & Verification Status */}
            <tr>
              <td className="py-2.5 px-3 font-semibold text-[#758397] flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#16C7B2]" /> Data Freshness
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

            {/* 9. Prediction Confidence */}
            <tr className="bg-[#17263A]/30">
              <td className="py-2.5 px-3 font-semibold text-[#758397]">Confidence Level</td>
              {topThree.map((st) => {
                const conf = st.arrivalPrediction?.confidenceLevel || 'MEDIUM';
                const pct = st.arrivalPrediction?.confidencePercentage || st.dataConfidenceScore || 80;
                return (
                  <td key={st.id} className="py-2.5 px-3">
                    <span
                      className={`text-[9.5px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                        conf === 'HIGH'
                          ? 'bg-[#B8E65A]/15 text-[#B8E65A] border-[#B8E65A]/40'
                          : conf === 'MEDIUM'
                          ? 'bg-[#16C7B2]/15 text-[#16C7B2] border-[#16C7B2]/40'
                          : 'bg-[#F4B740]/15 text-[#F4B740] border-[#F4B740]/40'
                      }`}
                    >
                      {conf} ({pct}%)
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Action Row */}
            <tr>
              <td className="py-3.5 px-3 font-bold text-[#758397]">Navigation Action</td>
              {topThree.map((st) => (
                <td key={st.id} className="py-3.5 px-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-3.5 rounded-xl bg-[#16C7B2] hover:bg-[#13b3a0] text-[#101B2D] font-black text-[11px] transition flex items-center gap-1 shadow-md"
                    >
                      <span>Navigate ↗</span>
                    </a>
                    {onSelectStation && (
                      <button
                        type="button"
                        onClick={() => onSelectStation(st)}
                        className="py-1.5 px-2.5 rounded-xl bg-[#17263A] hover:bg-[#213550] border border-slate-700 text-slate-200 font-bold text-[11px] transition"
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
