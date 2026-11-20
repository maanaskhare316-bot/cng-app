import React, { useState } from 'react';
import { X, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import type { StationSummaryDto, IncorrectInfoFlagPayload } from '../../types';

interface ReportIncorrectModalProps {
  isOpen: boolean;
  station: StationSummaryDto | null;
  onClose: () => void;
  onSubmitFlag: (payload: IncorrectInfoFlagPayload) => void;
}

export const ReportIncorrectModal: React.FC<ReportIncorrectModalProps> = ({
  isOpen,
  station,
  onClose,
  onSubmitFlag,
}) => {
  if (!isOpen || !station) return null;

  const [issueType, setIssueType] = useState<IncorrectInfoFlagPayload['issueType']>('CLOSED');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitFlag({
      stationId: station.id,
      issueType,
      comment: comment.trim() || undefined,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 max-w-md w-full overflow-hidden text-slate-100">
        {/* Header */}
        <div className="bg-red-950/80 border-b border-red-500/30 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-500/20 text-red-400 rounded-xl">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Report Incorrect Information</h3>
              <p className="text-xs text-red-200 truncate max-w-[240px]">{station.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Help keep highway telemetry accurate. Flag discrepancies between the app and the actual station.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              What is incorrect?
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'CLOSED', label: 'Station is physically closed or blocked' },
                { id: 'NO_CNG', label: 'CNG is completely out of stock / dry' },
                { id: 'LONG_QUEUE', label: 'Vehicle queue is substantially longer than reported' },
                { id: 'LOW_PRESSURE', label: 'Gas pressure is far below reported reading' },
                { id: 'WRONG_LOCATION', label: 'Map pin or address is inaccurate' },
                { id: 'OTHER', label: 'Other issue or amenity missing' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    issueType === opt.id
                      ? 'bg-red-950/40 border-red-500/50 text-white font-bold'
                      : 'bg-[#162032] border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="issueType"
                    checked={issueType === opt.id}
                    onChange={() => setIssueType(opt.id as any)}
                    className="accent-red-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Additional Details (Optional)
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide any details to help verify..."
              className="w-full px-3 py-2 rounded-xl bg-[#162032] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitted}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitted ? (
                <>
                  <CheckCircle size={15} /> Flag Submitted
                </>
              ) : (
                <>
                  <Send size={15} /> Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncorrectModal;
