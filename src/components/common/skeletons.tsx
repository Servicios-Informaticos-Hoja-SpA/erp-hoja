import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Esqueleto realista para el listado de Cotizaciones / Presupuestos
 */
export const PresupuestosListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4 w-full animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, idx) => (
        <Card
          key={`presupuesto-skeleton-${idx}`}
          className="rounded-2xl border-2 border-slate-800 bg-slate-900/60 shadow-lg overflow-hidden"
        >
          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Cabecera de la tarjeta: N°, Estado, Fecha y Monto */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-7 w-24 rounded-xl bg-slate-800" />
                <Skeleton className="h-7 w-32 rounded-xl bg-slate-800/80" />
                <Skeleton className="h-5 w-28 rounded-md bg-slate-800/60" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-28 rounded bg-slate-800/60" />
                <Skeleton className="h-8 w-36 rounded-xl bg-slate-800" />
              </div>
            </div>

            {/* Contenido Central: Cliente y Descripción */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-2.5">
                <Skeleton className="h-6 w-2/3 rounded-lg bg-slate-800" />
                <Skeleton className="h-4 w-1/2 rounded bg-slate-800/70" />
                <div className="flex items-center gap-2 pt-1">
                  <Skeleton className="h-5 w-20 rounded-md bg-slate-800/50" />
                  <Skeleton className="h-5 w-32 rounded-md bg-slate-800/50" />
                </div>
              </div>
              <div className="md:col-span-4 space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <Skeleton className="h-3.5 w-24 rounded bg-slate-800/60" />
                <Skeleton className="h-4 w-3/4 rounded bg-slate-800/80" />
                <Skeleton className="h-4 w-1/2 rounded bg-slate-800/60" />
              </div>
            </div>

            {/* Barra de Acciones Inferior */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-28 rounded-xl bg-slate-800" />
                <Skeleton className="h-10 w-24 rounded-xl bg-slate-800/70" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-24 rounded-xl bg-slate-800/80" />
                <Skeleton className="h-10 w-28 rounded-xl bg-slate-800" />
                <Skeleton className="h-10 w-10 rounded-xl bg-slate-800/60" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * Esqueleto realista para la vista de Dashboard (Métricas + Alertas)
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 w-full animate-in fade-in duration-300">
      {/* Grid de 3 Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((k) => (
          <Card key={k} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded bg-slate-800/80" />
              <Skeleton className="h-8 w-8 rounded-xl bg-slate-800" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-44 rounded-lg bg-slate-800" />
              <Skeleton className="h-4 w-32 rounded bg-slate-800/60" />
            </div>
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24 rounded bg-slate-800/50" />
                <Skeleton className="h-3 w-16 rounded bg-slate-800/50" />
              </div>
              <Skeleton className="h-2 w-full rounded-full bg-slate-800/60" />
            </div>
          </Card>
        ))}
      </div>

      {/* Alertas Operativas */}
      <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44 rounded bg-slate-800" />
          <Skeleton className="h-4 w-20 rounded bg-slate-800/60" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl bg-slate-800/70" />
          <Skeleton className="h-16 w-full rounded-xl bg-slate-800/70" />
        </div>
      </Card>
    </div>
  );
};

/**
 * Esqueleto para el listado de Clientes
 */
export const ClientesListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid gap-6 w-full animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={`cliente-skeleton-${idx}`} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Card className="lg:col-span-8 border border-slate-800 bg-slate-900/60 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-5">
              <Skeleton className="h-16 w-16 rounded-2xl bg-slate-800 shrink-0" />
              <div className="space-y-2.5 flex-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-48 rounded-lg bg-slate-800" />
                  <Skeleton className="h-6 w-24 rounded-full bg-slate-800/70" />
                </div>
                <Skeleton className="h-4 w-28 rounded bg-slate-800/60" />
                <div className="flex flex-wrap gap-2 pt-1">
                  <Skeleton className="h-6 w-36 rounded-md bg-slate-800/50" />
                  <Skeleton className="h-6 w-32 rounded-md bg-slate-800/50" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Skeleton className="h-4 w-32 rounded bg-slate-800/60" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-xl bg-slate-800" />
                <Skeleton className="h-9 w-24 rounded-xl bg-slate-800" />
              </div>
            </div>
          </Card>
          <Card className="lg:col-span-4 border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-4">
            <Skeleton className="h-5 w-32 rounded bg-slate-800" />
            <Skeleton className="h-16 w-full rounded-xl bg-slate-800/60" />
            <Skeleton className="h-8 w-full rounded-xl bg-slate-800/80" />
          </Card>
        </div>
      ))}
    </div>
  );
};

/**
 * Esqueleto para el listado de Proyectos
 */
export const ProyectosListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4 w-full animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, idx) => (
        <Card
          key={`proyecto-skeleton-${idx}`}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-48 rounded-lg bg-slate-800" />
                <Skeleton className="h-6 w-24 rounded-full bg-slate-800/70" />
              </div>
              <Skeleton className="h-4 w-36 rounded bg-slate-800/60" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right space-y-1">
                <Skeleton className="h-3 w-16 rounded ml-auto bg-slate-800/60" />
                <Skeleton className="h-6 w-28 rounded bg-slate-800" />
              </div>
              <Skeleton className="h-9 w-9 rounded-xl bg-slate-800" />
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-32 rounded bg-slate-800/60" />
              <Skeleton className="h-3.5 w-12 rounded bg-slate-800/60" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full bg-slate-800/70" />
          </div>
        </Card>
      ))}
    </div>
  );
};

/**
 * Esqueleto para la vista de Flujo de Caja
 */
export const FlujoCajaListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-4 w-full animate-in fade-in duration-300">
      {/* Resumen Superior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((k) => (
          <Card key={k} className="p-5 border border-slate-800 bg-slate-900/60 rounded-2xl space-y-3">
            <Skeleton className="h-4 w-24 rounded bg-slate-800/70" />
            <Skeleton className="h-7 w-36 rounded-lg bg-slate-800" />
          </Card>
        ))}
      </div>

      {/* Filas de Movimientos */}
      <div className="space-y-3 pt-2">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={`flujo-skeleton-${idx}`}
            className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-lg bg-slate-800 shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-48 rounded bg-slate-800" />
                <Skeleton className="h-3.5 w-32 rounded bg-slate-800/60" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24 rounded-lg bg-slate-800" />
              <Skeleton className="h-8 w-20 rounded-xl bg-slate-800/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Esqueleto para la vista de Prospección Comercial Guiada
 */
export const ProspeccionSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 w-full animate-in fade-in duration-300">
      {/* Header Banner & Streak Skeleton */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-44 rounded-full bg-slate-800" />
          <Skeleton className="h-9 w-72 rounded-xl bg-slate-800" />
          <Skeleton className="h-4 w-96 rounded bg-slate-800/60" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-32 rounded-2xl bg-slate-800" />
          <Skeleton className="h-12 w-44 rounded-2xl bg-slate-800" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5 border border-slate-800 bg-slate-900/60 rounded-2xl space-y-3">
            <Skeleton className="h-4 w-28 rounded bg-slate-800/70" />
            <Skeleton className="h-8 w-20 rounded-lg bg-slate-800" />
            <Skeleton className="h-3.5 w-36 rounded bg-slate-800/50" />
          </Card>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
          <Skeleton className="h-6 w-48 rounded bg-slate-800" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40 rounded bg-slate-800" />
                  <Skeleton className="h-3.5 w-28 rounded bg-slate-800/60" />
                </div>
                <Skeleton className="h-8 w-24 rounded-lg bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
          <Skeleton className="h-6 w-36 rounded bg-slate-800" />
          <div className="space-y-3">
            {[1, 2, 3].map((k) => (
              <div key={k} className="p-3 rounded-xl border border-slate-800/60 bg-slate-950/30 space-y-2">
                <Skeleton className="h-4 w-32 rounded bg-slate-800" />
                <Skeleton className="h-3 w-20 rounded bg-slate-800/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
