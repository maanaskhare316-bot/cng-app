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
  TrendingUp,
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 max-w-lg w-full overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-emerald-600/30 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <CheckCircle size={18} className="text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Mark as Visited &amp; Verify</h3>
              <p className="text-xs text-emerald-200 truncate max-w-[280px]">{station.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Prediction vs Reality banner */}
          <div className="bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Our AI Prediction Was:</span>
              </span>
              <span className="text-[11px] font-bold text-slate-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/20">
                {predQueue} Cars • ~{predWait}m wait
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Confirm your actual experience below to help tune our arrival prediction model!
            </p>
          </div>

          {/* 1. Actual Queue Encountered */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-blue-400" /> Actual Vehicles in Line
              </label>
              <span className="text-sm font-extrabold text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-500/30">
                {actualQueue} Cars
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={actualQueue}
              onChange={(e) => setActualQueue(Number(e.target.value))}
              className="w-full accent-blue-500 bg-slate-800 cursor-pointer h-2 rounded-lg"
            />
          </div>

          {/* 2. Actual Wait Time Spent */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-amber-400" /> Actual Wait Time (Minutes)
              </label>
              <span className="text-sm font-extrabold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                {actualWait} Minutes
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="35"
              value={actualWait}
              onChange={(e) => setActualWait(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 cursor-pointer h-2 rounded-lg"
            />

            {/* Model Accuracy Feedback */}
            <div className="text-[11px] p-2 bg-[#162032] rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Model Variance:</span>
              <span
                className={`font-black ${
                  Math.abs(waitVariance) <= 3
                    ? 'text-emerald-400'
                    : Math.abs(waitVariance) <= 6
                    ? 'text-amber-400'
                    : 'text-rose-400'
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
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge size={14} className="text-emerald-400" /> Dispenser Gas Pressure
              </label>
              <span className="text-sm font-extrabold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
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
              className="w-full accent-emerald-500 bg-slate-800 cursor-pointer h-2 rounded-lg"
            />
          </div>

          {/* 4. Experience Rating */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Overall Station Experience
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 transition"
                >
                  <Star
                    size={22}
                    className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
                  />
                </button>
              ))}
              <span className="text-xs text-slate-400 ml-2 font-bold">{rating}/5 Stars</span>
            </div>
          </div>

          {/* Driver Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Driver Feedback Notes (Optional)
            </label>
            <input
              type="text"
              value={driverNotes}
              onChange={(e) => setDriverNotes(e.target.value)}
              placeholder="e.g., Quick pump operator, smooth transaction, full tank achieved..."
              className="w-full px-3 py-2 rounded-xl bg-[#162032] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitted}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
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
