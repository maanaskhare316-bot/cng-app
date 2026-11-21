import React from 'react';
import {
  Users,
  AlertCircle,
  Sparkles,
  Info,
  Gauge,
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

  // If prediction could not be reliably calculated
  if (!prediction.predictionAvailable) {
    return (
      <div className="bg-white border border-[#E3EAF0] rounded-[14px] p-3.5 sm:p-4 text-[#243447] space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-[#98651C] font-extrabold text-xs uppercase tracking-wider">
          <AlertCircle size={15} />
          <span>Smart Arrival Intelligence</span>
        </div>
        <p className="text-xs text-[#718096] font-medium">
          {prediction.unavailabilityReason || 'Prediction unavailable — insufficient telemetry.'}
        </p>
        <div className="text-[10px] text-[#A0AEC0] italic">
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

  const queueDiff = (predictedQueueAtArrival ?? 0) - (currentQueue ?? 0);
  const pressureDiff = (predictedPressureBarAtArrival ?? 0) - (currentPressureBar ?? 0);

  const confStyle =
    confidenceLevel === 'HIGH'
      ? 'text-[#26734D] border-[#C0E4D0] bg-[#E3F4EC]'
      : confidenceLevel === 'MEDIUM'
      ? 'text-[#16B8C9] border-[#16B8C9]/30 bg-[#EBF8FF]'
      : 'text-[#98651C] border-[#FFE2A4] bg-[#FFF2DB]';

  if (compact) {
    return (
      <div className="bg-white border border-[#E3EAF0] hover:border-[#16B8C9] rounded-[14px] p-2.5 text-xs space-y-2 transition shadow-sm">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-extrabold text-[#14283F] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16B8C9]" />
            <span>ETA {etaMinutes}m ({distanceKm} km)</span>
          </span>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${confStyle}`}>
            {confidenceLevel} ({confidencePercentage}%)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-[#E3EAF0]">
          <div>
            <span className="text-[9px] uppercase font-bold text-[#718096] block">Queue at Arrival</span>
            <span className="font-black text-[#14283F]">{predictedQueueAtArrival ?? 0} Cars</span>
            <span className="text-[10px] text-[#718096] ml-1">(~{predictedWaitMinutesAtArrival ?? 1}m)</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-[#718096] block">Pressure at Arrival</span>
            <span className="font-black text-[#26734D]">{predictedPressureBarAtArrival ?? 200} Bar</span>
            <span className="text-[10px] text-[#718096] ml-1">est.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E3EAF0] rounded-[14px] p-4 sm:p-5 shadow-sm text-[#243447] space-y-4">
      {/* Engine Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E3EAF0] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#EBF8FF] border border-[#16B8C9]/30 rounded-xl text-[#16B8C9]">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-xs sm:text-sm text-[#14283F] tracking-wide">
                Smart Arrival Prediction
              </h4>
              <span className="text-[9.5px] font-black text-[#14283F] bg-[#F4F7FA] px-2 py-0.5 rounded-full border border-[#E3EAF0] uppercase tracking-wider">
                ETA {etaMinutes} Mins • {distanceKm} KM
              </span>
            </div>
            <p className="text-[11px] text-[#718096] mt-0.5">
              Estimated arrival at <strong className="text-[#14283F]">{etaClockTime}</strong> factoring road traffic &amp; pumping velocity
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
        <div className="bg-[#F4F7FA] rounded-xl p-3.5 border border-[#E3EAF0] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#718096] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#718096]" />
              Measured Now (Current)
            </span>
            <span className="text-[9.5px] text-[#718096] font-bold tracking-wider">TELEMETRY</span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#718096] flex items-center gap-1.5">
                <Users size={13} className="text-[#16B8C9]" /> Measured Queue:
              </span>
              <span className="font-black text-sm text-[#14283F]">
                {currentQueue ?? 0} Cars{' '}
                <span className="text-[11px] text-[#718096] font-semibold">(~{currentWaitMinutes ?? 2}m wait)</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[#718096] flex items-center gap-1.5">
                <Gauge size={13} className="text-[#26734D]" /> Gas Pressure:
              </span>
              <span className="font-black text-sm text-[#26734D]">
                {currentPressureBar ? `${currentPressureBar} Bar` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Predicted at Arrival */}
        <div className="bg-[#F4F7FA] rounded-xl p-3.5 border border-[#16B8C9]/40 space-y-2.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#14283F] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16B8C9] animate-pulse" />
              Predicted at Arrival ({etaMinutes}m ETA)
            </span>
            <span className="text-[9.5px] font-black text-[#14283F] bg-[#EBF8FF] px-2 py-0.5 rounded border border-[#16B8C9]/30 uppercase tracking-wider">
              AI ESTIMATE
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#718096] flex items-center gap-1.5">
                <Users size={13} className="text-[#16B8C9]" /> Arrival Queue:
              </span>
              <div className="text-right">
                <span className="font-black text-sm text-[#98651C]">
                  {predictedQueueAtArrival ?? 0} Cars{' '}
                  <span className="text-[11px] text-[#718096] font-semibold">(~{predictedWaitMinutesAtArrival ?? 1}m wait)</span>
                </span>
                <span className="text-[9.5px] text-[#718096] block">
                  {queueDiff > 0 ? `+${queueDiff} cars expected` : queueDiff < 0 ? `${queueDiff} cars clearing` : 'Queue stable'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[#718096] flex items-center gap-1.5">
                <Gauge size={13} className="text-[#26734D]" /> Arrival Pressure:
              </span>
              <div className="text-right">
                <span className="font-black text-sm text-[#26734D]">
                  ~{predictedPressureBarAtArrival ?? 200} Bar
                </span>
                <span className="text-[9.5px] text-[#718096] block">
                  {pressureDiff < 0 ? `${pressureDiff} Bar cyclic draw` : pressureDiff > 0 ? `+${pressureDiff} Bar recharge` : 'Stable cascade'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="text-[10.5px] text-[#718096] bg-[#F4F7FA] rounded-xl p-2.5 border border-[#E3EAF0] leading-relaxed flex items-start gap-2">
        <Info size={13} className="text-[#16B8C9] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#14283F]">Notice: </span>
          {disclaimer}
        </div>
      </div>
    </div>
  );
};

export default ArrivalPredictionCard;
