"use client";

import React, { useMemo } from "react";
import { Cliente } from "@/lib/types";
import { 
  Users, 
  Flame, 
  CalendarDays, 
  Calendar, 
  Clock
} from "lucide-react";

interface ClientesMetricsProps {
  clientes: Cliente[];
}

const ClientesMetricsComponent: React.FC<ClientesMetricsProps> = ({ clientes }) => {
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Lunes de la semana actual
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Lunes, 6=Domingo
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let nuevosHoy = 0;
    let nuevosEstaSemana = 0;
    let nuevosEsteMes = 0;
    let totalProspectos = 0;
    let totalClientes = 0;

    const registrationDatesSet = new Set<string>();

    clientes.forEach((c) => {
      // Determinación de tipo de registro
      const isProspecto = c.tipo_registro === "prospecto" || c.estado === "prospecto";
      if (isProspecto) {
        totalProspectos++;
      } else {
        totalClientes++;
      }

      // Parseo seguro de fecha
      let dateObj: Date | null = null;
      if (typeof c.createdAt === "string") {
        dateObj = new Date(c.createdAt);
      } else if (c.createdAt && typeof c.createdAt === "object" && "seconds" in c.createdAt) {
        dateObj = new Date(c.createdAt.seconds * 1000);
      } else if (typeof c.updatedAt === "string") {
        dateObj = new Date(c.updatedAt);
      }

      if (dateObj && !isNaN(dateObj.getTime())) {
        const dStr = dateObj.toISOString().split("T")[0];
        registrationDatesSet.add(dStr);

        if (dStr === todayStr) {
          nuevosHoy++;
        }

        if (dateObj >= monday) {
          nuevosEstaSemana++;
        }

        if (dateObj >= startOfMonth) {
          nuevosEsteMes++;
        }
      }
    });

    // Cálculo de racha de días consecutivos
    let racha = 0;
    const rachaActivaHoy = registrationDatesSet.has(todayStr);

    const checkDate = new Date(now);
    if (!rachaActivaHoy) {
      // Si hoy no ha registrado, chequear si ayer registró para mantener racha activa
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = checkDate.toISOString().split("T")[0];
      if (registrationDatesSet.has(dStr)) {
        racha++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      nuevosHoy,
      nuevosEstaSemana,
      nuevosEsteMes,
      totalHistorico: clientes.length,
      totalProspectos,
      totalClientes,
      racha,
      rachaActivaHoy,
    };
  }, [clientes]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {/* 1. Nuevos Hoy */}
      <div className="p-4 rounded-2xl bg-card border border-white/10 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Nuevos Hoy</span>
          <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-foreground">
            {metrics.nuevosHoy}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground">
            {metrics.nuevosHoy === 1 ? "ingreso" : "ingresos"}
          </span>
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground font-medium">
          Registros en las últimas 24h
        </div>
      </div>

      {/* 2. Esta Semana */}
      <div className="p-4 rounded-2xl bg-card border border-white/10 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Esta Semana</span>
          <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-foreground">
            {metrics.nuevosEstaSemana}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground">acumulados</span>
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground font-medium">
          Desde el lunes
        </div>
      </div>

      {/* 3. Este Mes */}
      <div className="p-4 rounded-2xl bg-card border border-white/10 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Este Mes</span>
          <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-foreground">
            {metrics.nuevosEsteMes}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground">en el periodo</span>
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground font-medium">
          Cierre mensual activo
        </div>
      </div>

      {/* 4. Total Histórico Resumido */}
      <div className="p-4 rounded-2xl bg-card border border-white/10 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Total Histórico</span>
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-foreground">
            {metrics.totalHistorico}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold">
          <span className="text-amber-400">{metrics.totalProspectos} prospectos</span>
          <span className="text-muted-foreground/50">&bull;</span>
          <span className="text-emerald-400">{metrics.totalClientes} clientes</span>
        </div>
      </div>

      {/* 5. Métrica de Racha (Consecutive Days Streak) */}
      <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 shadow-sm transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-400 mb-2">
          <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500" /> Racha Diaria
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[9px]">
            {metrics.rachaActivaHoy ? "🔥 Activa hoy" : "⚡ Pendiente hoy"}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-amber-400">
            {metrics.racha}
          </span>
          <span className="text-xs font-bold text-amber-300/80">
            {metrics.racha === 1 ? "día consecutivo" : "días consecutivos"}
          </span>
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground font-medium">
          {metrics.rachaActivaHoy 
            ? "¡Excelente constancia comercial!" 
            : "¡Registra un ingreso hoy para extender tu racha!"}
        </div>
      </div>
    </div>
  );
};

export const ClientesMetrics = React.memo(ClientesMetricsComponent);
