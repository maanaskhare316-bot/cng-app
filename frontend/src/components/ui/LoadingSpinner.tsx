import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-[3px]',
  lg: 'w-16 h-16 border-4',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'md',
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={[
          sizeMap[size],
          'rounded-full border-slate-200 border-t-emerald-500 animate-spin',
        ].join(' ')}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-sm text-slate-500 font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
