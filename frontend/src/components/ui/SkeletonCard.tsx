import React from 'react';

export const StationCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl sm:rounded-3xl p-5 border border-slate-800 bg-[#111827] shadow-lg animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-slate-800 rounded-md" />
        <div className="h-4 w-14 bg-slate-800 rounded-md" />
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="h-5 w-44 bg-slate-800 rounded-md" />
        <div className="h-3.5 w-32 bg-slate-800/60 rounded-md" />
      </div>

      <div className="grid grid-cols-2 gap-2 bg-[#0c1220] p-3 rounded-xl border border-slate-800/80 my-2">
        <div className="space-y-1">
          <div className="h-2.5 w-16 bg-slate-800 rounded" />
          <div className="h-4 w-20 bg-slate-800 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-2.5 w-16 bg-slate-800 rounded" />
          <div className="h-4 w-20 bg-slate-800 rounded" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <div className="h-4 w-16 bg-slate-800 rounded" />
        <div className="h-7 w-24 bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
};

export const RouteResultsSkeleton: React.FC = () => {
  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-pulse">
      <div className="h-10 w-64 bg-slate-800 rounded-xl" />
      <div className="h-48 w-full bg-[#111827] border border-slate-800 rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 h-96 bg-[#111827] border border-slate-800 rounded-3xl" />
        <div className="lg:col-span-5 space-y-3">
          <StationCardSkeleton />
          <StationCardSkeleton />
        </div>
      </div>
    </div>
  );
};

export default StationCardSkeleton;
