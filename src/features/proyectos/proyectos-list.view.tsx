"use client";

import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  ArrowLeft, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  Layers,
  Briefcase,
  FileText,
  User,
  ShieldCheck,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Proyecto, ProyectoFase } from "@/lib/types";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { ProyectosListSkeleton } from "@/components/common/skeletons";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProyectosListViewProps {
  proyectos: Proyecto[];
  search: string;
  setSearch: (val: string) => void;
  onNew: () => void;
  onSelect: (p: Proyecto) => void;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

export const ProyectosListView: React.FC<ProyectosListViewProps> = ({
  proyectos,
  search,
  setSearch,
  onNew,
  onSelect,
  onDelete,
  loading,
}) => {
  const router = useRouter();
  const [faseFilter, setFaseFilter] = useState<string>("todos");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const formatCLP = (val: number = 0) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

  // Buscador inteligente multi-campo
  const filtered = proyectos.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [
      p.nombre,
      p.clienteNombre,
      p.clienteRut || "",
      p.clienteTelefono || "",
      p.descripcion || "",
      p.presupuestoNumero ? `cot-${p.presupuestoNumero}` : "",
      p.presupuestoNumero ? String(p.presupuestoNumero) : "",
      p.tipoServicio?.replace("_", " ") || "",
      p.fase || "",
      p.montos?.total?.toString() || "",
      ...(p.checklist || []).map((c) => `${c.titulo} ${c.categoria || ""}`),
      ...(p.hitosPago || []).map((h) => `${h.titulo} ${h.estado}`),
    ].some((field) => field.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (faseFilter === "todos") return true;
    return p.fase === faseFilter;
  });

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedProjectId((prev) => (prev === id ? null : id));
  };

  // Contadores para pastillas de filtro
  const totalCount = proyectos.length;
  const planificacionCount = proyectos.filter((p) => p.fase === "planificacion").length;
  const desarrolloCount = proyectos.filter((p) => p.fase === "desarrollo").length;
  const qaCount = proyectos.filter((p) => p.fase === "revision_qa").length;
  const entregadoCount = proyectos.filter((p) => p.fase === "entregado").length;
  const pausadoCount = proyectos.filter((p) => p.fase === "pausado").length;

  const getFaseBadge = (fase: ProyectoFase) => {
    switch (fase) {
      case "planificacion":
        return <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/30 font-black text-[10px]">📋 Planificación</Badge>;
      case "desarrollo":
        return <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 font-black text-[10px]">💻 En Desarrollo</Badge>;
      case "revision_qa":
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black text-[10px]">🔍 Revisión / QA</Badge>;
      case "entregado":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-[10px]">✅ Entregado</Badge>;
      case "pausado":
        return <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/30 font-black text-[10px]">⏸️ Pausado</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] font-bold">{fase}</Badge>;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-3 py-6 sm:px-8 sm:py-10 max-w-7xl mx-auto w-full">
      
      {/* Encabezado */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push('/')} 
            className="rounded-xl border-white/15 bg-card text-foreground hover:bg-muted/70 shrink-0 h-10 w-10 sm:h-11 sm:w-11 shadow-sm"
            title="Volver al menú principal"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-4xl font-black tracking-tight text-foreground leading-none">
              Gestión de Proyectos
            </h1>
            <p className="text-[11px] sm:text-sm text-slate-400 font-medium mt-1">
              Control de cronogramas, hitos de pago (50/50), checklists y actas formales
            </p>
          </div>
        </div>

        <Button
          onClick={onNew}
          className="rounded-2xl px-5 sm:px-6 h-11 sm:h-12 text-xs sm:text-sm font-black shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:scale-105 transition-all gap-2 shrink-0 justify-center"
        >
          <Plus className="h-4 w-4" /> Nuevo Proyecto
        </Button>
      </div>

      {/* Buscador de Alto Rendimiento y Filtros */}
      <div className="space-y-4 mb-6 sm:mb-8">
        <div className="relative">
          <Search className="absolute left-4 sm:left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por proyecto, cliente, RUT, teléfono, tipo de servicio, COT o tarea..." 
            className="pl-12 sm:pl-14 pr-24 py-5 sm:py-7 text-sm sm:text-base rounded-2xl bg-card border-2 border-white/10 focus-visible:border-primary shadow-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/60 px-2.5 py-1 rounded-lg transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Contador y Estado de Búsqueda */}
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
          <span>
            Mostrando <strong className="text-foreground">{filtered.length}</strong> de{" "}
            <strong className="text-foreground">{proyectos.length}</strong> proyectos
          </span>
          {search && (
            <span className="text-primary truncate max-w-[200px] sm:max-w-none">
              Filtro activo: &ldquo;{search}&rdquo;
            </span>
          )}
        </div>

        {/* Pastillas de Filtro por Fase con scroll táctil en móvil */}
        <div className="flex overflow-x-auto items-center gap-1.5 sm:gap-2 pb-2 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 text-xs font-bold">
          <button
            onClick={() => setFaseFilter("todos")}
            className={`shrink-0 px-3.5 py-2 rounded-xl transition-all ${
              faseFilter === "todos" 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "bg-card border border-white/10 text-muted-foreground hover:bg-muted/70"
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            onClick={() => setFaseFilter("planificacion")}
            className={`shrink-0 px-3.5 py-2 rounded-xl transition-all ${
              faseFilter === "planificacion" 
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20" 
                : "bg-card border border-white/10 text-sky-400 hover:bg-muted/70"
            }`}
          >
            📋 Planificación ({planificacionCount})
          </button>
          <button
            onClick={() => setFaseFilter("desarrollo")}
            className={`shrink-0 px-3.5 py-2 rounded-xl transition-all ${
              faseFilter === "desarrollo" 
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/20" 
                : "bg-card border border-white/10 text-purple-400 hover:bg-muted/70"
            }`}
          >
            💻 En Desarrollo ({desarrolloCount})
          </button>
          <button
            onClick={() => setFaseFilter("revision_qa")}
            className={`shrink-0 px-3.5 py-2 rounded-xl transition-all ${
              faseFilter === "revision_qa" 
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20" 
                : "bg-card border border-white/10 text-amber-400 hover:bg-muted/70"
            }`}
          >
            🔍 Revisión / QA ({qaCount})
          </button>
          <button
            onClick={() => setFaseFilter("entregado")}
            className={`shrink-0 px-3.5 py-2 rounded-xl transition-all ${
              faseFilter === "entregado" 
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                : "bg-card border border-white/10 text-emerald-400 hover:bg-muted/70"
            }`}
          >
            ✅ Entregados ({entregadoCount})
          </button>
          {pausadoCount > 0 && (
            <button
              onClick={() => setFaseFilter("pausado")}
              className={`shrink-0 px-3.5 py-2 rounded-xl transition-all ${
                faseFilter === "pausado" 
                  ? "bg-slate-500 text-white shadow-md shadow-slate-500/20" 
                  : "bg-card border border-white/10 text-slate-400 hover:bg-muted/70"
              }`}
            >
              ⏸️ Pausados ({pausadoCount})
            </button>
          )}
        </div>
      </div>

      {/* Lista de Proyectos */}
      <div className="space-y-4">
        {loading ? (
          <ProyectosListSkeleton count={3} />
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground italic font-medium border border-dashed border-white/10 rounded-3xl bg-card/40">
            No se encontraron proyectos con el criterio seleccionado.
          </div>
        ) : (
          filtered.map((p) => {
            const isExpanded = expandedProjectId === p.id;
            const completed = (p.checklist || []).filter((c) => c.completada).length;
            const total = (p.checklist || []).length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

            const totalConvenido = p.montos?.total || 0;
            const totalCobrado = (p.hitosPago || [])
              .filter((h) => h.estado === "cobrado")
              .reduce((acc, curr) => acc + (curr.monto || 0), 0);
            const saldoPendiente = Math.max(0, totalConvenido - totalCobrado);

            return (
              <Card 
                key={p.id}
                className={`border-2 transition-all bg-card/90 dark:bg-slate-900 shadow-md hover:shadow-xl rounded-2xl overflow-hidden ${
                  isExpanded ? "border-primary/60 ring-1 ring-primary/30" : "border-white/10 hover:border-white/25"
                }`}
              >
                <CardContent className="p-5 sm:p-6">
                  
                  {/* Fila Principal: Resumen del Proyecto y Botones Rápidos */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    {/* Info Proyecto - Clic para expandir detalles sin navegar */}
                    <div 
                      onClick={() => toggleExpand(p.id!)}
                      className="space-y-3 flex-1 min-w-0 cursor-pointer"
                      title="Haz clic para ver más detalles en pantalla"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {getFaseBadge(p.fase)}
                        <Badge variant="outline" className="text-[10px] font-mono capitalize border-white/15">
                          {p.tipoServicio?.replace("_", " ") || "Servicio"}
                        </Badge>
                        {p.presupuestoNumero && (
                          <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            COT-{p.presupuestoNumero}
                          </span>
                        )}
                        {p.clienteRut && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            RUT: {p.clienteRut}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg sm:text-2xl font-black text-foreground hover:text-primary transition-colors leading-tight">
                          {p.nombre}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                          Cliente: <strong className="text-foreground">{p.clienteNombre}</strong>
                        </p>
                      </div>

                      {/* Barra de progreso de checklist operativo */}
                      <div className="space-y-1.5 max-w-md pt-1">
                        <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-primary" />
                            Checklist Operativo: {completed} / {total} tareas
                          </span>
                          <span className="text-emerald-400 font-mono">{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Lado Financiero y Botones de Acción */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 pt-4 md:pt-0 border-t md:border-none border-white/5">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                          Total Convenido
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-foreground font-mono">
                          {formatCLP(totalConvenido)}
                        </span>
                        <div className="flex items-center md:justify-end gap-2 text-[11px] font-bold mt-0.5">
                          <span className="text-emerald-400">
                            Cobrado: {formatCLP(totalCobrado)}
                          </span>
                          {saldoPendiente > 0 && (
                            <span className="text-amber-400/90">
                              • Pendiente: {formatCLP(saldoPendiente)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {p.clienteTelefono && (
                          <WhatsAppButton
                            telefono={p.clienteTelefono}
                            clienteNombre={p.clienteNombre}
                            contexto={{
                              tipo: "proyecto",
                              proyectoNombre: p.nombre
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          />
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(p.id!)}
                          className="h-10 w-10 text-muted-foreground hover:text-destructive rounded-xl transition-colors"
                          title="Eliminar proyecto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        {/* Botón Expansor de Detalles In-Line */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => toggleExpand(p.id!, e)}
                          className={`h-10 px-3.5 rounded-xl text-xs font-black gap-1.5 border transition-all ${
                            isExpanded 
                              ? "bg-primary text-primary-foreground border-primary shadow-md" 
                              : "bg-card border-white/15 text-foreground hover:bg-muted"
                          }`}
                        >
                          <span>{isExpanded ? "Ocultar" : "Detalles"}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Botón Principal para Entrar a la Gestión */}
                        <Button
                          size="sm"
                          onClick={() => onSelect(p)}
                          className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs gap-1.5 shadow-md shadow-primary/20"
                        >
                          <span>Gestionar</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                  </div>

                  {/* ============================================================== */}
                  {/* SECCIÓN DESPLEGABLE: DETALLE COMPLETO DEL PROYECTO IN-LINE      */}
                  {/* ============================================================== */}
                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-white/10 space-y-5 animate-in fade-in duration-200">
                      
                      {/* Grid de 2 Columnas: Finanzas/Hitos y Checklist */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        
                        {/* Bloque 1: Cronograma de Hitos de Pago (50% / 50%) */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                              <DollarSign className="h-4 w-4" /> Hitos de Pago & Finanzas
                            </span>
                            <span className="text-[11px] font-mono font-bold text-muted-foreground">
                              {p.hitosPago?.length || 0} hitos pactados
                            </span>
                          </div>

                          {/* Lista de Hitos */}
                          <div className="space-y-2">
                            {p.hitosPago && p.hitosPago.length > 0 ? (
                              p.hitosPago.map((hito, idx) => (
                                <div 
                                  key={hito.id || idx}
                                  className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-foreground truncate">
                                        {hito.titulo}
                                      </span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                                        {hito.porcentaje}%
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                      {hito.fechaEstimada && (
                                        <span>Fecha Est.: {hito.fechaEstimada}</span>
                                      )}
                                      {hito.fechaCobroReal && (
                                        <span className="text-emerald-400 font-bold">
                                          Cobrado el: {hito.fechaCobroReal}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="font-mono font-black text-foreground block">
                                      {formatCLP(hito.monto)}
                                    </span>
                                    {hito.estado === "cobrado" ? (
                                      <Badge className="bg-emerald-500/20 text-emerald-300 border-none text-[10px] font-bold">
                                        ✓ Cobrado
                                      </Badge>
                                    ) : hito.estado === "vencido" ? (
                                      <Badge className="bg-rose-500/20 text-rose-300 border-none text-[10px] font-bold">
                                        ⚠️ Vencido
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-amber-500/20 text-amber-300 border-none text-[10px] font-bold">
                                        ⏳ Pendiente
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-muted-foreground italic">
                                No se han desglosado hitos de pago para este proyecto.
                              </div>
                            )}
                          </div>

                          {/* Resumen de Montos Netos e IVA */}
                          <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[9px] uppercase font-bold text-muted-foreground block">Neto</span>
                              <span className="text-xs font-mono font-bold text-foreground">{formatCLP(p.montos?.neto)}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[9px] uppercase font-bold text-muted-foreground block">IVA 19%</span>
                              <span className="text-xs font-mono font-bold text-foreground">{formatCLP(p.montos?.iva)}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                              <span className="text-[9px] uppercase font-black text-emerald-400 block">Total Proyecto</span>
                              <span className="text-xs font-mono font-black text-emerald-300">{formatCLP(p.montos?.total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bloque 2: Checklist Operativo & QA */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" /> Checklist Operativo & QA
                            </span>
                            <span className="text-[11px] font-bold text-emerald-400">
                              {completed} / {total} completadas ({progress}%)
                            </span>
                          </div>

                          {/* Lista de Tareas con scroll si son muchas */}
                          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                            {p.checklist && p.checklist.length > 0 ? (
                              p.checklist.map((task, idx) => (
                                <div 
                                  key={task.id || idx}
                                  className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs transition-colors ${
                                    task.completada 
                                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-100" 
                                      : "bg-white/5 border-white/10 text-muted-foreground"
                                  }`}
                                >
                                  {task.completada ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className={`font-bold truncate ${task.completada ? "text-foreground line-through opacity-80" : "text-foreground"}`}>
                                        {task.titulo}
                                      </span>
                                      {task.categoria && (
                                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                                          {task.categoria}
                                        </span>
                                      )}
                                    </div>
                                    {task.descripcion && (
                                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                        {task.descripcion}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-muted-foreground italic">
                                Sin tareas asignadas aún en el checklist de este proyecto.
                              </div>
                            )}
                          </div>

                          {/* Estado de Entrega Formal */}
                          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Acta de Entrega Formal:</span>
                            <span className="font-bold text-foreground">
                              {p.fase === "entregado" ? "✅ Emitida y Conforme" : "⏳ Pendiente de finalización"}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Bloque 3: Fechas Clave, Alcance y Contacto */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        
                        {/* Fechas */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" /> Cronograma de Fechas
                          </span>
                          <div className="space-y-1">
                            <div className="flex justify-between py-0.5 border-b border-white/5">
                              <span className="text-muted-foreground">Inicio:</span>
                              <span className="font-mono font-bold text-foreground">{p.fechaInicio || "No definida"}</span>
                            </div>
                            <div className="flex justify-between py-0.5 border-b border-white/5">
                              <span className="text-muted-foreground">Entrega Comprometida:</span>
                              <span className="font-mono font-bold text-amber-300">{p.fechaEntregaComprometida || "No definida"}</span>
                            </div>
                            <div className="flex justify-between py-0.5">
                              <span className="text-muted-foreground">Entrega Real:</span>
                              <span className="font-mono font-bold text-emerald-400">{p.fechaEntregaReal || "En desarrollo"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Alcance / Descripción */}
                        <div className="space-y-1.5 md:col-span-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" /> Alcance y Descripción Operativa
                          </span>
                          <p className="text-muted-foreground leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5 text-xs max-h-[85px] overflow-y-auto">
                            {p.descripcion || "Sin observaciones adicionales registradas para este proyecto."}
                          </p>
                        </div>

                      </div>

                      {/* Barra de Acciones del Desplegable */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
                        <div className="text-xs text-muted-foreground font-medium">
                          Ficha del proyecto sincronizada en tiempo real con Firestore
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {p.clienteTelefono && (
                            <WhatsAppButton
                              telefono={p.clienteTelefono}
                              clienteNombre={p.clienteNombre}
                              contexto={{
                                tipo: "proyecto",
                                proyectoNombre: p.nombre
                              }}
                              buttonLabel="Contactar Cliente"
                              className="h-10 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold"
                            />
                          )}

                          <Button
                            onClick={() => onSelect(p)}
                            className="flex-1 sm:flex-initial h-10 px-5 rounded-xl bg-primary text-primary-foreground font-black text-xs gap-2 shadow-lg shadow-primary/25 hover:scale-105 transition-all"
                          >
                            <Briefcase className="h-4 w-4" /> Entrar a Gestión de Proyecto
                          </Button>
                        </div>
                      </div>

                    </div>
                  )}

                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Alerta de confirmación de eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && !isDeleting && setDeleteId(null)}>
        <AlertDialogContent className="border border-white/10 shadow-2xl rounded-3xl bg-card text-foreground p-6 max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              Esta acción eliminará el proyecto y sus checklists asociados de la base de datos de Hoja SpA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-4">
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl border border-white/10">
              Cancelar
            </AlertDialogCancel>
            <Button
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              variant="destructive"
              className="rounded-xl font-bold text-sm"
            >
              Eliminar Proyecto
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

