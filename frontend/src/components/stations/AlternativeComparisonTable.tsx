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
    <div className="bg-[#111827] rounded-2xl sm:rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-xl space-y-4 text-slate-100 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              ⚖️
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              Alternative Station Comparison (Top 3 Highway Choices)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Side-by-side telemetry, arrival forecasts, and detour trade-offs along your corridor
          </p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-full self-start sm:self-auto">
          Multi-Factor Evaluated
        </span>
      </div>

      {/* Responsive Matrix Table / Cards */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
              <th className="py-2.5 px-3 font-extrabold">Evaluation Metric</th>
              {topThree.map((st, i) => {
                const isBest = st.recommendationCategory === 'BEST_OVERALL';
                const isFastest = st.recommendationCategory === 'FASTEST_REFUELING';
                const isNearest = st.recommendationCategory === 'NEAREST_STATION';

                let badgeLabel = `#${i + 1} Alternative`;
                let badgeStyle = 'bg-[#162032] text-slate-300 border-slate-700';

                if (isBest) {
                  badgeLabel = '🏆 Best Overall';
                  badgeStyle = 'bg-amber-400 text-slate-950 border-amber-300 font-black';
                } else if (isFastest) {
                  badgeLabel = '⚡ Fastest Refuel';
                  badgeStyle = 'bg-amber-500 text-slate-950 border-amber-400 font-black';
                } else if (isNearest) {
                  badgeLabel = '📍 Nearest Station';
                  badgeStyle = 'bg-sky-500 text-white border-sky-400 font-black';
                }

                return (
                  <th key={st.id} className="py-2.5 px-3 w-[28%] font-extrabold">
                    <span className={`inline-block text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1 ${badgeStyle}`}>
                      {badgeLabel}
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-white truncate">{st.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate">{st.city}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80 text-xs">
            {/* 1. Recommendation Reason */}
            <tr className="bg-[#0b1322]/50">
              <td className="py-2.5 px-3 font-bold text-slate-300">Why Recommended</td>
              {topThree.map((st) => (
                <td key={st.id} className="py-2.5 px-3 text-[11px] text-slate-200 leading-relaxed font-medium">
                  {st.recommendationReason || 'Optimal highway pump.'}
                </td>
              ))}
            </tr>

            {/* 2. Current Gas Pressure */}
            <tr>
              <td className="py-2.5 px-3 font-semibold text-slate-400 flex items-center gap-1.5">
                <Gauge size={13} className="text-emerald-400" /> Current Pressure
              </td>
              {topThree.map((st) => {
                const p = st.currentPressureBar ? Math.round(st.currentPressureBar) : 200;
                return (
                  <td key={st.id} className="py-2.5 px-3 font-extrabold">
                    <span className={p >= 195 ? 'text-emerald-400' : 'text-amber-400'}>{p} Bar</span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      {p >= 195 ? '(High)' : '(Standard)'}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* 3. Expected Pressure at Arrival */}
            <tr className="bg-[#0b1322]/30">
              <td className="py-2.5 px-3 font-semibold text-slate-400 flex items-center gap-1.5">
                <Gauge size={13} className="text-cyan-400" /> Expected at Arrival
              </td>
              {topThree.map((st) => {
                const pred = st.arrivalPrediction;
                if (!pred || !pred.predictionAvailable) {
                  return (
                    <td key={st.id} className="py-2.5 px-3 text-[11px] text-slate-500 italic">
                      Unavailable
                    </td>
                  );
                }
                return (
                  <td key={st.id} className="py-2.5 px-3 font-extrabold text-cyan-300">
                    ~{pred.predictedPressureBarAtArrival} Bar
                    <span className="text-[10px] text-slate-400 ml-1 font-normal">(est.)</span>
                  </td>
                );
              })}
            </tr>

            {/* 4. Current Queue & Wait */}
            <tr>
              <td className="py-2.5 px-3 font-semibold text-slate-400 flex items-center gap-1.5">
                <Users size={13} className="text-blue-400" /> Current Queue
              </td>
              {topThree.map((st) => (
                <td key={st.id} className="py-2.5 px-3 font-bold text-white">
                  {st.vehiclesWaiting ?? 0} Cars{' '}
                  <span className="text-[10.5px] text-slate-400 font-normal">
                    (~{st.estimatedWaitMinutes ?? 2}m wait)
                  </span>
                </td>
              ))}
            </tr>

            {/* 5. Expected Queue at Arrival */}
            <tr className="bg-[#0b1322]/30">
              <td className="py-2.5 px-3 font-semibold text-slate-400 flex items-center gap-1.5">
                <Users size={13} className="text-amber-400" /> Arrival Queue (ETA)
              </td>
              {topThree.map((st) => {
                const pred = st.arrivalPrediction;
                if (!pred || !pred.predictionAvailable) {
                  return (
                    <td key={st.id} className="py-2.5 px-3 text-[11px] text-slate-500 italic">
                      Unavailable
                    </td>
                  );
                }
                return (
                  <td key={st.id} className="py-2.5 px-3 font-extrabold text-amber-300">
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
              <td className="py-2.5 px-3 font-semibold text-slate-400 flex items-center gap-1.5">
                <Navigation size={13} className="text-cyan-400" /> Detour Overhead
              </td>
              {topThree.map((st) => (
                <td key={st.id} className="py-2.5 px-3 font-bold text-white">
                  +{st.extraDetourKm ?? 0.4} km{' '}
                  <span className="text-[10.5px] text-slate-400 font-normal">
                    (~{st.estimatedDetourMinutes ?? 1} min)
                  </span>
                </td>
              ))}
            </tr>

            {/* 7. Travel Distance & ETA */}
            <tr className="bg-[#0b1322]/30">
              <td className="py-2.5 px-3 font-semibold text-slate-400 flex items-center gap-1.5">
                <Clock size={13} className="text-purple-400" /> Distance &amp; ETA
              </td>
              {topThree.map((st) => {
                const dist = st.distanceFromStartKm ?? 10;
                const eta = st.arrivalPrediction?.etaMinutes ?? Math.round((dist / 65) * 60);
                return (
                  <td key={st.id} className="py-2.5 px-3 font-bold text-slate-200">
                    {dist} km • <span className="text-emerald-400">~{eta} mins</span>
                  </td>
                );
              })}
            </tr>

            {/* 8. Data Freshness & Verification Status */}
            <tr>
              <td className="py-2.5 px-3 font-semibold text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" /> Data Freshness
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
            <tr className="bg-[#0b1322]/30">
              <td className="py-2.5 px-3 font-semibold text-slate-400">Confidence Level</td>
              {topThree.map((st) => {
                const conf = st.arrivalPrediction?.confidenceLevel || 'MEDIUM';
                const pct = st.arrivalPrediction?.confidencePercentage || st.dataConfidenceScore || 80;
                return (
                  <td key={st.id} className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase ${
                        conf === 'HIGH'
                          ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30'
                          : conf === 'MEDIUM'
                          ? 'bg-sky-950/70 text-sky-400 border-sky-500/30'
                          : 'bg-amber-950/70 text-amber-400 border-amber-500/30'
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
              <td className="py-3 px-3 font-bold text-slate-400">Action</td>
              {topThree.map((st) => (
                <td key={st.id} className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition flex items-center gap-1 shadow-md"
                    >
                      <span>Navigate ↗</span>
                    </a>
                    {onSelectStation && (
                      <button
                        type="button"
                        onClick={() => onSelectStation(st)}
                        className="py-1.5 px-2.5 rounded-xl bg-[#162032] hover:bg-[#1e2d47] border border-slate-700 text-slate-300 font-bold text-[11px] transition"
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
