"use client";

import React from "react";
import { 
  FileText, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Sparkles,
  DollarSign,
  AlertCircle,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Server,
  Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardMetricsData } from "@/lib/services";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { DashboardSkeleton } from "@/components/common/skeletons";
import { useRouter } from "next/navigation";

interface DashboardViewProps {
  metrics: DashboardMetricsData | null;
  loading: boolean;
  onRefresh: () => void;
  onAppClick: (app: string) => void;
  companyName: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  loading,
  onRefresh,
  onAppClick,
  companyName,
}) => {
  const router = useRouter();

  const formatCLP = (val: number = 0) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

  const cobrado = metrics?.ingresosMes?.cobrado || 0;
  const porCobrar = metrics?.ingresosMes?.porCobrar || 0;
  const totalMes = metrics?.ingresosMes?.total || (cobrado + porCobrar);
  const porcentajeCobro = totalMes > 0 ? Math.min(100, Math.round((cobrado / totalMes) * 100)) : 0;

  return (
    <div className="flex flex-col min-h-full px-3 py-6 sm:px-8 sm:py-10 max-w-7xl mx-auto space-y-8 sm:space-y-10">
      
      {/* 1. Header de Bienvenida & Acciones Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="h-3 w-3" /> Panel de Control Operativo
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            {companyName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Supervisión integral de clientes, proyectos, propuestas y flujo de caja en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="flex-1 sm:flex-initial rounded-xl border-white/10 hover:bg-white/5 h-10 gap-2 text-xs font-bold justify-center"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>

          <Button
            onClick={() => router.push("/prospeccion")}
            className="flex-1 sm:flex-initial rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black h-10 px-3 sm:px-4 text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition-all gap-1.5 justify-center"
          >
            <Flame className="h-4 w-4 fill-slate-950" /> Prospección
          </Button>

          <Button
            onClick={() => onAppClick("presupuestos")}
            className="w-full sm:w-auto rounded-xl bg-primary text-primary-foreground font-black h-10 px-4 text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-1.5 justify-center"
          >
            <Plus className="h-4 w-4" /> Nueva Cotización
          </Button>
        </div>
      </div>

      {/* 2. Grid de Métricas Principales en Tiempo Real */}
      {loading && !metrics ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Ingresos del Mes (Cobrado vs Por Cobrar) */}
        <Card className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Ingresos del Mes
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {formatCLP(cobrado)}
              </div>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                Cobrado efectivamente este mes
              </p>
            </div>

            {/* Barra de progreso de recaudación */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">Por cobrar: {formatCLP(porCobrar)}</span>
                <span className="text-primary">{porcentajeCobro}% recaudado</span>
              </div>
              <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#abaafd] rounded-full transition-all duration-700"
                  style={{ width: `${porcentajeCobro}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Piso Recurrente (MRR Proyectado) */}
        <Card className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                Piso Recurrente (MRR)
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Server className="h-4 w-4" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono tracking-tight">
                {formatCLP(metrics?.pisoRecurrenteMRR?.totalCLP || 0)}
              </div>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-400" />
                {metrics?.pisoRecurrenteMRR?.totalUF && metrics.pisoRecurrenteMRR.totalUF > 0 
                  ? `+ ${metrics.pisoRecurrenteMRR.totalUF.toFixed(1)} UF/mes` 
                  : "Ingreso mensual recurrente"}
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>{metrics?.pisoRecurrenteMRR?.totalSuscripcionesActivas || 0} cuentas activas</span>
              <button 
                onClick={() => router.push("/suscripciones")} 
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Ver servicios &rarr;
              </button>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Proyectos Activos por Fase */}
        <Card className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Proyectos en Ejecución
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Briefcase className="h-4 w-4" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {metrics?.totalProyectosActivos || 0}
              </div>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                Proyectos activos en curso
              </p>
            </div>

            {/* Desglose por Fases */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
              {metrics?.proyectosPorFase?.slice(0, 3).map((f) => (
                <div key={f.fase} className="p-2 rounded-xl bg-white/5 text-center">
                  <span className="block text-xs font-black text-foreground">{f.cantidad}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold truncate block">
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Alertas del Día & Seguimientos */}
        <Card className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Atención Inmediata
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <AlertCircle className="h-4 w-4" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {metrics?.alertasDelDia?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                Alertas operativas registradas hoy
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>{metrics?.totalCotizacionesPendientes || 0} cotizaciones sin cerrar</span>
              <span className="text-foreground">{metrics?.totalClientes || 0} clientes en CRM</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 3. Sección: Alertas del Día (Atención Operativa) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 text-xs font-black">
              !
            </span>
            <h2 className="text-lg font-black tracking-tight text-foreground">
              Alertas del Día y Seguimientos Comerciales
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Priorizadas por fecha y urgencia
          </span>
        </div>

        {(!metrics?.alertasDelDia || metrics.alertasDelDia.length === 0) ? (
          <div className="p-8 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 opacity-80" />
            <p className="text-sm font-bold text-foreground">Sin alertas críticas hoy</p>
            <p className="text-xs text-muted-foreground max-w-md">
              Todos los seguimientos de clientes, entregas de proyectos y cobros están al día.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.alertasDelDia.slice(0, 6).map((alerta) => {
              const isF29 = alerta.id?.startsWith("f29-") || alerta.titulo.includes("F29");
              const isUrgente = alerta.prioridad === "alta" || alerta.severidad === "alta";

              return (
                <div
                  key={alerta.id}
                  className={`p-4 rounded-2xl border backdrop-blur-xl shadow-lg flex flex-col justify-between gap-3 transition-all group ${
                    isF29 && isUrgente
                      ? "border-rose-500/50 bg-rose-950/25 shadow-rose-950/30"
                      : isF29
                      ? "border-amber-500/40 bg-amber-950/20"
                      : "border-white/10 bg-card/60 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-foreground">
                          {alerta.titulo}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {alerta.descripcion}
                      </p>
                    </div>
                    {isUrgente && (
                      <Badge variant="destructive" className="text-[9px] uppercase font-black shrink-0">
                        {isF29 ? "Crítico F29" : "Urgente"}
                      </Badge>
                    )}
                  </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    📅 {alerta.fechaRef || "Hoy"}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {alerta.telefonoWhatsApp && (
                      <WhatsAppButton
                        telefono={alerta.telefonoWhatsApp}
                        clienteNombre={alerta.titulo.split(":")[1]?.trim() || "Cliente"}
                        contexto={{
                          tipo: alerta.tipo === "presupuesto" ? "presupuesto" : "seguimiento",
                          motivo: alerta.descripcion
                        }}
                        variant="ghost"
                        size="sm"
                        buttonLabel="WhatsApp"
                        iconOnly={false}
                        className="h-8 px-2.5 text-xs rounded-xl"
                      />
                    )}
                    {alerta.enlaceAccion && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(alerta.enlaceAccion!)}
                        className="h-8 text-xs font-bold rounded-xl px-3 bg-white/10 hover:bg-white/20 text-foreground gap-1"
                      >
                        {alerta.textoAccion || "Ver"}
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
        </>
      )}

      {/* 4. Lanzador de Módulos (App Launcher) */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" /> Módulos del Sistema
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {/* Módulo Prospección Guiada */}
          <button
            onClick={() => onAppClick("prospeccion")}
            className="group p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-xl text-left hover:border-amber-400 hover:bg-amber-500/10 transition-all flex flex-col justify-between h-44 shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 shadow-lg">
                <Flame className="h-6 w-6 fill-slate-950" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-400 transition-colors" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-foreground group-hover:text-amber-400 transition-colors">
                  Prospección
                </h3>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  Racha
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sesión ágil de contactos
              </p>
            </div>
          </button>

          {/* Módulo Presupuestos */}
          <button
            onClick={() => onAppClick("presupuestos")}
            className="group p-6 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl text-left hover:border-primary/40 hover:bg-white/5 transition-all flex flex-col justify-between h-44 shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2e3c7e] to-[#abaafd] text-white shadow-lg">
                <FileText className="h-6 w-6" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                Presupuestos
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cotizaciones formales y cálculo de IVA
              </p>
            </div>
          </button>

          {/* Módulo Clientes */}
          <button
            onClick={() => onAppClick("clientes")}
            className="group p-6 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl text-left hover:border-primary/40 hover:bg-white/5 transition-all flex flex-col justify-between h-44 shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#abaafd] to-[#2e3c7e] text-white shadow-lg">
                <Users className="h-6 w-6" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                Clientes CRM
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pipeline, síntomas y notas
              </p>
            </div>
          </button>

          {/* Módulo Proyectos */}
          <button
            onClick={() => onAppClick("proyectos")}
            className="group p-6 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl text-left hover:border-primary/40 hover:bg-white/5 transition-all flex flex-col justify-between h-44 shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-[#abaafd] text-white shadow-lg">
                <Briefcase className="h-6 w-6" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                Proyectos
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hitos de pago, checklists y actas
              </p>
            </div>
          </button>

          {/* Módulo Suscripciones & Hosting */}
          <button
            onClick={() => onAppClick("suscripciones")}
            className="group p-6 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl text-left hover:border-primary/40 hover:bg-white/5 transition-all flex flex-col justify-between h-44 shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white shadow-lg">
                <Server className="h-6 w-6" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                Suscripciones
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hosting cPanel, Vercel y corte
              </p>
            </div>
          </button>

          {/* Módulo Flujo de Caja */}
          <button
            onClick={() => onAppClick("flujo-caja")}
            className="group p-6 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl text-left hover:border-primary/40 hover:bg-white/5 transition-all flex flex-col justify-between h-44 shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg">
                <TrendingUp className="h-6 w-6" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                Flujo de Caja
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Margen Bruto y costos de hosting
              </p>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
};
