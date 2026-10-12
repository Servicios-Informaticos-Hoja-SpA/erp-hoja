"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Edit3, 
  Calendar, 
  Eye,
  Download,
  ArrowLeft,
  LogOut,
  AlertTriangle,
  BellOff,
  Briefcase,
  Clock,
  Sparkles,
  Share2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import { Presupuesto, PresupuestoEstado, Cliente } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { PresupuestosListSkeleton } from "@/components/common/skeletons";
import { useRouter } from "next/navigation";

interface PresupuestoListViewProps {
  presupuestos: Presupuesto[];
  clientes: Cliente[];
  search: string;
  setSearch: (val: string) => void;
  onNew: () => void;
  onEdit: (id: string) => void;
  onView: (p: Presupuesto) => void;
  onDownload: (p: Presupuesto) => void;
  onCreateProject: (p: Presupuesto) => void;
  onUpdateEstado: (p: Presupuesto, estado: PresupuestoEstado) => Promise<void>;
  onDismissAlert: (p: Presupuesto) => Promise<void>;
  onRegisterFollowUp: (p: Presupuesto, nota: string, tipo?: string) => Promise<void>;
  onLogout: () => void;
  loading: boolean;
}

export const PresupuestoListView: React.FC<PresupuestoListViewProps> = ({
  presupuestos,
  clientes,
  search,
  setSearch,
  onNew,
  onEdit,
  onView,
  onDownload,
  onCreateProject,
  onUpdateEstado,
  onDismissAlert,
  onRegisterFollowUp,
  onLogout,
  loading
}) => {
  const router = useRouter();
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [expandedPresupuestoId, setExpandedPresupuestoId] = useState<string | null>(null);

  // Modal para registrar seguimiento
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [selectedForFollowUp, setSelectedForFollowUp] = useState<Presupuesto | null>(null);
  const [followUpNota, setFollowUpNota] = useState("");
  const [followUpTipo, setFollowUpTipo] = useState<string>("llamada");

  const formatCurrency = (val: number = 0) => 
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

  const toggleExpand = (id: string) => {
    setExpandedPresupuestoId((prev) => (prev === id ? null : id));
  };

  // Calcula si un presupuesto tiene alerta activa de sin respuesta
  const getAlertInfo = (p: Presupuesto) => {
    const isEnviado = p.estado === "enviado" || p.estado === "emitido";
    if (!isEnviado || p.alertaSilenciada || p.proyecto_id) return null;

    let pDate: Date | null = null;
    const refDate = p.ultimoSeguimiento?.fecha || p.fechaEnvio || p.fecha;
    if (typeof refDate === "string") {
      pDate = new Date(refDate);
    } else if (refDate && typeof refDate === "object" && "seconds" in refDate) {
      pDate = new Date((refDate as { seconds: number }).seconds * 1000);
    }

    if (pDate && !isNaN(pDate.getTime())) {
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 7) {
        return {
          diffDays,
          fechaRefStr: pDate.toLocaleDateString("es-CL"),
        };
      }
    }
    return null;
  };

  // Contadores
  const totalCount = presupuestos.length;
  const alertasCount = presupuestos.filter(p => !!getAlertInfo(p)).length;
  const enviadosCount = presupuestos.filter(p => p.estado === "enviado" || p.estado === "emitido").length;
  const negociacionCount = presupuestos.filter(p => p.estado === "en_negociacion").length;
  const aprobadosCount = presupuestos.filter(p => p.estado === "aprobado").length;
  const borradoresCount = presupuestos.filter(p => !p.estado || p.estado === "borrador").length;
  const rechazadosCount = presupuestos.filter(p => p.estado === "rechazado").length;

  // Filtrado multi-campo inteligente
  const filtered = presupuestos.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.cliente_nombre.toLowerCase().includes(q) ||
      p.numero.toLowerCase().includes(q) ||
      `cot-${p.numero.toLowerCase()}`.includes(q) ||
      (p.nombre_proyecto || "").toLowerCase().includes(q) ||
      (p.descripcion_proyecto || "").toLowerCase().includes(q) ||
      (p.estado || "").toLowerCase().includes(q) ||
      (p.totales?.total?.toString() || "").includes(q) ||
      (p.items || []).some((item) => item.descripcion.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterEstado === "todos") return true;
    if (filterEstado === "alertas") return !!getAlertInfo(p);
    if (filterEstado === "enviado") return p.estado === "enviado" || p.estado === "emitido";
    if (filterEstado === "borrador") return !p.estado || p.estado === "borrador";
    return p.estado === filterEstado;
  });

  const getEstadoBadgeStyle = (estado?: PresupuestoEstado) => {
    switch (estado) {
      case "enviado":
      case "emitido":
        return "bg-amber-500/20 text-amber-300 border-amber-500/50";
      case "en_negociacion":
        return "bg-sky-500/20 text-sky-300 border-sky-500/50";
      case "aprobado":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
      case "rechazado":
        return "bg-rose-500/20 text-rose-300 border-rose-500/50";
      case "vencido":
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
      case "borrador":
      default:
        return "bg-slate-800 text-slate-300 border-slate-600";
    }
  };

  const getEstadoLabel = (estado?: PresupuestoEstado) => {
    switch (estado) {
      case "enviado":
      case "emitido":
        return "📤 Enviado al Cliente";
      case "en_negociacion":
        return "💬 En Negociación";
      case "aprobado":
        return "✅ Aprobado";
      case "rechazado":
        return "❌ Rechazado";
      case "vencido":
        return "⏸️ Vencido";
      case "borrador":
      default:
        return "📝 Borrador Interno";
    }
  };

  const openFollowUpModal = (p: Presupuesto) => {
    setSelectedForFollowUp(p);
    setFollowUpNota("");
    setFollowUpTipo("llamada");
    setFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = async () => {
    if (!selectedForFollowUp || !followUpNota.trim()) return;
    await onRegisterFollowUp(selectedForFollowUp, followUpNota, followUpTipo);
    setFollowUpModalOpen(false);
    setSelectedForFollowUp(null);
  };

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background px-3 py-6 sm:px-8 sm:py-10 max-w-7xl mx-auto w-full">
        
        {/* Encabezado Principal */}
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
                Gestión de Presupuestos
              </h1>
              <p className="text-[11px] sm:text-sm text-slate-400 font-medium mt-1">
                Ciclo comercial, seguimiento de propuestas y conversión a proyectos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onLogout}
              className="gap-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors font-bold px-3 h-11 rounded-xl text-xs"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>

            <Button 
              onClick={onNew} 
              className="flex-1 sm:flex-initial gap-2 rounded-xl px-5 sm:px-7 h-11 text-xs sm:text-sm font-black shadow-lg shadow-primary/25 bg-primary text-primary-foreground hover:opacity-90 hover:scale-[1.02] transition-all justify-center"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" /> <span>Emitir Presupuesto</span>
            </Button>
          </div>
        </div>

        {/* Buscador de Alto Contraste con Limpieza y Contador */}
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Buscar por cliente, N° cotización, proyecto, ítems o monto..." 
            className="pl-12 pr-24 h-12 rounded-xl bg-card border-2 border-white/15 focus-visible:border-primary focus-visible:ring-0 text-foreground font-medium text-sm shadow-inner placeholder:text-slate-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/60 px-2 py-1 rounded-lg"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Pastillas de Filtro por Ciclo de Vida con scroll táctil en móvil */}
        <div className="flex overflow-x-auto sm:flex-wrap items-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 pb-2 sm:pb-0 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            onClick={() => setFilterEstado("todos")}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              filterEstado === "todos"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-card border border-white/15 text-slate-300 hover:bg-white/5"
            }`}
          >
            Todos {loading ? "(...)" : `(${totalCount})`}
          </button>

          {loading ? (
            <div className="h-8 w-28 rounded-xl bg-slate-800/80 animate-pulse inline-block" />
          ) : alertasCount > 0 ? (
            <button
              onClick={() => setFilterEstado("alertas")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                filterEstado === "alertas"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                  : "bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Sin Respuesta ({alertasCount})</span>
            </button>
          ) : null}

          <button
            onClick={() => setFilterEstado("enviado")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              filterEstado === "enviado"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-card border border-white/15 text-amber-300 hover:bg-white/5"
            }`}
          >
            📤 Enviados {loading ? "(...)" : `(${enviadosCount})`}
          </button>

          <button
            onClick={() => setFilterEstado("en_negociacion")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              filterEstado === "en_negociacion"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "bg-card border border-white/15 text-sky-300 hover:bg-white/5"
            }`}
          >
            💬 En Negociación {loading ? "(...)" : `(${negociacionCount})`}
          </button>

          <button
            onClick={() => setFilterEstado("aprobado")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              filterEstado === "aprobado"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "bg-card border border-white/15 text-emerald-300 hover:bg-white/5"
            }`}
          >
            ✅ Aprobados {loading ? "(...)" : `(${aprobadosCount})`}
          </button>

          <button
            onClick={() => setFilterEstado("borrador")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              filterEstado === "borrador"
                ? "bg-slate-700 text-white shadow-md"
                : "bg-card border border-white/15 text-slate-400 hover:bg-white/5"
            }`}
          >
            📝 Borradores {loading ? "(...)" : `(${borradoresCount})`}
          </button>

          {loading ? null : rechazadosCount > 0 ? (
            <button
              onClick={() => setFilterEstado("rechazado")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                filterEstado === "rechazado"
                  ? "bg-rose-700 text-white shadow-md"
                  : "bg-card border border-white/15 text-rose-400 hover:bg-white/5"
              }`}
            >
              ❌ Rechazados ({rechazadosCount})
            </button>
          ) : null}
        </div>

        {/* Listado de Tarjetas de Presupuesto */}
        <div className="space-y-4">
          {loading ? (
            <PresupuestosListSkeleton count={4} />
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-slate-400 italic font-medium border-2 border-dashed border-white/10 rounded-2xl">
              No se encontraron presupuestos en este filtro.
            </div>
          ) : (
            filtered.map((p) => {
              const alertInfo = getAlertInfo(p);
              const clienteObj = clientes.find((c) => c.id === p.cliente_id || c.nombre === p.cliente_nombre);
              const clienteTelefono = clienteObj?.telefono || "";

              return (
                <Card 
                  key={p.id} 
                  className={`rounded-2xl border-2 transition-all bg-card/90 dark:bg-slate-900 shadow-md hover:shadow-xl ${
                    alertInfo 
                      ? "border-amber-500/50 hover:border-amber-500" 
                      : p.estado === "aprobado"
                        ? "border-emerald-500/30 hover:border-emerald-500/50"
                        : "border-white/15 hover:border-primary/50"
                  }`}
                >
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    
                    {/* Fila Superior: N°, Versión, Estado desplegable y Precios */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="bg-primary/15 text-primary border border-primary/30 font-mono font-black text-xs px-3 py-1 rounded-xl">
                          N° {p.numero}
                        </span>

                        {p.version && p.version > 1 && (
                          <span className="bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs px-2 py-0.5 rounded-md font-bold">
                            v{p.version}
                          </span>
                        )}

                        {/* Selector de Estado Integrado para Gestión del Ciclo */}
                        <div className="inline-block">
                          <Select 
                            value={p.estado || "borrador"} 
                            onValueChange={(val) => {
                              if (val) onUpdateEstado(p, val as PresupuestoEstado);
                            }}
                          >
                            <SelectTrigger className={`h-8 rounded-xl px-3 text-xs font-black border ${getEstadoBadgeStyle(p.estado)}`}>
                              <SelectValue>{getEstadoLabel(p.estado)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/15 text-foreground font-bold">
                              <SelectItem value="borrador">📝 Borrador Interno</SelectItem>
                              <SelectItem value="enviado">📤 Enviado al Cliente</SelectItem>
                              <SelectItem value="en_negociacion">💬 En Negociación / Feedback</SelectItem>
                              <SelectItem value="aprobado">✅ Aprobado por Cliente</SelectItem>
                              <SelectItem value="rechazado">❌ Rechazado</SelectItem>
                              <SelectItem value="vencido">⏸️ Vencido / Descartado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Monto Total */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs uppercase font-bold text-slate-400">Total:</span>
                        <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                          {formatCurrency(p.totales?.total || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Información Central: Cliente, Proyecto y Fechas */}
                    <div className="space-y-1">
                      <h3 className="text-lg sm:text-2xl font-black text-foreground tracking-tight">
                        {p.cliente_nombre}
                      </h3>
                      {(p.nombre_proyecto || p.descripcion_proyecto) && (
                        <p className="text-xs sm:text-sm font-medium text-slate-300 line-clamp-2">
                          {p.nombre_proyecto ? `${p.nombre_proyecto} — ` : ""}{p.descripcion_proyecto}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          Fecha Emisión: {p.fecha ? (typeof p.fecha === 'object' && p.fecha !== null && 'seconds' in p.fecha 
                            ? new Date((p.fecha as { seconds: number }).seconds * 1000).toLocaleDateString('es-CL') 
                            : new Date(String(p.fecha)).toLocaleDateString('es-CL')) : '---'}
                        </span>

                        {p.ultimoSeguimiento && (
                          <span className="flex items-center gap-1.5 text-sky-300">
                            <Clock className="h-3.5 w-3.5" />
                            Último contacto: {new Date(p.ultimoSeguimiento.fecha).toLocaleDateString("es-CL")} ({p.ultimoSeguimiento.tipo})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Banner Destacado de Alerta Sin Respuesta con Acciones Directas */}
                    {alertInfo && (
                      <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                          <div>
                            <p className="text-xs sm:text-sm font-black text-amber-300">
                              Sin respuesta del cliente desde hace {alertInfo.diffDays} días
                            </p>
                            <p className="text-xs text-amber-200/80">
                              Emitida el {alertInfo.fechaRefStr}. Registra un contacto o actualiza el estado para despejar esta alerta.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {clienteTelefono && (
                            <WhatsAppButton
                              telefono={clienteTelefono}
                              clienteNombre={p.cliente_nombre}
                              contexto={{
                                tipo: "presupuesto",
                                numeroDoc: p.numero,
                                monto: p.totales?.total,
                              }}
                              buttonLabel="WhatsApp"
                              className="h-9 px-3 text-xs font-black rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                            />
                          )}

                          <Button
                            size="sm"
                            onClick={() => onUpdateEstado(p, "en_negociacion")}
                            className="h-9 px-3 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white"
                          >
                            Marcar en Negociación
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openFollowUpModal(p)}
                            className="h-9 px-3 text-xs font-bold rounded-lg border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20"
                          >
                            Registrar Feedback
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDismissAlert(p)}
                            className="h-9 px-2 text-xs font-bold rounded-lg text-amber-300 hover:bg-amber-500/20"
                            title="Silenciar esta alerta sin cambiar estado"
                          >
                            <BellOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Fila Inferior: Botones de Acción de Alto Contraste y Tamaño Confortable */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                      
                      {/* Lado Izquierdo: Crear Proyecto o Ver Proyecto */}
                      <div>
                        {p.proyecto_id ? (
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/proyectos?id=${p.proyecto_id}`)}
                            className="h-10 px-4 rounded-xl border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-xs font-black gap-2 shadow-sm"
                          >
                            <Briefcase className="h-4 w-4" /> Ver Proyecto Operativo
                          </Button>
                        ) : p.estado === "aprobado" ? (
                          <Button
                            onClick={() => onCreateProject(p)}
                            className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs gap-2 shadow-lg shadow-emerald-600/20"
                          >
                            <Briefcase className="h-4 w-4" /> Iniciar Proyecto (50/50)
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => onCreateProject(p)}
                            className="h-10 px-4 rounded-xl border-white/15 bg-card hover:bg-muted text-slate-300 hover:text-white text-xs font-bold gap-2"
                          >
                            <Sparkles className="h-4 w-4 text-primary" /> Aprobar y Crear Proyecto
                          </Button>
                        )}
                      </div>

                      {/* Lado Derecho: Acciones de Documento (PDF, Descarga, Edición, WhatsApp) */}
                      <div className="flex flex-wrap items-center gap-2">
                        {clienteTelefono && (
                          <WhatsAppButton
                            telefono={clienteTelefono}
                            clienteNombre={p.cliente_nombre}
                            contexto={{
                              tipo: "presupuesto",
                              numeroDoc: p.numero,
                              monto: p.totales?.total,
                            }}
                            buttonLabel="WhatsApp"
                            className="h-10 px-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold"
                          />
                        )}

                        <Button
                          variant="outline"
                          onClick={() => onView(p)}
                          className="h-10 px-3.5 rounded-xl border border-white/15 bg-card hover:bg-muted text-foreground text-xs font-bold gap-1.5"
                          title="Ver PDF en pantalla"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                          <span>Ver PDF</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => onDownload(p)}
                          className="h-10 px-3.5 rounded-xl border border-white/15 bg-card hover:bg-muted text-foreground text-xs font-bold gap-1.5"
                          title="Descargar PDF institucional"
                        >
                          <Download className="h-4 w-4 text-primary" />
                          <span>Descargar</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => onEdit(p.id!)}
                          className="h-10 px-3.5 rounded-xl border border-white/15 bg-card hover:bg-muted text-foreground text-xs font-bold gap-1.5"
                          title="Modificar cotización"
                        >
                          <Edit3 className="h-4 w-4 text-primary" />
                          <span>Editar</span>
                        </Button>

                        {/* Botón Expansor de Ficha In-Line */}
                        <Button
                          variant="outline"
                          onClick={() => toggleExpand(p.id!)}
                          className={`h-10 px-3.5 rounded-xl border text-xs font-black gap-1.5 transition-all ${
                            expandedPresupuestoId === p.id
                              ? "bg-primary text-primary-foreground border-primary shadow-md"
                              : "border-white/15 bg-card hover:bg-muted text-foreground"
                          }`}
                        >
                          <span>{expandedPresupuestoId === p.id ? "Ocultar" : "Detalles"}</span>
                          {expandedPresupuestoId === p.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                    </div>

                    {/* ============================================================== */}
                    {/* SECCIÓN DESPLEGABLE: DETALLE COMPLETO DE LA PROPUESTA          */}
                    {/* ============================================================== */}
                    {expandedPresupuestoId === p.id && (
                      <div className="mt-5 pt-5 border-t border-white/10 space-y-5 animate-in fade-in duration-200">
                        
                        {/* 1. Tabla de Ítems / Servicios Cotizados */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                              <Layers className="h-4 w-4" />
                              Ítems y Servicios Cotizados ({p.items?.length || 0})
                            </span>
                            {p.moneda && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                                Moneda: {p.moneda} {p.moneda === "UF" && p.valorUFReferencial ? `(UF Ref: $${p.valorUFReferencial.toLocaleString()})` : ""}
                              </span>
                            )}
                          </div>

                          <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-950/70">
                            <div className="grid grid-cols-12 gap-2 p-3 bg-white/5 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-white/10">
                              <div className="col-span-7 sm:col-span-8">Descripción del Servicio</div>
                              <div className="col-span-2 text-center">Cant.</div>
                              <div className="col-span-3 sm:col-span-2 text-right">Subtotal</div>
                            </div>

                            <div className="divide-y divide-white/5 text-xs">
                              {(p.items && p.items.length > 0) ? (
                                p.items.map((it, idx) => (
                                  <div key={idx} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-white/[0.02]">
                                    <div className="col-span-7 sm:col-span-8">
                                      <p className="font-bold text-foreground">{it.descripcion}</p>
                                      {it.precio > 0 && it.cantidad > 1 && (
                                        <p className="text-[10px] font-mono text-muted-foreground">
                                          Unitario: {formatCurrency(it.precio)}
                                        </p>
                                      )}
                                    </div>
                                    <div className="col-span-2 text-center font-mono font-bold text-slate-300">
                                      {it.cantidad}
                                    </div>
                                    <div className="col-span-3 sm:col-span-2 text-right font-mono font-bold text-emerald-400">
                                      {formatCurrency(it.total)}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-4 text-center text-muted-foreground italic text-xs">
                                  Sin desglose de ítems registrados en este documento.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. Grid de Resumen: Continuidad y Estructura 50/50 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* Bloque Continuidad Operativa & Hosting */}
                          <div className="p-4 rounded-xl border border-white/10 bg-slate-950/50 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                              🌐 Continuidad Operativa & Hosting
                            </span>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between font-bold text-slate-200">
                                <span>Modalidad:</span>
                                <span className="text-primary capitalize">
                                  {p.bloqueContinuidad?.modalidad === "ano_1_incluido" || p.bloqueContinuidad?.modalidad === "incluido_ano1"
                                    ? "Año 1 Incluido en desarrollo" 
                                    : p.bloqueContinuidad?.modalidad === "mensual" || p.bloqueContinuidad?.modalidad === "recurrente_mensual"
                                      ? "Pago Mensual Recurrente" 
                                      : p.bloqueContinuidad?.modalidad ? "Pago Anual Recurrente" : "Hosting administrado"}
                                </span>
                              </div>
                              {(p.bloqueContinuidad?.montoRecurrente || p.bloqueContinuidad?.monto) ? (
                                <div className="flex justify-between font-mono font-bold text-indigo-300">
                                  <span>Valor Continuidad:</span>
                                  <span>
                                    {p.moneda === "UF" || p.bloqueContinuidad?.monedaRecurrente === "UF"
                                      ? `${p.bloqueContinuidad.montoRecurrente ?? p.bloqueContinuidad.monto} UF/mes` 
                                      : `${formatCurrency(p.bloqueContinuidad.montoRecurrente ?? p.bloqueContinuidad.monto)}/mes`}
                                  </span>
                                </div>
                              ) : null}
                              <p className="text-[11px] text-muted-foreground pt-1 border-t border-white/5">
                                {p.bloqueContinuidad?.detalle || "Hosting Reseller cPanel, casillas corporativas y SSL."}
                              </p>
                            </div>
                          </div>

                          {/* Bloque Desglose Financiero 50/50 */}
                          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                              💼 Esquema de Pago Estándar (50% / 50%)
                            </span>
                            <div className="text-xs space-y-1.5 font-mono">
                              <div className="flex justify-between text-muted-foreground">
                                <span>Monto Neto:</span>
                                <span className="font-bold text-slate-200">{formatCurrency(p.totales?.neto || 0)}</span>
                              </div>
                              <div className="flex justify-between text-muted-foreground">
                                <span>IVA (19%):</span>
                                <span className="font-bold text-sky-400">+{formatCurrency(p.totales?.iva || 0)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-white pt-1 border-t border-white/10 text-sm">
                                <span>Total Cotizado:</span>
                                <span className="text-emerald-400">{formatCurrency(p.totales?.total || 0)}</span>
                              </div>
                              <div className="flex justify-between text-[11px] text-emerald-300 font-sans pt-1">
                                <span>1. Anticipo Inicio (50%):</span>
                                <span className="font-mono font-bold">{formatCurrency(Math.round((p.totales?.total || 0) * 0.5))}</span>
                              </div>
                              <div className="flex justify-between text-[11px] text-emerald-300 font-sans">
                                <span>2. Saldo Entrega (50%):</span>
                                <span className="font-mono font-bold">{formatCurrency((p.totales?.total || 0) - Math.round((p.totales?.total || 0) * 0.5))}</span>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Enlace Público Interactivo si existe */}
                        {p.tokenPublico && (
                          <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-xs">
                              <span className="font-bold text-indigo-300 block">
                                🌐 Propuesta Interactiva para el Cliente
                              </span>
                              <span className="text-slate-400 text-[11px]">
                                El cliente puede revisar la cotización en línea y presionar &quot;Aceptar Propuesta&quot;.
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const url = `${window.location.origin}/propuesta/${p.tokenPublico}`;
                                  navigator.clipboard.writeText(url);
                                  toast.success("Enlace público copiado al portapapeles");
                                }}
                                className="h-8 text-xs font-bold border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20"
                              >
                                Copiar Link
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => window.open(`/propuesta/${p.tokenPublico}`, '_blank')}
                                className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white gap-1"
                              >
                                Abrir <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Modal para Registrar Seguimiento Comercial */}
        <Dialog open={followUpModalOpen} onOpenChange={setFollowUpModalOpen}>
          <DialogContent className="sm:max-w-[480px] border border-white/15 bg-card shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Registrar Seguimiento Comercial
              </DialogTitle>
              <p className="text-xs text-slate-400">
                Cotización N° <strong className="text-foreground">{selectedForFollowUp?.numero}</strong> &bull; {selectedForFollowUp?.cliente_nombre}
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-400">Canal de Contacto</Label>
                <Select value={followUpTipo} onValueChange={(val) => { if (val) setFollowUpTipo(val); }}>
                  <SelectTrigger className="h-11 rounded-xl bg-muted/40 border border-white/15 text-sm font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-foreground">
                    <SelectItem value="llamada">📞 Llamada Telefónica</SelectItem>
                    <SelectItem value="whatsapp">💬 Chat WhatsApp</SelectItem>
                    <SelectItem value="correo">📧 Correo Electrónico</SelectItem>
                    <SelectItem value="reunion">👥 Reunión Presencial / Meet</SelectItem>
                    <SelectItem value="otro">⚙️ Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-400">Notas / Respuesta del Cliente</Label>
                <Textarea
                  value={followUpNota}
                  onChange={(e) => setFollowUpNota(e.target.value)}
                  placeholder="Ej. El cliente revisará la propuesta técnica con su socio y nos dará respuesta el viernes."
                  rows={4}
                  className="rounded-xl bg-muted/40 border border-white/15 text-sm font-medium leading-relaxed resize-none placeholder:text-slate-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200">
                💡 Al registrar este seguimiento, la alerta de <strong>&ldquo;Cotización sin respuesta&rdquo;</strong> se despejará automáticamente y el estado se actualizará a <strong>&ldquo;En Negociación&rdquo;</strong>.
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setFollowUpModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveFollowUp}
                disabled={!followUpNota.trim()}
                className="bg-primary text-primary-foreground font-black text-xs rounded-xl h-10 px-5"
              >
                Guardar Seguimiento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
};
