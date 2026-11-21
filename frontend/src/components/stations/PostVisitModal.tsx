import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Clock,
  Gauge,
  Users,
  Star,
  Send,
  Sparkles,
} from 'lucide-react';
import type { StationSummaryDto, VisitedStationRecord } from '../../types';

interface PostVisitModalProps {
  isOpen: boolean;
  station: StationSummaryDto | null;
  onClose: () => void;
  onSubmitVisit: (record: VisitedStationRecord) => void;
}

export const PostVisitModal: React.FC<PostVisitModalProps> = ({
  isOpen,
  station,
  onClose,
  onSubmitVisit,
}) => {
  if (!isOpen || !station) return null;

  const predQueue = station.arrivalPrediction?.predictedQueueAtArrival ?? station.vehiclesWaiting ?? 3;
  const predWait = station.arrivalPrediction?.predictedWaitMinutesAtArrival ?? station.estimatedWaitMinutes ?? 6;

  const [actualQueue, setActualQueue] = useState<number>(predQueue);
  const [actualWait, setActualWait] = useState<number>(predWait);
  const [actualPressure, setActualPressure] = useState<number>(
    station.currentPressureBar ? Math.round(station.currentPressureBar) : 205
  );
  const [cngAvailable, setCngAvailable] = useState<boolean>(true);
  const [rating, setRating] = useState<number>(5);
  const [driverNotes, setDriverNotes] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  // Variance between predicted and actual wait time
  const waitVariance = actualWait - predWait;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const record: VisitedStationRecord = {
      id: `visit-${station.id}-${Date.now()}`,
      stationId: station.id,
      stationName: station.name,
      city: station.city,
      visitedAt: new Date().toISOString(),
      predictedQueueAtVisit: predQueue,
      predictedWaitAtVisit: predWait,
      actualQueueConfirmed: actualQueue,
      actualWaitConfirmed: actualWait,
      actualPressureConfirmed: actualPressure,
      cngAvailableConfirmed: cngAvailable,
      predictionVarianceMinutes: waitVariance,
      feedbackRating: rating,
      driverNotes: driverNotes.trim() || undefined,
    };

    onSubmitVisit(record);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#F8FAFC] rounded-[14px] shadow-modal border border-[#DCE5EE] max-w-lg w-full overflow-hidden text-[#243447] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#14283F] px-6 py-4 text-white flex items-center justify-between border-b border-[#1D3854] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <CheckCircle size={18} className="text-[#16B8C9]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Mark as Visited &amp; Verify</h3>
              <p className="text-xs text-[#E3EAF0] truncate max-w-[280px]">{station.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Prediction vs Reality banner */}
          <div className="bg-[#E8EEF5] border border-[#DCE5EE] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#14283F] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#16B8C9]" />
                <span>Our AI Prediction Was:</span>
              </span>
              <span className="text-[11px] font-bold text-[#14283F] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#DCE5EE]">
                {predQueue} Cars • ~{predWait}m wait
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Confirm your actual experience below to help tune our arrival prediction model!
            </p>
          </div>

          {/* 1. Actual Queue Encountered */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-[#16B8C9]" /> Actual Vehicles in Line
              </label>
              <span className="text-sm font-extrabold text-[#14283F] bg-[#E8EEF5] px-2.5 py-0.5 rounded-lg border border-[#DCE5EE]">
                {actualQueue} Cars
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={actualQueue}
              onChange={(e) => setActualQueue(Number(e.target.value))}
              className="w-full accent-[#16B8C9] bg-[#CBD5E1] cursor-pointer h-2 rounded-lg"
            />
          </div>

          {/* 2. Actual Wait Time Spent */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-[#98651C]" /> Actual Wait Time (Minutes)
              </label>
              <span className="text-sm font-extrabold text-[#98651C] bg-[#FFF2DB] px-2.5 py-0.5 rounded-lg border border-[#FFE2A4]">
                {actualWait} Minutes
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="35"
              value={actualWait}
              onChange={(e) => setActualWait(Number(e.target.value))}
              className="w-full accent-[#16B8C9] bg-[#CBD5E1] cursor-pointer h-2 rounded-lg"
            />

            {/* Model Accuracy Feedback */}
            <div className="text-[11px] p-2 bg-[#E8EEF5] rounded-xl border border-[#DCE5EE] flex items-center justify-between">
              <span className="text-[#64748B]">Model Variance:</span>
              <span
                className={`font-black ${
                  Math.abs(waitVariance) <= 3
                    ? 'text-[#26734D]'
                    : Math.abs(waitVariance) <= 6
                    ? 'text-[#98651C]'
                    : 'text-[#B54747]'
                }`}
              >
                {waitVariance === 0
                  ? '🎯 Exact match! 100% Accuracy'
                  : waitVariance > 0
                  ? `+${waitVariance} mins longer than predicted`
                  : `${waitVariance} mins faster than predicted`}
              </span>
            </div>
          </div>

          {/* 3. Actual Pressure Filled */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Gauge size={14} className="text-[#26734D]" /> Dispenser Gas Pressure
              </label>
              <span className="text-sm font-extrabold text-[#26734D] bg-[#E3F4EC] px-2.5 py-0.5 rounded-lg border border-[#C0E4D0]">
                {actualPressure} Bar
              </span>
            </div>
            <input
              type="range"
              min="140"
              max="230"
              step="5"
              value={actualPressure}
              onChange={(e) => setActualPressure(Number(e.target.value))}
              className="w-full accent-[#16B8C9] bg-[#CBD5E1] cursor-pointer h-2 rounded-lg"
            />
          </div>

          {/* 4. Experience Rating */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
              Overall Station Experience
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1.5 rounded-lg hover:bg-[#E8EEF5] transition"
                >
                  <Star
                    size={22}
                    className={star <= rating ? 'text-[#98651C] fill-[#98651C]' : 'text-[#DCE5EE]'}
                  />
                </button>
              ))}
              <span className="text-xs text-[#64748B] ml-2 font-bold">{rating}/5 Stars</span>
            </div>
          </div>

          {/* Driver Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
              Driver Feedback Notes (Optional)
            </label>
            <input
              type="text"
              value={driverNotes}
              onChange={(e) => setDriverNotes(e.target.value)}
              placeholder="e.g., Quick pump operator, smooth transaction, full tank achieved..."
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#DCE5EE] text-xs text-[#243447] placeholder-[#64748B] focus:outline-none focus:border-[#16B8C9]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DCE5EE]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#DCE5EE] text-xs font-bold text-[#64748B] hover:text-[#14283F] hover:bg-[#E8EEF5] transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitted}
              className="px-6 py-2.5 rounded-xl bg-[#14283F] hover:bg-[#1D3854] text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitted ? (
                <>
                  <CheckCircle size={15} /> Feedback Recorded!
                </>
              ) : (
                <>
                  <Send size={15} /> Confirm Visit &amp; Submit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostVisitModal;
