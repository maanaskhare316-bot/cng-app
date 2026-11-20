import React from 'react';
import {
  Clock,
  Gauge,
  Users,
  Navigation,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Info,
} from 'lucide-react';
import type { ArrivalPrediction } from '../../types';

interface ArrivalPredictionCardProps {
  prediction?: ArrivalPrediction;
  compact?: boolean;
}

export const ArrivalPredictionCard: React.FC<ArrivalPredictionCardProps> = ({
  prediction,
  compact = false,
}) => {
  if (!prediction) return null;

  // If prediction could not be reliably calculated (e.g. stale data, station closed, missing telemetry)
  if (!prediction.predictionAvailable) {
    return (
      <div className="bg-[#0b1322] border border-slate-800 rounded-2xl p-3.5 sm:p-4 text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <AlertCircle size={15} />
          <span>Arrival Prediction Engine</span>
        </div>
        <p className="text-xs text-slate-400 font-medium">
          {prediction.unavailabilityReason || 'Prediction unavailable — insufficient data.'}
        </p>
        <div className="text-[10px] text-slate-500 italic">
          Reliable SCADA or recent community telemetry is required to forecast queue and compressor pressure upon arrival.
        </div>
      </div>
    );
  }

  const {
    distanceKm,
    etaMinutes,
    etaClockTime,
    currentQueue,
    predictedQueueAtArrival,
    currentWaitMinutes,
    predictedWaitMinutesAtArrival,
    currentPressureBar,
    predictedPressureBarAtArrival,
    confidenceLevel,
    confidencePercentage,
    disclaimer,
  } = prediction;

  // Queue Trend (did queue increase or decrease?)
  const queueDiff = (predictedQueueAtArrival ?? 0) - (currentQueue ?? 0);
  // Pressure Trend
  const pressureDiff = (predictedPressureBarAtArrival ?? 0) - (currentPressureBar ?? 0);

  // Confidence styling
  const confColor =
    confidenceLevel === 'HIGH'
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/60'
      : confidenceLevel === 'MEDIUM'
      ? 'text-sky-400 border-sky-500/30 bg-sky-950/60'
      : 'text-amber-400 border-amber-500/30 bg-amber-950/60';

  if (compact) {
    return (
      <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-2.5 text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-extrabold text-slate-300 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-400" />
            <span>ETA {etaMinutes}m ({distanceKm} km)</span>
          </span>
          <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded border uppercase ${confColor}`}>
            {confidenceLevel} Confidence ({confidencePercentage}%)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Queue at Arrival</span>
            <span className="font-black text-white">{predictedQueueAtArrival ?? 0} Cars</span>
            <span className="text-[10px] text-slate-400 ml-1">(~{predictedWaitMinutesAtArrival ?? 1}m wait)</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Pressure at Arrival</span>
            <span className="font-black text-emerald-400">{predictedPressureBarAtArrival ?? 200} Bar</span>
            <span className="text-[10px] text-slate-400 ml-1">est.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#0c1527] to-[#070e1c] border border-cyan-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg text-slate-100 space-y-4">
      {/* Engine Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
              <span>Smart Arrival Prediction</span>
              <span className="text-[9.5px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                ETA {etaMinutes} Mins • {distanceKm} KM
              </span>
            </h4>
            <p className="text-[10.5px] text-slate-400">
              Estimated arrival at <strong>{etaClockTime}</strong> based on traffic & distance
            </p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className={`text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${confColor}`}>
          <span>Confidence:</span>
          <span>{confidenceLevel} ({confidencePercentage}%)</span>
        </div>
      </div>

      {/* Side-by-Side Comparison: Measured (Now) vs Predicted (At Arrival) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Column 1: Current Measured */}
        <div className="bg-[#0f1b30]/80 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Measured Now (Current)
            </span>
            <span className="text-[10px] text-slate-500 font-bold">LIVE TELEMETRY</span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <Users size={14} className="text-blue-400" /> Vehicle Queue:
              </span>
              <span className="font-extrabold text-sm text-white">
                {currentQueue ?? 0} Cars{' '}
                <span className="text-[11px] text-slate-400 font-medium">(~{currentWaitMinutes ?? 2}m wait)</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <Gauge size={14} className="text-emerald-400" /> Compressor Pressure:
              </span>
              <span className="font-extrabold text-sm text-emerald-400">
                {currentPressureBar ? `${currentPressureBar} Bar` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Predicted at Arrival */}
        <div className="bg-gradient-to-br from-[#0c2438]/90 to-[#071624] rounded-2xl p-3.5 border border-cyan-500/30 space-y-2.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Predicted at Arrival ({etaMinutes}m ETA)
            </span>
            <span className="text-[10px] font-black text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
              AI FORECAST
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-200 flex items-center gap-1.5">
                <Users size={14} className="text-blue-400" /> Arrival Queue:
              </span>
              <div className="text-right">
                <span className="font-extrabold text-sm text-amber-400">
                  {predictedQueueAtArrival ?? 0} Cars{' '}
                  <span className="text-[11px] text-slate-300 font-semibold">(~{predictedWaitMinutesAtArrival ?? 1}m wait)</span>
                </span>
                <span className="text-[9.5px] text-slate-400 block">
                  {queueDiff > 0 ? `+${queueDiff} cars expected` : queueDiff < 0 ? `${queueDiff} cars clearing` : 'Queue stable'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-200 flex items-center gap-1.5">
                <Gauge size={14} className="text-emerald-400" /> Arrival Pressure:
              </span>
              <div className="text-right">
                <span className="font-extrabold text-sm text-emerald-400">
                  ~{predictedPressureBarAtArrival ?? 200} Bar
                </span>
                <span className="text-[9.5px] text-slate-400 block">
                  {pressureDiff < 0 ? `${pressureDiff} Bar cyclic draw` : pressureDiff > 0 ? `+${pressureDiff} Bar recharge` : 'Stable cycle'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="text-[10.5px] text-slate-400 bg-black/30 rounded-xl p-2.5 border border-white/5 leading-relaxed flex items-start gap-2">
        <Info size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Notice: </span>
          {disclaimer}
        </div>
      </div>
    </div>
  );
};

export default ArrivalPredictionCard;
