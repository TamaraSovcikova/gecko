import { type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md bg-purple-200/60 animate-shimmer", className)}
      {...props}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-purple-200 rounded-lg p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white border border-purple-200 rounded-lg p-5">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
        <div className="bg-white border border-purple-200 rounded-lg p-5">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonDashboard };
