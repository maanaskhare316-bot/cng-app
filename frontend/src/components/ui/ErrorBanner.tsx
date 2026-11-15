import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3',
        className,
      ].join(' ')}
    >
      <AlertTriangle
        size={18}
        className="text-red-500 flex-shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-700">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold
                     text-red-600 hover:text-red-800 hover:bg-red-100 px-2.5 py-1
                     rounded-md transition-colors"
        >
          <RefreshCw size={13} />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
