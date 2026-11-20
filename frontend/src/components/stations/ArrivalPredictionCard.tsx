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
  ShieldCheck,
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
      <div className="bg-[#101B2D] border border-[#17263A] rounded-[16px] p-3.5 sm:p-4 text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-[#F4B740] font-extrabold text-xs uppercase tracking-wider">
          <AlertCircle size={15} />
          <span>Smart Arrival Intelligence</span>
        </div>
        <p className="text-xs text-[#758397] font-medium">
          {prediction.unavailabilityReason || 'Prediction unavailable — insufficient telemetry.'}
        </p>
        <div className="text-[10px] text-[#758397]/80 italic">
          Reliable IoT sensor readings or recent driver telemetry are required to forecast queue and gas pressure upon arrival.
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

  // Confidence styling with Palette
  const confStyle =
    confidenceLevel === 'HIGH'
      ? 'text-[#B8E65A] border-[#B8E65A]/40 bg-[#B8E65A]/10'
      : confidenceLevel === 'MEDIUM'
      ? 'text-[#16C7B2] border-[#16C7B2]/40 bg-[#16C7B2]/10'
      : 'text-[#F4B740] border-[#F4B740]/40 bg-[#F4B740]/10';

  if (compact) {
    return (
      <div className="bg-[#101B2D] border border-[#17263A] hover:border-[#16C7B2]/40 rounded-[14px] p-2.5 text-xs space-y-2 transition">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-extrabold text-white flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16C7B2]" />
            <span>ETA {etaMinutes}m ({distanceKm} km)</span>
          </span>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${confStyle}`}>
            {confidenceLevel} ({confidencePercentage}%)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-[#17263A]">
          <div>
            <span className="text-[9px] uppercase font-bold text-[#758397] block">Queue at Arrival</span>
            <span className="font-black text-white">{predictedQueueAtArrival ?? 0} Cars</span>
            <span className="text-[10px] text-[#758397] ml-1">(~{predictedWaitMinutesAtArrival ?? 1}m)</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-[#758397] block">Pressure at Arrival</span>
            <span className="font-black text-[#B8E65A]">{predictedPressureBarAtArrival ?? 200} Bar</span>
            <span className="text-[10px] text-[#758397] ml-1">est.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#101B2D] border border-[#16C7B2]/30 rounded-[16px] p-4 sm:p-5 shadow-lg text-slate-100 space-y-4">
      {/* Engine Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#17263A] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#16C7B2]/10 border border-[#16C7B2]/30 rounded-[12px] text-[#16C7B2]">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-xs sm:text-sm text-white tracking-wide">
                Smart Arrival Prediction
              </h4>
              <span className="text-[9.5px] font-black text-[#16C7B2] bg-[#16C7B2]/15 px-2 py-0.5 rounded-full border border-[#16C7B2]/30 uppercase tracking-wider">
                ETA {etaMinutes} Mins • {distanceKm} KM
              </span>
            </div>
            <p className="text-[11px] text-[#758397] mt-0.5">
              Estimated arrival at <strong className="text-white">{etaClockTime}</strong> factoring road traffic &amp; pumping velocity
            </p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className={`text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-[10px] border flex items-center gap-1.5 uppercase tracking-wider ${confStyle}`}>
          <span>Reliability:</span>
          <span>{confidenceLevel} ({confidencePercentage}%)</span>
        </div>
      </div>

      {/* Side-by-Side Comparison: Measured (Now) vs Predicted (At Arrival) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Column 1: Current Measured */}
        <div className="bg-[#17263A] rounded-[14px] p-3.5 border border-slate-700/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#758397] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#758397]" />
              Measured Now (Current)
            </span>
            <span className="text-[9.5px] text-[#758397] font-bold tracking-wider">TELEMETRY</span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#758397] flex items-center gap-1.5">
                <Users size={13} className="text-[#16C7B2]" /> Measured Queue:
              </span>
              <span className="font-black text-sm text-white">
                {currentQueue ?? 0} Cars{' '}
                <span className="text-[11px] text-[#758397] font-semibold">(~{currentWaitMinutes ?? 2}m wait)</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[#758397] flex items-center gap-1.5">
                <Gauge size={13} className="text-[#B8E65A]" /> Gas Pressure:
              </span>
              <span className="font-black text-sm text-[#B8E65A]">
                {currentPressureBar ? `${currentPressureBar} Bar` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Predicted at Arrival */}
        <div className="bg-[#17263A] rounded-[14px] p-3.5 border border-[#16C7B2]/40 space-y-2.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#16C7B2] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16C7B2] animate-pulse" />
              Predicted at Arrival ({etaMinutes}m ETA)
            </span>
            <span className="text-[9.5px] font-black text-[#16C7B2] bg-[#16C7B2]/10 px-2 py-0.5 rounded border border-[#16C7B2]/30 uppercase tracking-wider">
              AI ESTIMATE
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#758397] flex items-center gap-1.5">
                <Users size={13} className="text-[#16C7B2]" /> Arrival Queue:
              </span>
              <div className="text-right">
                <span className="font-black text-sm text-[#F4B740]">
                  {predictedQueueAtArrival ?? 0} Cars{' '}
                  <span className="text-[11px] text-slate-300 font-semibold">(~{predictedWaitMinutesAtArrival ?? 1}m wait)</span>
                </span>
                <span className="text-[9.5px] text-[#758397] block">
                  {queueDiff > 0 ? `+${queueDiff} cars expected` : queueDiff < 0 ? `${queueDiff} cars clearing` : 'Queue stable'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[#758397] flex items-center gap-1.5">
                <Gauge size={13} className="text-[#B8E65A]" /> Arrival Pressure:
              </span>
              <div className="text-right">
                <span className="font-black text-sm text-[#B8E65A]">
                  ~{predictedPressureBarAtArrival ?? 200} Bar
                </span>
                <span className="text-[9.5px] text-[#758397] block">
                  {pressureDiff < 0 ? `${pressureDiff} Bar cyclic draw` : pressureDiff > 0 ? `+${pressureDiff} Bar recharge` : 'Stable cascade'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="text-[10.5px] text-[#758397] bg-[#17263A]/60 rounded-[12px] p-2.5 border border-slate-800 leading-relaxed flex items-start gap-2">
        <Info size={13} className="text-[#16C7B2] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-300">Notice: </span>
          {disclaimer}
        </div>
      </div>
    </div>
  );
};

export default ArrivalPredictionCard;
