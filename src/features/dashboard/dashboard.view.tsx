"use client";

import React from "react";
import { 
  FileText, 
  Users, 
  Briefcase, 
  TrendingUp,
  DollarSign,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Server,
  Calendar,
  AlertTriangle,
  Clock,
  Wallet,
  ChevronRight,
  UserPlus,
  Handshake,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardMetricsData } from "@/lib/services";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { DashboardSkeleton } from "@/components/common/skeletons";
import { useRouter } from "next/navigation";
import { Cliente, Presupuesto, Proyecto, FechaRegistro } from "@/lib/types";

interface DashboardViewProps {
  metrics: DashboardMetricsData | null;
  loading: boolean;
  onRefresh: () => void;
  onAppClick: (app: string) => void;
  companyName: string;
}

const FASE_CONFIG: Record<string, { label: string; badgeClass: string; barClass: string }> = {
  planificacion: {
    label: "Planificación",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    barClass: "from-blue-600 to-cyan-400",
  },
  desarrollo: {
    label: "En Desarrollo",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    barClass: "from-amber-500 to-yellow-400",
  },
  revision_qa: {
    label: "Revisión / QA",
    badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    barClass: "from-purple-600 to-indigo-400",
  },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  loading,
  onRefresh,
  onAppClick,
  companyName,
}) => {
  const router = useRouter();

  const formatCLP = (val: number = 0) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(val);

  const formatDateShort = (val?: FechaRegistro) => {
    if (!val) return "-";
    try {
      const d = typeof val === "string" ? new Date(val) : new Date(val.seconds * 1000);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
    } catch {
      return String(val);
    }
  };

  const getDaysAgo = (val?: FechaRegistro) => {
    if (!val) return null;
    try {
      const d = typeof val === "string" ? new Date(val) : new Date(val.seconds * 1000);
      if (isNaN(d.getTime())) return null;
      const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 0) return "Hoy";
      if (diff === 1) return "Ayer";
      return `Hace ${diff}d`;
    } catch {
      return null;
    }
  };

  const cobrado = metrics?.ingresosMes?.cobrado || 0;
  const porCobrar = metrics?.ingresosMes?.porCobrar || 0;
  const totalMes = metrics?.ingresosMes?.total || (cobrado + porCobrar);
  const porcentajeCobro = totalMes > 0 ? Math.min(100, Math.round((cobrado / totalMes) * 100)) : 0;

  const contactosSinContactar = metrics?.contactosSinContactar || [];
  const totalSinContactar = metrics?.totalContactosSinContactar ?? contactosSinContactar.length;

  const presupuestosNegociacion = metrics?.presupuestosEnNegociacion || [];
  const totalNegociacion = metrics?.totalPresupuestosEnNegociacion ?? presupuestosNegociacion.length;
  const montoNegociacion = metrics?.montoTotalNegociacion ?? 0;

  const proyectosEnCurso = metrics?.proyectosEnCurso || [];
  const serviciosVencer = metrics?.serviciosRecurrentesPorVencer || [];
  const saldoCaja = metrics?.saldoCajaActual || 0;

  return (
    <div className="flex flex-col min-h-full px-3 py-6 sm:px-8 sm:py-8 max-w-7xl mx-auto space-y-7">
      
      {/* 1. Header de Bienvenida & Acciones Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {companyName}
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Resumen ejecutivo de contactos comerciales, propuestas, proyectos y servicios recurrentes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="flex-1 sm:flex-initial rounded-xl border-white/10 hover:bg-white/5 h-9 gap-1.5 text-xs font-bold justify-center"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/clientes")}
            className="flex-1 sm:flex-initial rounded-xl border-white/10 hover:bg-white/5 h-9 px-3 gap-1.5 text-xs font-bold justify-center"
          >
            <Users className="h-3.5 w-3.5 text-indigo-400" /> CRM Clientes
          </Button>

          <Button
            onClick={() => onAppClick("presupuestos")}
            className="w-full sm:w-auto rounded-xl bg-primary text-primary-foreground font-black h-9 px-3.5 text-xs shadow-md shadow-primary/20 hover:scale-[1.02] transition-all gap-1.5 justify-center"
          >
            <Plus className="h-3.5 w-3.5" /> Nueva Cotización
          </Button>
        </div>
      </div>

      {loading && !metrics ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* 2. Grid de Métricas Principales (Ultra-compacto) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Ingresos del Mes */}
            <Card className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-md p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Ingresos del Mes
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {formatCLP(cobrado)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Por cobrar: {formatCLP(porCobrar)}</span>
                  <span className="text-emerald-400 font-bold">{porcentajeCobro}%</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${porcentajeCobro}%` }}
                />
              </div>
            </Card>

            {/* KPI 2: Piso Recurrente MRR */}
            <Card className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-md p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                  Piso Recurrente (MRR)
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Server className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black text-indigo-300 font-mono tracking-tight">
                  {formatCLP(metrics?.pisoRecurrenteMRR?.totalCLP || 0)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>{metrics?.pisoRecurrenteMRR?.totalSuscripcionesActivas || 0} suscripciones</span>
                  <button 
                    onClick={() => router.push("/suscripciones")} 
                    className="text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    Ver &rarr;
                  </button>
                </div>
              </div>
              <div className="h-1.5 w-full bg-indigo-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full w-full" />
              </div>
            </Card>

            {/* KPI 3: Presupuestos en Negociación */}
            <Card className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-md p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  En Negociación
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Handshake className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {formatCLP(montoNegociacion)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>{totalNegociacion} propuestas activas</span>
                  <button 
                    onClick={() => router.push("/presupuestos")} 
                    className="text-amber-400 hover:text-amber-300 font-bold"
                  >
                    Ver &rarr;
                  </button>
                </div>
              </div>
              <div className="h-1.5 w-full bg-amber-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-3/4" />
              </div>
            </Card>

            {/* KPI 4: Contactos sin Contactar */}
            <Card className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-md p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                  Sin Contactar
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                  <UserPlus className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {totalSinContactar}
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Prospectos en espera</span>
                  <button 
                    onClick={() => router.push("/clientes")} 
                    className="text-rose-400 hover:text-rose-300 font-bold"
                  >
                    CRM &rarr;
                  </button>
                </div>
              </div>
              <div className="h-1.5 w-full bg-rose-500/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${totalSinContactar > 0 ? "bg-rose-500" : "bg-emerald-500"} rounded-full w-full`} 
                />
              </div>
            </Card>

          </div>

          {/* 3. Sección Cuadriculada Compacta (2 Columnas: Contactos sin contactar + Presupuestos en negociación) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Columna A: 5 Primeros Contactos sin Contactar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                    <UserPlus className="h-3.5 w-3.5" />
                  </span>
                  <h2 className="text-sm font-black tracking-tight text-foreground">
                    Contactos Sin Contactar
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-black border-rose-500/30 text-rose-400 bg-rose-500/5 px-2 py-0">
                    {totalSinContactar}
                  </Badge>
                </div>
                <button
                  onClick={() => router.push("/clientes")}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Ver CRM <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {contactosSinContactar.length === 0 ? (
                <div className="p-6 rounded-xl border border-white/10 bg-card/40 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-1.5 min-h-[220px]">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 opacity-80" />
                  <p className="text-xs font-bold text-foreground">¡Todo al día!</p>
                  <p className="text-[11px] text-muted-foreground max-w-xs">
                    No hay contactos pendientes de contactar. Todos los prospectos han sido abordados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {contactosSinContactar.map((cliente: Cliente) => (
                    <div
                      key={cliente.id}
                      className="p-3 rounded-xl border border-white/10 bg-card/60 hover:border-primary/40 hover:bg-card/90 transition-all flex flex-col justify-between space-y-2 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <h3 className="text-xs font-black text-foreground truncate group-hover:text-primary transition-colors">
                            {cliente.nombre}
                          </h3>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                            Sin contacto
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {cliente.contacto ? `Contacto: ${cliente.contacto}` : (cliente.ciudad || cliente.comuna || "Sin ubicación")}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[10px] text-muted-foreground">
                        <span>{getDaysAgo(cliente.createdAt) || "Pendiente"}</span>
                        <div className="flex items-center gap-1">
                          {cliente.telefono && (
                            <WhatsAppButton
                              telefono={cliente.telefono}
                              clienteNombre={cliente.nombre}
                              contexto={{
                                tipo: "seguimiento",
                                motivo: "Primer contacto comercial desde Hoja SpA",
                              }}
                              variant="ghost"
                              size="sm"
                              iconOnly
                              className="h-6 w-6 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/clientes?id=${cliente.id}`)}
                            className="h-6 px-1.5 text-[10px] font-bold rounded-lg text-primary hover:bg-primary/10"
                          >
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Columna B: 5 Primeros Presupuestos en Negociación */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <Handshake className="h-3.5 w-3.5" />
                  </span>
                  <h2 className="text-sm font-black tracking-tight text-foreground">
                    Presupuestos en Negociación
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-black border-amber-500/30 text-amber-400 bg-amber-500/5 px-2 py-0">
                    {totalNegociacion}
                  </Badge>
                </div>
                <button
                  onClick={() => router.push("/presupuestos")}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Ver Cotizaciones <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {presupuestosNegociacion.length === 0 ? (
                <div className="p-6 rounded-xl border border-white/10 bg-card/40 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-1.5 min-h-[220px]">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/60" />
                  <p className="text-xs font-bold text-foreground">Sin presupuestos en negociación</p>
                  <p className="text-[11px] text-muted-foreground max-w-xs">
                    No hay propuestas actualmente en etapa de negociación con clientes.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {presupuestosNegociacion.map((p: Presupuesto) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl border border-white/10 bg-card/60 hover:border-amber-500/40 hover:bg-card/90 transition-all flex flex-col justify-between space-y-2 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-[10px] font-black text-amber-400 font-mono">
                            COT-{p.numero}
                          </span>
                          <span className="text-xs font-black text-foreground">
                            {formatCLP(p.totales?.total || p.totales?.neto)}
                          </span>
                        </div>
                        <h3 className="text-xs font-black text-foreground truncate group-hover:text-amber-400 transition-colors">
                          {p.cliente_nombre}
                        </h3>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {p.nombre_proyecto || p.descripcion_proyecto || "Servicios profesionales"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[10px] text-muted-foreground">
                        <span>{formatDateShort(p.fecha)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push("/presupuestos")}
                          className="h-6 px-1.5 text-[10px] font-bold rounded-lg text-amber-400 hover:bg-amber-500/10"
                        >
                          Ver Cotización &rarr;
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* 4. Sección: Proyectos en Marcha (A lo largo de la pantalla, pero cuadrado cada proyecto, máx 3) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Briefcase className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-sm font-black tracking-tight text-foreground">
                  Proyectos en Marcha (Planificación, Desarrollo y QA)
                </h2>
                <Badge variant="outline" className="text-[10px] font-black border-primary/30 text-primary bg-primary/5 px-2 py-0">
                  {metrics?.totalProyectosEnCurso || proyectosEnCurso.length} activos
                </Badge>
              </div>
              <button
                onClick={() => router.push("/proyectos")}
                className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                Ver todos los proyectos <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {proyectosEnCurso.length === 0 ? (
              <div className="p-6 rounded-xl border border-white/10 bg-card/40 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-1.5">
                <Briefcase className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-xs font-bold text-foreground">No hay proyectos activos en estas fases</p>
                <p className="text-[11px] text-muted-foreground max-w-sm">
                  Crea o aprueba presupuestos para iniciar proyectos en planificación o desarrollo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {proyectosEnCurso.map((proy: Proyecto) => {
                  const faseInfo = FASE_CONFIG[proy.fase] || {
                    label: proy.fase,
                    badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
                    barClass: "from-slate-600 to-slate-400",
                  };

                  // Cálculo de progreso estimado
                  let progreso = proy.progresoPorcentaje || 0;
                  if (!progreso && Array.isArray(proy.hitosPago) && proy.hitosPago.length > 0) {
                    const cobrados = proy.hitosPago.filter(h => h.estado === "cobrado").length;
                    progreso = Math.round((cobrados / proy.hitosPago.length) * 100);
                  }
                  if (!progreso) {
                    progreso = proy.fase === "planificacion" ? 25 : proy.fase === "desarrollo" ? 60 : 90;
                  }

                  const entregaComp = proy.fechaEntregaComprometida ? new Date(proy.fechaEntregaComprometida) : null;
                  const diffDias = entregaComp ? Math.ceil((entregaComp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                  return (
                    <div
                      key={proy.id}
                      className="p-4 rounded-xl border border-white/10 bg-card/60 backdrop-blur-xl hover:border-primary/40 hover:bg-card/90 transition-all flex flex-col justify-between space-y-3 group shadow-md"
                    >
                      {/* Cabecera del Proyecto: Fase + Monto */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${faseInfo.badgeClass}`}>
                          {faseInfo.label}
                        </span>
                        <span className="text-xs font-black text-foreground font-mono">
                          {formatCLP(proy.montos?.total)}
                        </span>
                      </div>

                      {/* Título y Cliente */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                          {proy.nombre}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 truncate">
                          <Users className="h-3 w-3 shrink-0" /> {proy.clienteNombre}
                        </p>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="space-y-1.5 pt-1 border-t border-white/5">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="text-foreground">{progreso}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${faseInfo.barClass} rounded-full transition-all duration-500`}
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                      </div>

                      {/* Fecha de Entrega y Acción */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {entregaComp 
                              ? `${formatDateShort(proy.fechaEntregaComprometida)} ${diffDias !== null ? `(${diffDias >= 0 ? `${diffDias}d` : "Vencido"})` : ""}`
                              : "Sin fecha fija"}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/proyectos?id=${proy.id}`)}
                          className="h-7 px-2 text-xs font-bold rounded-lg text-primary hover:bg-primary/10 gap-1"
                        >
                          Ver &rarr;
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Sección: Servicios Recurrentes por Vencer & Cruce con Flujo de Caja */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Server className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-sm font-black tracking-tight text-foreground">
                  Servicios Recurrentes por Vencer & Cruce de Liquidez
                </h2>
              </div>
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                  Saldo en Caja: <strong className="text-foreground">{formatCLP(saldoCaja)}</strong>
                </span>
                <button
                  onClick={() => router.push("/suscripciones")}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  Ver Módulo <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {serviciosVencer.length === 0 ? (
              <div className="p-6 rounded-xl border border-white/10 bg-card/40 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-1.5">
                <Server className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-xs font-bold text-foreground">Sin servicios próximos a vencer</p>
                <p className="text-[11px] text-muted-foreground max-w-sm">
                  Todos los dominios, hostings y servicios SaaS están al día en sus pagos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {serviciosVencer.map((sub) => {
                  const esVencido = sub.diasRestantes < 0;
                  const esHoy = sub.diasRestantes === 0;

                  return (
                    <div
                      key={sub.id || sub.nombre}
                      className="p-3.5 rounded-xl border border-white/10 bg-card/60 backdrop-blur-xl hover:border-indigo-500/40 hover:bg-card/90 transition-all flex flex-col justify-between space-y-2.5 shadow-sm"
                    >
                      {/* Proveedor y Costo */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400">
                            {sub.proveedor}
                          </span>
                          <h4 className="text-xs font-black text-foreground truncate">
                            {sub.nombre}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-foreground font-mono block">
                            {formatCLP(sub.costoCLP)}
                          </span>
                          {sub.moneda === "UF" && (
                            <span className="text-[9px] text-muted-foreground">
                              {sub.monto} UF
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fecha de Corte y Vencimiento */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Corte: {formatDateShort(sub.fechaCorte)}
                        </span>
                        <Badge 
                          variant={esVencido ? "destructive" : "outline"}
                          className={`text-[9px] font-bold px-1.5 py-0 ${
                            esVencido 
                              ? "" 
                              : esHoy 
                              ? "border-amber-500/30 text-amber-400 bg-amber-500/10" 
                              : "border-white/10 text-muted-foreground"
                          }`}
                        >
                          {esVencido ? `Venció hace ${Math.abs(sub.diasRestantes)}d` : esHoy ? "Vence HOY" : `En ${sub.diasRestantes} días`}
                        </Badge>
                      </div>

                      {/* Cruce con Flujo de Caja */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                        {sub.cubiertoConFlujo ? (
                          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            <Check className="h-3 w-3" />
                            <span>Cubierto con caja actual</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Faltan {formatCLP(sub.diferenciaFlujoCLP)}</span>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push("/suscripciones")}
                          className="h-6 px-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                        >
                          Pagar &rarr;
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* 6. Lanzador de Módulos (Compacto y Elegante) */}
      <div className="space-y-3 pt-3">
        <h2 className="text-xs font-black tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5 text-primary" /> Módulos del Sistema
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Módulo 1: Clientes CRM */}
          <button
            onClick={() => onAppClick("clientes")}
            className="p-4 rounded-xl border border-white/10 bg-card/50 hover:border-indigo-500/50 hover:bg-card/90 transition-all flex flex-col justify-between h-36 text-left group shadow-sm hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                <Users className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                CRM & Matriz
              </span>
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-foreground group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                Clientes CRM
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                Prospectos, matriz operativa de servicios (web/correos) y tickets.
              </p>
            </div>
            <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
              <span>{metrics?.totalClientes || 0} registrados</span>
              {totalSinContactar > 0 && (
                <span className="text-rose-400 font-black">{totalSinContactar} sin contactar</span>
              )}
            </div>
          </button>

          {/* Módulo 2: Presupuestos */}
          <button
            onClick={() => onAppClick("presupuestos")}
            className="p-4 rounded-xl border border-white/10 bg-card/50 hover:border-blue-500/50 hover:bg-card/90 transition-all flex flex-col justify-between h-36 text-left group shadow-sm hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20">
                <FileText className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                Cotizaciones
              </span>
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-foreground group-hover:text-blue-400 transition-colors flex items-center justify-between">
                Presupuestos
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                Propuestas comerciales, anticipos (50/50), IVA y servicios de continuidad.
              </p>
            </div>
            <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
              <span>{metrics?.totalCotizacionesPendientes || 0} pendientes</span>
              {totalNegociacion > 0 && (
                <span className="text-amber-400 font-black">{totalNegociacion} en negociación</span>
              )}
            </div>
          </button>

          {/* Módulo 3: Proyectos */}
          <button
            onClick={() => onAppClick("proyectos")}
            className="p-4 rounded-xl border border-white/10 bg-card/50 hover:border-purple-500/50 hover:bg-card/90 transition-all flex flex-col justify-between h-36 text-left group shadow-sm hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/20">
                <Briefcase className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                ISO 9001
              </span>
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-foreground group-hover:text-purple-400 transition-colors flex items-center justify-between">
                Proyectos
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                Hitos de cobro, flujo Kanban, cartas Gantt, actas de entrega y cambios.
              </p>
            </div>
            <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
              <span>{metrics?.totalProyectosActivos || 0} activos</span>
              <span className="text-purple-400 font-black">{metrics?.totalProyectosEnCurso || proyectosEnCurso.length} en curso</span>
            </div>
          </button>

          {/* Módulo 4: Servicios Recurrentes */}
          <button
            onClick={() => onAppClick("suscripciones")}
            className="p-4 rounded-xl border border-white/10 bg-card/50 hover:border-cyan-500/50 hover:bg-card/90 transition-all flex flex-col justify-between h-36 text-left group shadow-sm hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                <Server className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                MRR / Infra
              </span>
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-foreground group-hover:text-cyan-400 transition-colors flex items-center justify-between">
                Servicios Recurrentes
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                Hosting cPanel, Vercel, dominios NIC Chile, SaaS y fechas de renovación.
              </p>
            </div>
            <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
              <span>{metrics?.pisoRecurrenteMRR?.totalSuscripcionesActivas || 0} cuentas</span>
              {serviciosVencer.length > 0 && (
                <span className="text-cyan-400 font-black">{serviciosVencer.length} por vencer</span>
              )}
            </div>
          </button>

          {/* Módulo 5: Flujo de Caja */}
          <button
            onClick={() => onAppClick("flujo-caja")}
            className="p-4 rounded-xl border border-white/10 bg-card/50 hover:border-emerald-500/50 hover:bg-card/90 transition-all flex flex-col justify-between h-36 text-left group shadow-sm hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Finanzas
              </span>
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-foreground group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                Flujo de Caja
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                Margen bruto operativo, control de ingresos/egresos y calendario F29 SII.
              </p>
            </div>
            <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
              <span>Margen: {metrics?.margenBrutoMes?.porcentaje ?? 0}%</span>
              <span className="text-emerald-400 font-black">{formatCLP(saldoCaja)}</span>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
};
