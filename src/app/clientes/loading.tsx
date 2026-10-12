import { ClientesListSkeleton } from "@/components/common/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingClientes() {
  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-8 sm:px-8 sm:py-10 max-w-7xl mx-auto w-full space-y-6">
      {/* Cabecera Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-11 w-11 rounded-xl bg-slate-800" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-xl bg-slate-800" />
            <Skeleton className="h-4 w-64 rounded bg-slate-800/60" />
          </div>
        </div>
        <Skeleton className="h-11 w-40 rounded-xl bg-slate-800" />
      </div>

      {/* Buscador Skeleton */}
      <Skeleton className="h-12 w-full rounded-xl bg-slate-800/70" />

      {/* Clientes List Skeleton */}
      <ClientesListSkeleton count={3} />
    </div>
  );
}
