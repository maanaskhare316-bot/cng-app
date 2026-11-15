import React, { useState } from 'react';
import { X } from 'lucide-react';

const DemoBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-between gap-3
                 bg-amber-50 border-b border-amber-300 px-4 py-2"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-amber-600 flex-shrink-0 text-base" aria-hidden="true">
          ⚠️
        </span>
        <p className="text-xs sm:text-sm font-medium text-amber-800 truncate">
          <span className="font-bold">DEMO MODE</span>
          {' '}— All data is simulated. Not for real-world navigation.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss demo banner"
        className="flex-shrink-0 p-1 rounded-md text-amber-600 hover:text-amber-900
                   hover:bg-amber-200 transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  );
};

export default DemoBanner;
