"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Flame, 
  Target, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Phone, 
  CheckCircle2, 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  ExternalLink, 
  Copy, 
  Check, 
  BarChart2, 
  Award, 
  Sparkles, 
  ArrowUpRight,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Prospect, 
  ProspectEstado, 
  ProspectSintoma, 
  ProspectingSession, 
  UserStreak 
} from "@/lib/types";
import { 
  getProspeccionData, 
  updateProspectEstado, 
  ProspeccionStatsResponse 
} from "@/lib/services";
import { useAuth } from "@/context/auth-context";
import { SessionModal } from "./session-modal";
import { ProspeccionSkeleton } from "@/components/common/skeletons";
import { toast } from "sonner";

export function ProspeccionView() {
  const { user } = useAuth();
  const userId = user?.uid || "hoja-operador-principal";

  const [data, setData] = useState<ProspeccionStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<"dia" | "semana" | "mes">("dia");
  
  // Filtros de tabla de prospectos
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroSintoma, setFiltroSintoma] = useState<string>("todos");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProspeccionData(userId);
      setData(res);
    } catch (error) {
      console.error("Error al cargar datos de prospección:", error);
      toast.error("Error al cargar estadísticas de prospección");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (prospectId: string, nuevoEstado: ProspectEstado) => {
    try {
      setUpdatingId(prospectId);
      await updateProspectEstado(prospectId, nuevoEstado);
      
      // Actualización optimista local
      if (data) {
        const updatedProspects = data.prospects.map((p) =>
          p.id === prospectId ? { ...p, estado: nuevoEstado } : p
        );
        setData({
          ...data,
          prospects: updatedProspects,
        });
      }
      toast.success(`Estado actualizado a: ${nuevoEstado}`);
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el estado");
    } finally {
      setUpdatingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Mensaje copiado al portapapeles");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const streak = data?.streak || {
    userId,
    rachaActual: 0,
    rachaMaxima: 0,
    ultimoDiaActivo: "",
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const prospectedToday = streak.ultimoDiaActivo === todayStr;

  // Filtrado de prospectos
  const filteredProspects = (data?.prospects || []).filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.nombreNegocio.toLowerCase().includes(q) ||
      (p.telefono || "").includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.sintoma || "").toLowerCase().includes(q);
    const matchesEstado =
      filtroEstado === "todos" || p.estado === filtroEstado;
    const matchesSintoma =
      filtroSintoma === "todos" || p.sintoma === filtroSintoma;

    return matchesSearch && matchesEstado && matchesSintoma;
  });

  const getEstadoBadge = (estado: ProspectEstado) => {
    switch (estado) {
      case "por_contactar":
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[11px] font-bold">⏳ Por Contactar</Badge>;
      case "contactado":
        return <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 text-[11px] font-bold">📞 Contactado</Badge>;
      case "respondio":
        return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[11px] font-bold">💬 Respondió</Badge>;
      case "cotizado":
        return <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[11px] font-bold">📄 Cotizado</Badge>;
      case "cerrado":
        return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px] font-bold">🏆 Cerrado</Badge>;
      case "descartado":
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-[11px] font-bold">❌ Descartado</Badge>;
      default:
        return <Badge className="bg-slate-700 text-slate-300 text-[11px] font-bold">{estado}</Badge>;
    }
  };

  const formatMinutos = (mins: number) => {
    if (!mins || mins === 0) return "0 min";
    if (mins < 1) return "< 1 min";
    return `${Math.round(mins * 10) / 10} min`;
  };

  const formatFechaContacto = (fecha?: string) => {
    if (!fecha) return "Hoy";
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return String(fecha);
      return d.toLocaleString("es-CL", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(fecha);
    }
  };

  const formatFechaSesion = (fecha?: string) => {
    if (!fecha) return "Reciente";
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return String(fecha);
      return d.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(fecha);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-3 py-6 sm:px-8 sm:py-10 max-w-7xl mx-auto space-y-8 sm:space-y-10">
      
      {/* 1. Header Hero con Gamificación de Racha y Botón de Inicio */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-black uppercase tracking-wider">
                <Target className="h-3.5 w-3.5" /> Sesión Guiada de Prospección
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
                Sin límite de tiempo • Enfoque en meta
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Acelera tus Contactos Comerciales
            </h1>
            <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
              Inicia una sesión de prospección ágil y sin presión de tiempo. Diagnostica síntomas frecuentes, personaliza la plantilla comercial de Hoja SpA y contacta por WhatsApp en segundos.
            </p>
          </div>

          {/* Gamificación: Racha Diaria + Botón Acción */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:self-center">
            {/* Tarjeta de Racha */}
            <div className="flex items-center gap-4 bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 px-5 shadow-lg backdrop-blur-sm">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Flame className={`h-7 w-7 text-amber-400 ${streak.rachaActual > 0 ? "animate-bounce" : ""}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-amber-300">
                    {streak.rachaActual} {streak.rachaActual === 1 ? "Día" : "Días"}
                  </span>
                  {prospectedToday ? (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Activa Hoy
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Pendiente
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Récord: <span className="font-bold text-slate-200">{streak.rachaMaxima} días</span> consecutivos
                </div>
              </div>
            </div>

            {/* Botón Principal de Iniciar Sesión */}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-16 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all gap-3"
            >
              <Target className="h-5 w-5" />
              <span>Iniciar Sesión</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Panel de Estadísticas con Selector (Día / Semana / Mes) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <BarChart2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-black text-white">Métricas de Prospección</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs de Filtro Temporal */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setStatsPeriod("dia")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statsPeriod === "dia"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Día (Hoy)
              </button>
              <button
                onClick={() => setStatsPeriod("semana")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statsPeriod === "semana"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setStatsPeriod("mes")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statsPeriod === "mes"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Mes
              </button>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={loadData}
              disabled={loading}
              className="rounded-xl border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {loading && !data ? (
          <ProspeccionSkeleton />
        ) : (
          <>
            {/* Vista 1: Estadísticas del DÍA */}
            {statsPeriod === "dia" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
                <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Contactos Realizados Hoy</span>
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {data?.stats?.dia?.contactosHoy || 0}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {data?.stats?.dia?.contactosHoy && data.stats.dia.contactosHoy >= 3 ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Meta mínima sugerida alcanzada
                      </span>
                    ) : (
                      <span className="text-amber-400">Objetivo sugerido: 3 contactos</span>
                    )}
                  </div>
                </Card>

                <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Tiempo Total Dedicado</span>
                    <Clock className="h-4 w-4 text-sky-400" />
                  </div>
                  <div className="text-3xl font-black text-sky-300">
                    {formatMinutos(data?.stats?.dia?.tiempoMinutosTotal || 0)}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    Medido en segundo plano durante sesiones
                  </div>
                </Card>

                <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Promedio por Contacto</span>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-300">
                    {formatMinutos(data?.stats?.dia?.promedioMinutosPorContacto || 0)}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    Ritmo de ejecución por prospecto
                  </div>
                </Card>

                <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Estado de Racha Diaria</span>
                    <Flame className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-300">
                    {prospectedToday ? "Completada 🔥" : "Pendiente ⚡"}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {prospectedToday
                      ? "Mantienes tu racha activa para hoy"
                      : "Haz 1 sesión para avanzar la racha"}
                  </div>
                </Card>
              </div>
            )}

            {/* Vista 2: Estadísticas de la SEMANA (Gráfico de Barras Simple) */}
            {statsPeriod === "semana" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1">
                    <span className="text-xs text-slate-400 font-medium">Total Contactos de la Semana</span>
                    <div className="text-3xl font-black text-primary">
                      {data?.stats?.semana?.totalContactos || 0}
                    </div>
                  </Card>
                  <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1">
                    <span className="text-xs text-slate-400 font-medium">Respuestas Recibidas</span>
                    <div className="text-3xl font-black text-amber-400">
                      {data?.stats?.semana?.totalRespuestas || 0}
                    </div>
                  </Card>
                  <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1">
                    <span className="text-xs text-slate-400 font-medium">Tasa de Respuesta Semanal</span>
                    <div className="text-3xl font-black text-emerald-400">
                      {data?.stats?.semana?.totalContactos
                        ? `${Math.round(
                            ((data.stats.semana.totalRespuestas || 0) /
                              data.stats.semana.totalContactos) *
                              100
                          )}%`
                        : "0%"}
                    </div>
                  </Card>
                </div>

                {/* Gráfico de barras Lunes a Domingo */}
                <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Desglose Semanal (Lunes a Domingo)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Comparación de prospectos contactados vs. respuestas recibidas por día.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-primary" />
                        <span className="text-slate-300">Contactos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-amber-400" />
                        <span className="text-slate-300">Respuestas</span>
                      </div>
                    </div>
                  </div>

                  {/* Barras */}
                  <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-6 items-end min-h-[220px]">
                    {data?.stats?.semana?.desglose?.map((diaItem, index) => {
                      const maxVal = Math.max(
                        ...data.stats.semana.desglose.map((d) => Math.max(d.contactos, d.respuestas)),
                        4
                      );
                      const contactoHeight = Math.max(6, Math.round((diaItem.contactos / maxVal) * 160));
                      const respuestaHeight = Math.max(6, Math.round((diaItem.respuestas / maxVal) * 160));

                      return (
                        <div
                          key={index}
                          className={`flex flex-col items-center justify-end space-y-2 p-2 rounded-xl transition-all ${
                            diaItem.esHoy ? "bg-primary/10 border border-primary/30" : "hover:bg-slate-800/40"
                          }`}
                        >
                          <div className="flex items-end gap-1 sm:gap-2 h-40">
                            {/* Barra Contactos */}
                            <div className="flex flex-col items-center justify-end">
                              <span className="text-[10px] font-bold text-primary mb-1">
                                {diaItem.contactos > 0 ? diaItem.contactos : ""}
                              </span>
                              <div
                                style={{ height: `${diaItem.contactos > 0 ? contactoHeight : 4}px` }}
                                className={`w-3 sm:w-6 rounded-t-lg transition-all ${
                                  diaItem.contactos > 0 ? "bg-primary" : "bg-slate-800"
                                }`}
                              />
                            </div>

                            {/* Barra Respuestas */}
                            <div className="flex flex-col items-center justify-end">
                              <span className="text-[10px] font-bold text-amber-400 mb-1">
                                {diaItem.respuestas > 0 ? diaItem.respuestas : ""}
                              </span>
                              <div
                                style={{ height: `${diaItem.respuestas > 0 ? respuestaHeight : 4}px` }}
                                className={`w-3 sm:w-6 rounded-t-lg transition-all ${
                                  diaItem.respuestas > 0 ? "bg-amber-400" : "bg-slate-800"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="text-center">
                            <span className={`text-xs font-bold ${diaItem.esHoy ? "text-primary" : "text-slate-300"}`}>
                              {diaItem.dia}
                            </span>
                            {diaItem.esHoy && (
                              <span className="block text-[9px] font-black uppercase tracking-wider text-primary">
                                Hoy
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}

            {/* Vista 3: Estadísticas del MES */}
            {statsPeriod === "mes" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
                <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Total Prospectos Contactados</span>
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {data?.stats?.mes?.totalContactos || 0}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    Acumulado en el mes calendario
                  </div>
                </Card>

                <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Tasa de Respuesta Efectiva</span>
                    <TrendingUp className="h-4 w-4 text-sky-400" />
                  </div>
                  <div className="text-3xl font-black text-sky-300">
                    {data?.stats?.mes?.tasaRespuesta || 0}%
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {data?.stats?.mes?.respuestas || 0} respuestas recibidas de {data?.stats?.mes?.totalContactos || 0}
                  </div>
                </Card>

                <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Cotizaciones Generadas</span>
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-black text-indigo-300">
                    {data?.stats?.mes?.cotizaciones || 0}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    Propuestas originadas de prospección
                  </div>
                </Card>

                <Card className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Ventas Cerradas Ganadas</span>
                    <Award className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-300">
                    {data?.stats?.mes?.cerrados || 0}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    Contratos logrados por outbound
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. Panel Central: Pipeline de Prospectos Contactados y Filtros */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Prospectos Contactados</h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Seguimiento ágil del estado de cada contacto para avanzar conversaciones y cotizar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-primary text-primary-foreground font-black h-10 px-4 text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-2"
            >
              <Plus className="h-4 w-4" /> Iniciar Nueva Sesión
            </Button>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por negocio o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-slate-950/80 border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus-visible:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro por Estado */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto scrollbar-none max-w-full">
              <span className="text-slate-400 font-bold px-2 shrink-0">Estado:</span>
              {(["todos", "por_contactar", "contactado", "respondio", "cotizado", "cerrado", "descartado"] as const).map((est) => (
                <button
                  key={est}
                  onClick={() => setFiltroEstado(est)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all shrink-0 ${
                    filtroEstado === est
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {est === "por_contactar" ? "Por Contactar" : est}
                </button>
              ))}
            </div>

            {/* Filtro por Síntoma */}
            <select
              value={filtroSintoma}
              onChange={(e) => setFiltroSintoma(e.target.value)}
              aria-label="Filtrar por síntoma detectado"
              className="h-10 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-bold focus:outline-none focus:border-primary"
            >
              <option value="todos">Todos los síntomas</option>
              <option value="Sin página web">Sin página web</option>
              <option value="Web lenta / Sin certificado SSL">Web lenta / Sin SSL</option>
              <option value="Usa correo gratuito (@gmail / @hotmail)">Correo gratuito</option>
              <option value="Ficha de Google Maps abandonada">Google Maps abandonada</option>
              <option value="Venta manual por redes / Sin pasarela">Venta manual en redes</option>
            </select>
          </div>
        </div>

        {/* Listado de Prospectos */}
        {loading && !data ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-900/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProspects.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No hay prospectos que coincidan</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                {search || filtroEstado !== "todos" || filtroSintoma !== "todos"
                  ? "Prueba cambiando los filtros de búsqueda."
                  : "Aún no has registrado prospectos en sesiones guiadas. Haz clic en 'Iniciar Sesión' para comenzar tu primera racha."}
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-primary text-primary-foreground font-bold text-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Iniciar Sesión de Contactos
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredProspects.map((prospect, idx) => {
              const pId = prospect.id || `prospect-${idx}`;
              const waClean = (prospect.telefono || "").replace(/\D/g, "");
              const waUrl = waClean ? `https://wa.me/${waClean}?text=${encodeURIComponent(prospect.mensajeEnviado || "")}` : "";
              const fechaFormatted = formatFechaContacto(prospect.fechaContacto);

              return (
                <Card
                  key={pId}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-all p-4 sm:p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Información del negocio y contacto */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-black text-white">
                          {prospect.nombreNegocio}
                        </h4>
                        {getEstadoBadge(prospect.estado)}
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                          {prospect.sintoma}
                        </span>
                        {prospect.canal === "whatsapp" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            WhatsApp
                          </span>
                        )}
                        {prospect.canal === "telefono" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            Llamada
                          </span>
                        )}
                        {prospect.canal === "correo" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Correo
                          </span>
                        )}
                        {prospect.canal === "no_contactar" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Por Contactar
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        {prospect.telefono && (
                          <a href={`tel:${prospect.telefono}`} className="flex items-center gap-1.5 text-slate-300 font-mono font-medium hover:text-primary transition-colors">
                            <Phone className="h-3.5 w-3.5 text-primary" /> {prospect.telefono}
                          </a>
                        )}
                        {prospect.email && (
                          <a href={`mailto:${prospect.email}`} className="flex items-center gap-1.5 text-indigo-300 font-medium hover:underline">
                            <Mail className="h-3.5 w-3.5 text-indigo-400" /> {prospect.email}
                          </a>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" /> {fechaFormatted}
                        </span>
                      </div>

                      {/* Snippet del mensaje o notas */}
                      {prospect.mensajeEnviado && (
                        <p className="text-xs text-slate-400 line-clamp-1 italic bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                          "{prospect.mensajeEnviado}"
                        </p>
                      )}
                    </div>

                    {/* Acciones y selector de estado rápido */}
                    <div className="flex flex-wrap items-center gap-2 lg:self-center">
                      {/* Selector de Estado */}
                      <select
                        value={prospect.estado}
                        disabled={updatingId === pId}
                        aria-label={`Actualizar estado de ${prospect.nombreNegocio}`}
                        onChange={(e) => {
                          if (prospect.id) {
                            handleStatusChange(prospect.id, e.target.value as ProspectEstado);
                          }
                        }}
                        className="h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none focus:border-primary disabled:opacity-50"
                      >
                        <option value="por_contactar">⏳ Por Contactar</option>
                        <option value="contactado">📞 Contactado</option>
                        <option value="respondio">💬 Respondió</option>
                        <option value="cotizado">📄 Cotizado</option>
                        <option value="cerrado">🏆 Cerrado Ganado</option>
                        <option value="descartado">❌ Descartado</option>
                      </select>

                      {/* Botón WhatsApp Directo (si tiene teléfono) */}
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
                          title="Abrir chat en WhatsApp"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {/* Botón Llamar Directo (si tiene teléfono) */}
                      {prospect.telefono && (
                        <a
                          href={`tel:${prospect.telefono}`}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all"
                          title="Llamar por teléfono"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>Llamar</span>
                        </a>
                      )}

                      {/* Botón Enviar Correo (si tiene email) */}
                      {prospect.email && (
                        <a
                          href={`mailto:${prospect.email}?subject=${encodeURIComponent("Propuesta comercial | Servicios Informáticos Hoja SpA")}&body=${encodeURIComponent(prospect.mensajeEnviado || "")}`}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all"
                          title="Abrir cliente de correo"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Email</span>
                        </a>
                      )}

                      {/* Copiar Mensaje */}
                      {prospect.mensajeEnviado && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(prospect.mensajeEnviado || "", pId)}
                          className="h-9 w-9 rounded-xl border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300"
                          title="Copiar texto de prospección"
                        >
                          {copiedId === pId ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Historial de Sesiones Recientes */}
      {data?.sessions && data.sessions.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Historial de Sesiones Recientes
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Últimas {Math.min(data.sessions.length, 5)} sesiones registradas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.sessions.slice(0, 6).map((sess, sIdx) => {
              const sessFecha = formatFechaSesion(sess.fecha);
              const sId = sess.id || `session-${sIdx}`;

              return (
                <Card
                  key={sId}
                  className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">{sessFecha}</span>
                    {sess.metaCumplida ? (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-black">
                        🏆 Meta Cumplida
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-black">
                        Incompleta
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="text-2xl font-black text-white">
                        {sess.contactosCompletados}{" "}
                        <span className="text-sm text-slate-400 font-medium">
                          / {sess.metaObjetivo} contactos
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Duración: <span className="text-slate-200 font-bold">{formatMinutos(sess.duracionMinutos)}</span>
                      </div>
                    </div>

                    <div className="h-10 w-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-primary">
                      <Target className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Modal de Sesión Guiada de Prospección */}
      <SessionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSessionFinished={loadData}
      />
    </div>
  );
}
