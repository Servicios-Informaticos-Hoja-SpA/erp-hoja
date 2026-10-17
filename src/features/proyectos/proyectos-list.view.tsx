"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  Building2, 
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  List as ListIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AlertDialog, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Proyecto, ProyectoFase, Cliente } from "@/lib/types";
import { useRouter } from "next/navigation";

interface ProyectosListViewProps {
  proyectos: Proyecto[];
  clientes?: Cliente[];
  onNew: () => void;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

type SearchTarget = "todo" | "cliente" | "proyecto" | "cotizacion";

const FASE_CONFIG: Record<ProyectoFase, { label: string; color: string; border: string; bg: string }> = {
  planificacion: { label: "Planificación", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  desarrollo: { label: "En Desarrollo", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  revision_qa: { label: "Revisión / QA", color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
  entregado: { label: "Entregado", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  pausado: { label: "Pausado", color: "text-slate-400", border: "border-slate-600", bg: "bg-slate-800/40" },
  cancelado: { label: "Cancelado", color: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10" },
};

export const ProyectosListView: React.FC<ProyectosListViewProps> = ({
  proyectos,
  clientes = [],
  onNew,
  onDelete,
  loading,
}) => {
  const router = useRouter();

  // Búsqueda orientada por selector
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTarget, setSearchTarget] = useState<SearchTarget>("todo");
  const [faseFilter, setFaseFilter] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Eliminación con confirmación
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCLP = (val: number = 0) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

  // Filtrado optimizado según el selector
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return proyectos.filter((p) => {
      // 1. Filtro por texto según el selector activo
      if (q) {
        if (searchTarget === "cliente") {
          const cliName = (p.clienteNombre || "").toLowerCase();
          const cliRut = (p.clienteRut || "").toLowerCase();
          if (!cliName.includes(q) && !cliRut.includes(q)) return false;
        } else if (searchTarget === "proyecto") {
          const pName = (p.nombre || "").toLowerCase();
          const pDesc = (p.descripcion || "").toLowerCase();
          if (!pName.includes(q) && !pDesc.includes(q)) return false;
        } else if (searchTarget === "cotizacion") {
          const cot = String(p.presupuestoNumero || "").toLowerCase();
          if (!cot.includes(q) && !`cot-${cot}`.includes(q)) return false;
        } else {
          // "todo"
          const match = [
            p.nombre,
            p.clienteNombre,
            p.clienteRut || "",
            p.presupuestoNumero ? `cot-${p.presupuestoNumero}` : "",
            p.presupuestoNumero ? String(p.presupuestoNumero) : "",
            p.tipoServicio?.replace(/_/g, " ") || "",
          ].some((f) => f.toLowerCase().includes(q));
          if (!match) return false;
        }
      }

      // 2. Filtro por Fase
      if (faseFilter !== "todos" && p.fase !== faseFilter) {
        return false;
      }

      return true;
    });
  }, [proyectos, searchQuery, searchTarget, faseFilter]);

  const placeholderText = useMemo(() => {
    switch (searchTarget) {
      case "cliente":
        return "Escribe el nombre o RUT del cliente...";
      case "proyecto":
        return "Escribe el nombre del proyecto o requerimiento...";
      case "cotizacion":
        return "Escribe el N° de cotización (ej: 104 o COT-104)...";
      default:
        return "Buscar por cliente, proyecto, cotización...";
    }
  }, [searchTarget]);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await onDelete(deleteId);
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ENCABEZADO PRINCIPAL (SIN ESTADÍSTICAS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-indigo-400" />
            Gestión de Proyectos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Control de contratos, planificación, hitos de pago, calidad y cierre operativo de Hoja SpA.
          </p>
        </div>

        <Button
          onClick={onNew}
          className="w-full sm:w-auto h-11 px-5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2 shadow-lg shadow-indigo-600/25 transition-all justify-center"
        >
          <Plus className="w-4 h-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* BARRA DE BÚSQUEDA SELECTIVA Y FILTROS */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Selector de objetivo de búsqueda + Input */}
          <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2">
            <Select value={searchTarget} onValueChange={(val) => val && setSearchTarget(val as SearchTarget)}>
              <SelectTrigger className="h-10 text-xs bg-card border-white/15 text-slate-200 rounded-md w-full sm:w-auto sm:min-w-[150px] font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/15 text-white">
                <SelectItem value="todo" className="text-xs font-bold">Todo</SelectItem>
                <SelectItem value="cliente" className="text-xs">Por Cliente</SelectItem>
                <SelectItem value="proyecto" className="text-xs">Por Proyecto</SelectItem>
                <SelectItem value="cotizacion" className="text-xs">Por Cotización</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholderText}
                className="pl-10 h-10 rounded-md bg-card border-white/15 text-foreground placeholder:text-slate-500 text-xs font-medium"
              />
            </div>
          </div>

          {/* Toggle de Vista: Cuadrícula vs Tabla */}
          <div className="flex items-center gap-1 p-1 rounded-md bg-card border border-white/15 w-full sm:w-auto justify-end md:self-auto shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`flex-1 sm:flex-initial h-8 px-2.5 rounded-lg text-xs font-bold gap-1 justify-center ${
                viewMode === "grid" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cuadrícula
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={`flex-1 sm:flex-initial h-8 px-2.5 rounded-lg text-xs font-bold gap-1 justify-center ${
                viewMode === "table" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              Tabla
            </Button>
          </div>
        </div>

        {/* Pastillas de Filtro por Fase con desplazamiento táctil en móvil */}
        <div className="flex items-center gap-2 pt-1 max-w-full overflow-x-auto scrollbar-none pb-1 sm:flex-wrap">
          <button
            onClick={() => setFaseFilter("todos")}
            className={`px-3 py-1.5 rounded-md text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              faseFilter === "todos"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border border-white/15 text-slate-300 hover:bg-white/5"
            }`}
          >
            Todos ({proyectos.length})
          </button>
          <button
            onClick={() => setFaseFilter("planificacion")}
            className={`px-3 py-1.5 rounded-md text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              faseFilter === "planificacion"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            Planificación
          </button>
          <button
            onClick={() => setFaseFilter("desarrollo")}
            className={`px-3 py-1.5 rounded-md text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              faseFilter === "desarrollo"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
            }`}
          >
            En Desarrollo
          </button>
          <button
            onClick={() => setFaseFilter("revision_qa")}
            className={`px-3 py-1.5 rounded-md text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              faseFilter === "revision_qa"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
            }`}
          >
            Revisión / QA
          </button>
          <button
            onClick={() => setFaseFilter("entregado")}
            className={`px-3 py-1.5 rounded-md text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              faseFilter === "entregado"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
            }`}
          >
            Entregados
          </button>
          <button
            onClick={() => setFaseFilter("pausado")}
            className={`px-3 py-1.5 rounded-md text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              faseFilter === "pausado"
                ? "bg-slate-700 text-white shadow-md"
                : "bg-card border border-white/15 text-slate-400 hover:bg-white/5"
            }`}
          >
            Pausados
          </button>
        </div>
      </div>

      {/* VISTA EN CUADRÍCULA COMPACTA (MODO PRINCIPAL) */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              Cargando proyectos de Hoja SpA...
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-card rounded-lg border border-white/10">
              No se encontraron proyectos con los filtros de búsqueda aplicados.
            </div>
          ) : (
            filtered.map((p) => {
              const faseCfg = FASE_CONFIG[p.fase] || FASE_CONFIG.planificacion;
              const tareas = p.checklist || [];
              const tareasCompletadas = tareas.filter((t) => t.completada).length;
              const hitos = p.hitosPago || [];
              const hitosCobrados = hitos.filter((h) => h.estado === "cobrado").length;

              return (
                <Card
                  key={p.id}
                  className="bg-card border-white/10 hover:border-indigo-500/40 rounded-lg shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    {/* Fila Superior: Cliente & Estado */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 truncate max-w-[190px]">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          {p.clienteNombre}
                        </span>

                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${faseCfg.bg} ${faseCfg.border} ${faseCfg.color} shrink-0`}>
                          {faseCfg.label}
                        </span>
                      </div>

                      {/* Título del Proyecto */}
                      <h3 className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                        {p.nombre}
                      </h3>

                      {/* Tipo de Servicio */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 capitalize">
                          {p.tipoServicio?.replace(/_/g, " ")}
                        </span>
                        {p.presupuestoNumero && (
                          <span className="font-mono text-emerald-400 font-bold">
                            COT-{p.presupuestoNumero}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barra de Progreso y Tareas */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Progreso Operativo</span>
                        <span className="font-mono font-bold text-indigo-300">
                          {p.progresoPorcentaje || 0}% ({tareasCompletadas}/{tareas.length} tareas)
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${p.progresoPorcentaje || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Fechas & Monto */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Entrega</span>
                        <span className="font-mono text-[11px] text-amber-300 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {p.fechaEntregaComprometida || "A convenir"}
                        </span>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Monto Pactado</span>
                        <span className="font-mono text-xs font-black text-emerald-400 block">
                          {formatCLP(p.montos?.total)}
                        </span>
                      </div>
                    </div>

                    {/* Botón Gestionar Proyecto (Abre página dedicada /proyectos/[id]) */}
                    <div className="pt-2 flex items-center gap-2">
                      <Button
                        onClick={() => router.push(`/proyectos/${p.id}`)}
                        className="flex-1 h-9 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                      >
                        Gestionar Proyecto
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(p.id!)}
                        className="h-9 w-9 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md"
                        title="Eliminar proyecto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        /* VISTA EN TABLA ALTERNATIVA */
        <Card className="bg-card border-white/10 rounded-lg shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-slate-400">
                  <th className="py-3 px-4 font-bold">Proyecto & Cliente</th>
                  <th className="py-3 px-4 font-bold">Fase</th>
                  <th className="py-3 px-4 font-bold">Monto Convenido</th>
                  <th className="py-3 px-4 font-bold">Progreso</th>
                  <th className="py-3 px-4 font-bold">Entrega</th>
                  <th className="py-3 px-4 font-bold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((p) => {
                  const faseCfg = FASE_CONFIG[p.fase] || FASE_CONFIG.planificacion;
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-xs">{p.nombre}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{p.clienteNombre}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${faseCfg.bg} ${faseCfg.border} ${faseCfg.color}`}>
                          {faseCfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {formatCLP(p.montos?.total)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-indigo-300">
                        {p.progresoPorcentaje || 0}%
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-300">
                        {p.fechaEntregaComprometida || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/proyectos/${p.id}`)}
                            className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1"
                          >
                            Gestionar
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(p.id!)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-950 border border-white/15 text-slate-100 rounded-lg shadow-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-white">¿Eliminar este proyecto?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-400 leading-relaxed">
              Esta acción eliminará el proyecto y todos sus registros operativos, tareas y documentos vinculados. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white/5 border-white/15 text-slate-300 text-xs h-10 rounded-md">
              Cancelar
            </AlertDialogCancel>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-10 rounded-md px-5"
            >
              {isDeleting ? "Eliminando..." : "Sí, Eliminar Proyecto"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
