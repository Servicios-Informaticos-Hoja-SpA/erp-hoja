import { DashboardSkeleton } from "@/components/common/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingHome() {
  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-8 sm:px-8 sm:py-10 max-w-7xl mx-auto w-full space-y-8">
      {/* Cabecera Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl bg-slate-800" />
          <Skeleton className="h-4 w-48 rounded bg-slate-800/60" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28 rounded-xl bg-slate-800" />
          <Skeleton className="h-10 w-36 rounded-xl bg-slate-800" />
        </div>
      </div>

      {/* Métricas y Alertas Skeleton */}
      <DashboardSkeleton />
    </div>
  );
}
