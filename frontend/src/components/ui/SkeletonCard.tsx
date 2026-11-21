import React from 'react';

export const StationCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-[14px] p-5 border border-[#E3EAF0] bg-white shadow-sm animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-[#E3EAF0] rounded-md" />
        <div className="h-4 w-14 bg-[#E3EAF0] rounded-md" />
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="h-5 w-44 bg-[#E3EAF0] rounded-md" />
        <div className="h-3.5 w-32 bg-[#F4F7FA] rounded-md" />
      </div>

      <div className="grid grid-cols-2 gap-2 bg-[#F4F7FA] p-3 rounded-xl border border-[#E3EAF0] my-2">
        <div className="space-y-1">
          <div className="h-2.5 w-16 bg-[#E3EAF0] rounded" />
          <div className="h-4 w-20 bg-[#E3EAF0] rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-2.5 w-16 bg-[#E3EAF0] rounded" />
          <div className="h-4 w-20 bg-[#E3EAF0] rounded" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#E3EAF0]">
        <div className="h-4 w-16 bg-[#E3EAF0] rounded" />
        <div className="h-7 w-24 bg-[#E3EAF0] rounded-xl" />
      </div>
    </div>
  );
};

export const RouteResultsSkeleton: React.FC = () => {
  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-pulse">
      <div className="h-10 w-64 bg-[#E3EAF0] rounded-xl" />
      <div className="h-48 w-full bg-white border border-[#E3EAF0] rounded-[14px]" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 h-96 bg-white border border-[#E3EAF0] rounded-[14px]" />
        <div className="lg:col-span-5 space-y-3">
          <StationCardSkeleton />
          <StationCardSkeleton />
        </div>
      </div>
    </div>
  );
};

export default StationCardSkeleton;
