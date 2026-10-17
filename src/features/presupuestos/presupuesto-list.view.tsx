"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Eye,
  Download,
  AlertTriangle,
  Briefcase,
  Clock,
  Pencil,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  FileText,
  Loader2,
  Sparkles,
  Save
} from "lucide-react";
import { Presupuesto, PresupuestoEstado, Cliente, FechaRegistro, PresupuestoSeguimiento } from "@/lib/types";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
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
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  onLogout?: () => void;
  loading: boolean;
}

type SortColumn = "numero" | "cliente_nombre" | "createdAt" | "total" | "estado";
type SortDirection = "asc" | "desc";

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
  onRegisterFollowUp,
  loading
}) => {
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [filterMoneda, setFilterMoneda] = useState<string>("todas");
  const [filterDestinatario, setFilterDestinatario] = useState<string>("todos");
  const [sortColumn, setSortColumn] = useState<SortColumn>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modal para registrar y visualizar seguimiento comercial
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [selectedForFollowUp, setSelectedForFollowUp] = useState<Presupuesto | null>(null);
  const [followUpNota, setFollowUpNota] = useState("");
  const [followUpTipo, setFollowUpTipo] = useState<string>("llamada");

  const formatCurrency = (val: number = 0, moneda: string = "CLP") => {
    if (moneda === "UF") {
      return `${val.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} UF`;
    }
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);
  };

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

  // Contadores memoizados con todas las opciones disponibles
  const { 
    totalCount, 
    alertasCount, 
    enviadosCount, 
    negociacionCount, 
    aprobadosCount, 
    borradoresCount, 
    rechazadosCount,
    vencidosCount,
    conProyectoCount
  } = useMemo(() => {
    let alertas = 0;
    let enviados = 0;
    let negociacion = 0;
    let aprobados = 0;
    let borradores = 0;
    let rechazados = 0;
    let vencidos = 0;
    let conProyecto = 0;

    for (const p of presupuestos) {
      if (getAlertInfo(p)) alertas++;
      if (p.proyecto_id) conProyecto++;

      if (p.estado === "vencido") vencidos++;
      else if (p.estado === "enviado" || p.estado === "emitido") enviados++;
      else if (p.estado === "en_negociacion") negociacion++;
      else if (p.estado === "aprobado") aprobados++;
      else if (p.estado === "rechazado") rechazados++;
      else if (!p.estado || p.estado === "borrador") borradores++;
    }

    return {
      totalCount: presupuestos.length,
      alertasCount: alertas,
      enviadosCount: enviados,
      negociacionCount: negociacion,
      aprobadosCount: aprobados,
      borradoresCount: borradores,
      rechazadosCount: rechazados,
      vencidosCount: vencidos,
      conProyectoCount: conProyecto,
    };
  }, [presupuestos]);

  // Filtrado memoizado multi-campo flexible y preciso
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return presupuestos.filter((p) => {
      const matchesSearch =
        !q ||
        (p.cliente_nombre || "").toLowerCase().includes(q) ||
        (p.numero || "").toLowerCase().includes(q) ||
        `cot-${(p.numero || "").toLowerCase()}`.includes(q) ||
        (p.nombre_proyecto || "").toLowerCase().includes(q) ||
        (p.descripcion_proyecto || "").toLowerCase().includes(q) ||
        (p.estado || "").toLowerCase().includes(q) ||
        (p.totales?.total?.toString() || "").includes(q) ||
        (p.items || []).some((item) => item.descripcion.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // 1. Filtro por Moneda
      if (filterMoneda !== "todas") {
        const mon = p.moneda || "CLP";
        if (mon !== filterMoneda) return false;
      }

      // 2. Filtro por Destinatario (Cliente vs Prospecto)
      if (filterDestinatario !== "todos") {
        const cl = clientes.find(c => c.id === p.cliente_id || c.nombre === p.cliente_nombre);
        const tipoReg = cl?.tipo_registro || (cl?.estado === "prospecto" ? "prospecto" : "cliente");
        if (filterDestinatario === "cliente" && tipoReg !== "cliente") return false;
        if (filterDestinatario === "prospecto" && tipoReg !== "prospecto") return false;
      }

      // 3. Filtro por Estado Comercial
      if (filterEstado === "todos") return true;
      if (filterEstado === "alertas") return !!getAlertInfo(p);
      if (filterEstado === "con_proyecto") return !!p.proyecto_id;
      if (filterEstado === "enviado") return p.estado === "enviado" || p.estado === "emitido";
      if (filterEstado === "borrador") return !p.estado || p.estado === "borrador";
      return p.estado === filterEstado;
    });
  }, [presupuestos, search, filterEstado, filterMoneda, filterDestinatario, clientes]);

  const getTimestamp = (val?: FechaRegistro | string) => {
    if (!val) return 0;
    if (typeof val === "string") return new Date(val).getTime() || 0;
    if (typeof val === "object" && "seconds" in val) return val.seconds * 1000;
    return 0;
  };

  // Ordenamiento memoizado
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortColumn === "numero") {
        const numA = parseInt(a.numero.replace(/\D/g, "") || "0", 10);
        const numB = parseInt(b.numero.replace(/\D/g, "") || "0", 10);
        comparison = numA - numB;
      } else if (sortColumn === "cliente_nombre") {
        comparison = (a.cliente_nombre || "").localeCompare(b.cliente_nombre || "");
      } else if (sortColumn === "createdAt") {
        const aDate = getTimestamp(a.createdAt || a.fecha);
        const bDate = getTimestamp(b.createdAt || b.fecha);
        comparison = aDate - bDate;
      } else if (sortColumn === "total") {
        const totalA = a.totales?.total || 0;
        const totalB = b.totales?.total || 0;
        comparison = totalA - totalB;
      } else if (sortColumn === "estado") {
        const estA = a.estado || "borrador";
        const estB = b.estado || "borrador";
        comparison = estA.localeCompare(estB);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filtered, sortColumn, sortDirection]);

  // Paginación memoizada
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = useMemo(() => {
    return sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [sorted, currentPage, pageSize]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground/60 ml-1 inline-block" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-primary ml-1 inline-block" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary ml-1 inline-block" />
    );
  };

  const getEstadoBadgeStyle = (estado?: PresupuestoEstado) => {
    switch (estado) {
      case "enviado":
      case "emitido":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "en_negociacion":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      case "aprobado":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "rechazado":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "vencido":
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
      case "borrador":
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getEstadoLabel = (estado?: PresupuestoEstado) => {
    switch (estado) {
      case "enviado":
      case "emitido":
        return "📤 Enviado";
      case "en_negociacion":
        return "💬 Negociación";
      case "aprobado":
        return "✅ Aprobado";
      case "rechazado":
        return "❌ Rechazado";
      case "vencido":
        return "⏸️ Vencido";
      case "borrador":
      default:
        return "📝 Borrador";
    }
  };

  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);

  const getSeguimientoBadge = (tipo?: string) => {
    switch (tipo) {
      case "llamada":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "whatsapp":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "correo":
        return "bg-sky-500/20 text-sky-300 border-sky-500/30";
      case "reunion":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "nota":
      default:
        return "bg-slate-700/40 text-slate-300 border-slate-600/40";
    }
  };

  const getSeguimientoLabel = (tipo?: string) => {
    switch (tipo) {
      case "llamada":
        return "📞 Llamada";
      case "whatsapp":
        return "💬 WhatsApp";
      case "correo":
        return "✉️ Correo";
      case "reunion":
        return "🤝 Reunión";
      case "nota":
      default:
        return "📝 Nota Interna";
    }
  };

  const formatFollowUpDate = (fechaStr?: string) => {
    if (!fechaStr) return "";
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return fechaStr;
      return d.toLocaleString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return fechaStr;
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
    setIsSavingFollowUp(true);
    try {
      await onRegisterFollowUp(selectedForFollowUp, followUpNota, followUpTipo);
      const nuevo: PresupuestoSeguimiento = {
        fecha: new Date().toISOString(),
        nota: followUpNota.trim(),
        tipo: followUpTipo as any,
        autor: "Tú",
      };
      setSelectedForFollowUp(prev => prev ? {
        ...prev,
        historialSeguimientos: [...(prev.historialSeguimientos || []), nuevo],
        ultimoSeguimiento: nuevo,
      } : null);
      setFollowUpNota("");
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  return (
    <TooltipProvider delay={150}>
      <div className="flex flex-col min-h-full px-3 py-6 sm:px-6 sm:py-8 max-w-7xl mx-auto space-y-6 w-full">
        
        {/* 1. Header Principal Limpio y Ejecutivo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Presupuestos & Cotizaciones
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Directorio de propuestas comerciales, control de estados y conversión a proyectos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={onNew} 
              className="rounded-2xl px-5 py-2.5 h-11 bg-primary text-primary-foreground font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all gap-2 text-xs sm:text-sm"
            >
              <Plus className="h-4 w-4" /> Nuevo Presupuesto
            </Button>
          </div>
        </div>

        {/* 2. Buscador y Filtros Dinámicos */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por cliente, N° cotización, proyecto, ítems o monto..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-24 py-3 sm:py-5 text-xs sm:text-sm rounded-2xl bg-card border border-white/10 focus-visible:border-primary shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/60 px-2 py-1 rounded-lg"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Pastillas de Filtro por Estado */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold pb-1 scrollbar-none flex-wrap">
              <button
                onClick={() => { setFilterEstado("todos"); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterEstado === "todos"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                }`}
              >
                Todos ({totalCount})
              </button>

              <button
                onClick={() => { setFilterEstado("borrador"); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterEstado === "borrador"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                }`}
              >
                📝 Borradores ({borradoresCount})
              </button>

              <button
                onClick={() => { setFilterEstado("enviado"); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterEstado === "enviado"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                }`}
              >
                📤 Enviados ({enviadosCount})
              </button>

              <button
                onClick={() => { setFilterEstado("en_negociacion"); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterEstado === "en_negociacion"
                    ? "bg-sky-500 text-white shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                }`}
              >
                💬 En Negociación ({negociacionCount})
              </button>

              <button
                onClick={() => { setFilterEstado("aprobado"); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterEstado === "aprobado"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                }`}
              >
                ✅ Aprobados ({aprobadosCount})
              </button>

              <button
                onClick={() => { setFilterEstado("rechazado"); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterEstado === "rechazado"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                }`}
              >
                ❌ Rechazados ({rechazadosCount})
              </button>

              <button
                onClick={() => { setFilterEstado("vencido"); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterEstado === "vencido"
                    ? "bg-zinc-700 text-white shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                }`}
              >
                ⏸️ Vencidos ({vencidosCount})
              </button>

              <button
                onClick={() => { setFilterEstado("con_proyecto"); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterEstado === "con_proyecto"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                }`}
              >
                🚀 Con Proyecto ({conProyectoCount})
              </button>

              {alertasCount > 0 && (
                <button
                  onClick={() => { setFilterEstado("alertas"); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                    filterEstado === "alertas"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>Sin Respuesta ({alertasCount})</span>
                </button>
              )}
            </div>

            {/* Barra de Filtros Secundarios y Conteo */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-white/5">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Selector de Moneda */}
                <div className="w-36">
                  <Select 
                    value={filterMoneda} 
                    onValueChange={(val) => { 
                      setFilterMoneda(val || "todas"); 
                      setCurrentPage(1); 
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs rounded-xl bg-card/80 border-white/10 text-foreground font-semibold">
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/15 text-foreground text-xs font-semibold">
                      <SelectItem value="todas">🪙 Todas Monedas</SelectItem>
                      <SelectItem value="CLP">🇨🇱 Solo CLP ($)</SelectItem>
                      <SelectItem value="UF">📐 Solo UF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selector de Destinatario */}
                <div className="w-44">
                  <Select 
                    value={filterDestinatario} 
                    onValueChange={(val) => { 
                      setFilterDestinatario(val || "todos"); 
                      setCurrentPage(1); 
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs rounded-xl bg-card/80 border-white/10 text-foreground font-semibold">
                      <SelectValue placeholder="Destinatario" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/15 text-foreground text-xs font-semibold">
                      <SelectItem value="todos">👥 Todos Destinatarios</SelectItem>
                      <SelectItem value="cliente">🏢 Solo Clientes</SelectItem>
                      <SelectItem value="prospecto">🎯 Solo Prospectos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Restablecer Filtros si hay alguno activo */}
                {(filterEstado !== "todos" || filterMoneda !== "todas" || filterDestinatario !== "todos" || search) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterEstado("todos");
                      setFilterMoneda("todas");
                      setFilterDestinatario("todos");
                      setSearch("");
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl"
                  >
                    ✕ Restablecer Filtros
                  </Button>
                )}
              </div>

              <span className="text-xs font-mono font-bold text-muted-foreground">
                Mostrando {sorted.length} de {presupuestos.length} cotizaciones
              </span>
            </div>
          </div>
        </div>

        {/* 3. Tabla Ejecutiva Densa, Ordenable y Paginada */}
        <div className="rounded-3xl border border-white/10 bg-card/75 backdrop-blur-md shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Cargando propuestas comerciales...</span>
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground italic text-xs">
              No se encontraron presupuestos que coincidan con la búsqueda o filtro activo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-xs">
                <TableHeader className="bg-muted/30 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    {/* Columna N° Cotización */}
                    <TableHead 
                      className="font-black text-foreground py-3.5 pl-4 sm:pl-6 cursor-pointer select-none hover:text-primary transition-colors"
                      onClick={() => handleSort("numero")}
                    >
                      <span className="inline-flex items-center">
                        N° Presupuesto {renderSortIcon("numero")}
                      </span>
                    </TableHead>

                    {/* Columna Cliente */}
                    <TableHead 
                      className="font-black text-foreground py-3.5 cursor-pointer select-none hover:text-primary transition-colors"
                      onClick={() => handleSort("cliente_nombre")}
                    >
                      <span className="inline-flex items-center">
                        Cliente / Solicitante {renderSortIcon("cliente_nombre")}
                      </span>
                    </TableHead>

                    {/* Columna Proyecto / Objeto */}
                    <TableHead className="font-black text-foreground py-3.5">
                      Proyecto / Asunto
                    </TableHead>

                    {/* Columna Fecha */}
                    <TableHead 
                      className="font-black text-foreground py-3.5 cursor-pointer select-none hover:text-primary transition-colors"
                      onClick={() => handleSort("createdAt")}
                    >
                      <span className="inline-flex items-center">
                        Fecha {renderSortIcon("createdAt")}
                      </span>
                    </TableHead>

                    {/* Columna Estado con selector rápido */}
                    <TableHead 
                      className="font-black text-foreground py-3.5 cursor-pointer select-none hover:text-primary transition-colors"
                      onClick={() => handleSort("estado")}
                    >
                      <span className="inline-flex items-center">
                        Estado {renderSortIcon("estado")}
                      </span>
                    </TableHead>

                    {/* Columna Total */}
                    <TableHead 
                      className="font-black text-foreground py-3.5 text-right cursor-pointer select-none hover:text-primary transition-colors"
                      onClick={() => handleSort("total")}
                    >
                      <span className="inline-flex items-center justify-end">
                        Total {renderSortIcon("total")}
                      </span>
                    </TableHead>

                    {/* Columna Acciones */}
                    <TableHead className="font-black text-foreground py-3.5 text-right pr-4 sm:pr-6">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginated.map((p) => {
                    const alertInfo = getAlertInfo(p);
                    const clienteObj = clientes.find((c) => c.id === p.cliente_id || c.nombre === p.cliente_nombre);
                    const clienteTelefono = clienteObj?.telefono || "";
                    const totalVal = p.totales?.total || 0;
                    const moneda = p.moneda || "CLP";

                    let fechaFormatted = "—";
                    const rawDate = p.fecha || p.createdAt;
                    if (rawDate) {
                      try {
                        const d = typeof rawDate === "string" 
                          ? new Date(rawDate) 
                          : new Date((rawDate as { seconds: number }).seconds * 1000);
                        fechaFormatted = d.toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        });
                      } catch {
                        fechaFormatted = "—";
                      }
                    }

                    return (
                      <TableRow 
                        key={p.id}
                        onClick={() => onView(p)}
                        className={`hover:bg-muted/20 border-b border-border/40 transition-colors group cursor-pointer ${
                          alertInfo ? "bg-amber-500/5 hover:bg-amber-500/10" : ""
                        }`}
                      >
                        {/* 1. N° Presupuesto */}
                        <TableCell className="py-3.5 pl-4 sm:pl-6">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-foreground text-xs group-hover:text-primary transition-colors">
                              COT #{p.numero}
                            </span>
                            {p.version && p.version > 1 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground font-mono font-bold">
                                v{p.version}
                              </span>
                            )}
                            {alertInfo && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[11px] font-bold">
                                  {alertInfo.diffDays} días sin respuesta desde {alertInfo.fechaRefStr}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>

                        {/* 2. Cliente */}
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-[#2e3c7e] to-[#abaafd] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                              {(p.cliente_nombre || "C").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-foreground block truncate">
                                {p.cliente_nombre || "Cliente sin registrar"}
                              </span>
                              {clienteTelefono && (
                                <span className="text-[11px] font-mono text-muted-foreground block truncate">
                                  {clienteTelefono}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* 3. Proyecto / Asunto */}
                        <TableCell className="py-3.5 max-w-[220px]">
                          <span className="font-semibold text-foreground block truncate">
                            {p.nombre_proyecto || p.descripcion_proyecto || "Servicios Digitales Hoja SpA"}
                          </span>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {p.items?.length || 0} ítem(s) cotizado(s)
                          </span>
                        </TableCell>

                        {/* 4. Fecha */}
                        <TableCell className="py-3.5 font-mono text-[11px] text-muted-foreground">
                          {fechaFormatted}
                        </TableCell>

                        {/* 5. Estado con Selector Rápido */}
                        <TableCell className="py-3.5" onClick={(e) => e.stopPropagation()}>
                          <Select 
                            value={p.estado || "borrador"} 
                            onValueChange={(val) => {
                              if (val) onUpdateEstado(p, val as PresupuestoEstado);
                            }}
                          >
                            <SelectTrigger className={`h-7 rounded-lg px-2 text-[10px] font-black border ${getEstadoBadgeStyle(p.estado)}`}>
                              <SelectValue>{getEstadoLabel(p.estado)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/15 text-foreground font-bold">
                              <SelectItem value="borrador">📝 Borrador</SelectItem>
                              <SelectItem value="enviado">📤 Enviado</SelectItem>
                              <SelectItem value="en_negociacion">💬 En Negociación</SelectItem>
                              <SelectItem value="aprobado">✅ Aprobado</SelectItem>
                              <SelectItem value="rechazado">❌ Rechazado</SelectItem>
                              <SelectItem value="vencido">⏸️ Vencido</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* 6. Total */}
                        <TableCell className="py-3.5 text-right">
                          <span className="font-mono font-black text-sm text-foreground">
                            {formatCurrency(totalVal, moneda)}
                          </span>
                          {moneda === "UF" && (
                            <span className="block text-[10px] text-muted-foreground font-mono">
                              (${Math.round(totalVal * (p.valorUFReferencial || 38000)).toLocaleString("es-CL")})
                            </span>
                          )}
                        </TableCell>

                        {/* 7. Acciones Rápidas */}
                        <TableCell className="py-3.5 text-right pr-4 sm:pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Vista Previa */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onView(p)}
                              className="h-7 w-7 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
                              title="Ver Vista Previa"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {/* Descargar PDF */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDownload(p)}
                              className="h-7 w-7 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary"
                              title="Descargar PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>

                            {/* WhatsApp Directo */}
                            {clienteTelefono && (
                              <WhatsAppButton
                                telefono={clienteTelefono}
                                clienteNombre={p.cliente_nombre}
                                size="sm"
                                className="h-7 px-2 text-[10px] rounded-lg shadow-none"
                              />
                            )}

                            {/* Editar */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(p.id!)}
                              className="h-7 w-7 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
                              title="Editar Presupuesto"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            {/* Convertir a Proyecto (si está aprobado o listo) */}
                            {p.estado === "aprobado" && !p.proyecto_id && (
                              <Button
                                size="sm"
                                onClick={() => onCreateProject(p)}
                                className="h-7 px-2 text-[10px] font-black rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 gap-1"
                                title="Crear proyecto a partir de esta cotización"
                              >
                                <Briefcase className="h-3 w-3" /> Crear Proyecto
                              </Button>
                            )}

                            {/* Registrar y Visualizar Notas Comerciales */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openFollowUpModal(p)}
                              className="h-7 w-7 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-sky-400 relative"
                              title="Ver historial y registrar notas comerciales"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              {(p.historialSeguimientos?.length || 0) > 0 && (
                                <span className="absolute -top-1 -right-1 h-3.5 min-w-3.5 px-0.5 rounded-full bg-sky-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-xs">
                                  {p.historialSeguimientos?.length}
                                </span>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 4. Footer de Paginación */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-border/40 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Filas por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-card border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="font-mono">
                Página {currentPage} de {totalPages} ({sorted.length} registros)
              </span>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-xl h-8 px-2.5 text-xs gap-1 border-border"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </Button>

              <span className="px-2 font-mono font-bold text-foreground">
                {currentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl h-8 px-2.5 text-xs gap-1 border-border"
              >
                Siguiente <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Modal de Historial y Registro de Notas Comerciales */}
        <Dialog open={followUpModalOpen} onOpenChange={setFollowUpModalOpen}>
          <DialogContent className="!max-w-2xl max-h-[88vh] flex flex-col p-5 sm:p-6 bg-card border border-white/10 shadow-2xl rounded-3xl overflow-hidden">
            <DialogHeader className="pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Trazabilidad & Notas Comerciales</span>
                </DialogTitle>
                {selectedForFollowUp && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getEstadoBadgeStyle(selectedForFollowUp.estado)}`}>
                    {selectedForFollowUp.estado?.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cotización N° {selectedForFollowUp?.numero} &bull; {selectedForFollowUp?.cliente_nombre}
                {selectedForFollowUp?.totales?.total ? ` &bull; Total: ${formatCurrency(selectedForFollowUp.totales.total, selectedForFollowUp.moneda)}` : ""}
              </p>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 text-xs scrollbar-thin scrollbar-thumb-muted">
              {/* 1. Historial de Notas Previas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-primary" />
                    Historial Registrado ({selectedForFollowUp?.historialSeguimientos?.length || 0})
                  </span>
                  {selectedForFollowUp?.ultimoSeguimiento?.fecha && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Último contacto: {formatFollowUpDate(selectedForFollowUp.ultimoSeguimiento.fecha)}
                    </span>
                  )}
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-muted/20 border border-white/5 scrollbar-thin scrollbar-thumb-muted">
                  {(!selectedForFollowUp?.historialSeguimientos || selectedForFollowUp.historialSeguimientos.length === 0) ? (
                    <div className="py-8 text-center text-xs text-muted-foreground italic flex flex-col items-center justify-center gap-2">
                      <FileText className="h-6 w-6 opacity-30 text-muted-foreground" />
                      <span>No hay notas o interacciones comerciales registradas aún para esta cotización.</span>
                    </div>
                  ) : (
                    [...(selectedForFollowUp.historialSeguimientos)]
                      .reverse()
                      .map((seg, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-card/90 border border-white/10 space-y-1.5 shadow-xs">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${getSeguimientoBadge(seg.tipo)}`}>
                                {getSeguimientoLabel(seg.tipo)}
                              </span>
                              <span className="font-bold text-foreground text-xs">
                                {seg.autor || "Equipo Hoja SpA"}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {formatFollowUpDate(seg.fecha)}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed pl-0.5">
                            {seg.nota}
                          </p>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* 2. Formulario de Nueva Nota */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-sky-400" />
                  Nueva Nota o Interacción Comercial
                </span>

                {/* Selector de Tipo */}
                <div className="space-y-1.5">
                  <Label className="font-bold text-foreground text-xs">Tipo de Interacción</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFollowUpTipo("llamada")}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        followUpTipo === "llamada" 
                          ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm" 
                          : "bg-muted/30 border-white/10 text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      📞 Llamada
                    </button>
                    <button
                      type="button"
                      onClick={() => setFollowUpTipo("whatsapp")}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        followUpTipo === "whatsapp" 
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" 
                          : "bg-muted/30 border-white/10 text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      💬 WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setFollowUpTipo("correo")}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        followUpTipo === "correo" 
                          ? "bg-sky-500 text-white border-sky-500 shadow-sm" 
                          : "bg-muted/30 border-white/10 text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      ✉️ Correo
                    </button>
                    <button
                      type="button"
                      onClick={() => setFollowUpTipo("reunion")}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        followUpTipo === "reunion" 
                          ? "bg-purple-500 text-white border-purple-500 shadow-sm" 
                          : "bg-muted/30 border-white/10 text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      🤝 Reunión
                    </button>
                    <button
                      type="button"
                      onClick={() => setFollowUpTipo("nota")}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        followUpTipo === "nota" 
                          ? "bg-slate-700 text-white border-slate-600 shadow-sm" 
                          : "bg-muted/30 border-white/10 text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      📝 Nota Interna
                    </button>
                  </div>
                </div>

                {/* Plantillas / Chips Rápidos */}
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-medium block">
                    Plantillas rápidas (haz clic para insertar):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      "Propuesta en revisión por gerencia",
                      "Solicita ajuste en alcance / monto",
                      "Reunión de aclaración agendada",
                      "Aprobación verbal confirmada",
                      "Sin respuesta tras llamada"
                    ].map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setFollowUpNota((prev) => prev ? `${prev} • ${chip}` : chip);
                        }}
                        className="text-[10px] px-2 py-1 rounded-lg bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-white/5 transition-all font-medium"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea Detalle */}
                <div className="space-y-1.5">
                  <Label className="font-bold text-foreground text-xs">Detalle o Acuerdo Comercial *</Label>
                  <Textarea 
                    rows={3}
                    placeholder="Escribe acuerdos alcanzados, observaciones, fechas de recontacto o requerimientos adicionales..."
                    value={followUpNota}
                    onChange={(e) => setFollowUpNota(e.target.value)}
                    className="rounded-xl bg-muted/30 border border-white/10 text-xs resize-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-white/10 gap-2 sm:gap-0 shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setFollowUpModalOpen(false)}
                className="rounded-xl text-xs h-9 px-4 border-white/10"
              >
                Cerrar
              </Button>
              <Button 
                onClick={handleSaveFollowUp}
                disabled={!followUpNota.trim() || isSavingFollowUp}
                className="rounded-xl text-xs font-black bg-primary text-primary-foreground h-9 px-5 gap-1.5 shadow-md shadow-primary/20"
              >
                {isSavingFollowUp ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>Guardar Nota Comercial</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};
