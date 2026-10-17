"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Mail, 
  Globe, 
  Calendar, 
  UserCheck,
  FileEdit,
  UserX,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RefreshCw
} from "lucide-react";
import { Cliente, FechaRegistro, SubEstadoProspecto } from "@/lib/types";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { ClientesMetrics } from "./clientes-metrics";
import dynamic from "next/dynamic";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const ClienteTabsDetail = dynamic(
  () => import("./cliente-tabs-detail").then((m) => m.ClienteTabsDetail),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center p-12 h-full text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Cargando detalles operativos del cliente...</p>
      </div>
    ),
  }
);

const ClienteQuickModal = dynamic(
  () => import("./cliente-quick-modal").then((m) => m.ClienteQuickModal),
  { ssr: false }
);
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClientesListViewProps {
  clientes: Cliente[];
  search: string;
  setSearch: (val: string) => void;
  onRefresh: () => void;
  onInhabilitar?: (id: string) => Promise<void>;
  onReactivar?: (id: string, tipo?: "prospecto" | "cliente") => Promise<void>;
  onToggleSubEstado?: (id: string, currentSubEstado?: SubEstadoProspecto) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  loading: boolean;
}

type SortColumn = "nombre" | "tipo" | "sub_estado" | "createdAt" | "proximoRecordatorio";
type SortDirection = "asc" | "desc";

export const ClientesListView: React.FC<ClientesListViewProps> = ({
  clientes,
  search,
  setSearch,
  onRefresh,
  onInhabilitar,
  onReactivar,
  onToggleSubEstado,
  loading,
}) => {
  // Filtros primarios y secundarios
  const [filterPrimary, setFilterPrimary] = useState<"todos" | "clientes" | "prospectos" | "inactivos">("todos");
  const [prospectSubFilter, setProspectSubFilter] = useState<"todos" | "sin_contacto" | "contactados">("todos");

  // Ordenamiento
  const [sortColumn, setSortColumn] = useState<SortColumn>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modales y Sheets
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  // Proceso de Inhabilitación en 2 pasos
  const [inactivateCandidate, setInactivateCandidate] = useState<Cliente | null>(null);
  const [inactivateStep, setInactivateStep] = useState<1 | 2 | null>(null);
  const [inactivating, setInactivating] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  // Reset de página al cambiar filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterPrimary, prospectSubFilter]);

  // Manejador de ordenamiento al hacer clic en columnas
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 opacity-40 ml-1 inline-block" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-primary ml-1 inline-block" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary ml-1 inline-block" />
    );
  };

  // Conteo de registros para badges de pestañas memoizado
  const { countActiveTotal, countClientesTotal, countProspectosTotal, countInactivosTotal } = useMemo(() => {
    let active = 0;
    let clientesCount = 0;
    let prospectosCount = 0;
    let inactivosCount = 0;

    for (const c of clientes) {
      const isInactive = c.activo === false || c.estado === "inactivo";
      const isProspecto = c.tipo_registro === "prospecto" || c.estado === "prospecto";
      if (isInactive) {
        inactivosCount++;
      } else {
        active++;
        if (isProspecto) {
          prospectosCount++;
        } else {
          clientesCount++;
        }
      }
    }
    return {
      countActiveTotal: active,
      countClientesTotal: clientesCount,
      countProspectosTotal: prospectosCount,
      countInactivosTotal: inactivosCount
    };
  }, [clientes]);

  // Filtrado memoizado de clientes
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return clientes.filter((c) => {
      const matchesSearch =
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        (c.contacto || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.rut || "").toLowerCase().includes(q) ||
        (c.telefono || "").includes(q);

      if (!matchesSearch) return false;

      const isInactive = c.activo === false || c.estado === "inactivo";
      const isProspecto = c.tipo_registro === "prospecto" || (!c.tipo_registro && c.estado === "prospecto");

      if (filterPrimary === "inactivos") {
        return isInactive;
      }

      if (isInactive) return false;

      if (filterPrimary === "todos") return true;

      if (filterPrimary === "clientes") {
        return !isProspecto;
      }

      if (filterPrimary === "prospectos") {
        if (!isProspecto) return false;
        if (prospectSubFilter === "todos") return true;
        if (prospectSubFilter === "sin_contacto") return !c.sub_estado || c.sub_estado === "sin_contacto";
        if (prospectSubFilter === "contactados") return c.sub_estado === "contactado";
        return true;
      }

      return true;
    });
  }, [clientes, search, filterPrimary, prospectSubFilter]);

  const getTimestamp = (val?: FechaRegistro) => {
    if (!val) return 0;
    if (typeof val === "string") return new Date(val).getTime() || 0;
    if (typeof val === "object" && "seconds" in val) return val.seconds * 1000;
    return 0;
  };

  // Ordenamiento memoizado de los registros filtrados
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortColumn === "nombre") {
        comparison = a.nombre.localeCompare(b.nombre);
      } else if (sortColumn === "tipo") {
        const aType = a.tipo_registro || (a.estado === "prospecto" ? "prospecto" : "cliente");
        const bType = b.tipo_registro || (b.estado === "prospecto" ? "prospecto" : "cliente");
        comparison = aType.localeCompare(bType);
      } else if (sortColumn === "sub_estado") {
        const aSub = a.sub_estado || "";
        const bSub = b.sub_estado || "";
        comparison = aSub.localeCompare(bSub);
      } else if (sortColumn === "createdAt") {
        const aDate = getTimestamp(a.createdAt);
        const bDate = getTimestamp(b.createdAt);
        comparison = aDate - bDate;
      } else if (sortColumn === "proximoRecordatorio") {
        const aRec = a.proximoRecordatorio || "";
        const bRec = b.proximoRecordatorio || "";
        comparison = aRec.localeCompare(bRec);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filtered, sortColumn, sortDirection]);

  // Paginación memoizada
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = useMemo(() => {
    return sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [sorted, currentPage, pageSize]);

  // Iniciar flujo de inhabilitación (Paso 1)
  const handleStartInhabilitar = (c: Cliente) => {
    setInactivateCandidate(c);
    setInactivateStep(1);
  };

  // Confirmar ejecución de inhabilitación (Paso 2)
  const handleExecuteInhabilitar = async () => {
    if (!inactivateCandidate?.id || !onInhabilitar) return;
    setInactivating(true);
    try {
      await onInhabilitar(inactivateCandidate.id);
      setInactivateStep(null);
      setInactivateCandidate(null);
      if (selectedCliente?.id === inactivateCandidate.id) {
        setSelectedCliente(null);
      }
    } finally {
      setInactivating(false);
    }
  };

  // Reactivar cliente
  const handleExecuteReactivar = async (c: Cliente) => {
    if (!c.id || !onReactivar) return;
    await onReactivar(c.id, c.tipo_registro || (c.estado === "prospecto" ? "prospecto" : "cliente"));
  };

  const formatFechaRegistro = (val?: FechaRegistro) => {
    if (!val) return "—";
    try {
      let d: Date;
      if (typeof val === "string") {
        d = new Date(val);
      } else if (typeof val === "object" && "seconds" in val) {
        d = new Date(val.seconds * 1000);
      } else {
        return "—";
      }
      return d.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="flex flex-col min-h-full px-3 py-6 sm:px-6 sm:py-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header del Módulo Clientes (limpio, sin etiquetas comerciales superfluas) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Clientes & Prospectos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Directorio de contactos comerciales, clientes activos, proyectos y tickets de soporte.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setQuickCreateOpen(true)}
            className="rounded-2xl px-5 py-2.5 h-11 bg-primary text-primary-foreground font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all gap-2 text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4" /> Nuevo Registro
          </Button>
        </div>
      </div>

      {/* 2. Métricas Superiores (Nuevos registros y Racha comercial) */}
      <ClientesMetrics clientes={clientes} />

      {/* 3. Barra de Búsqueda y Filtros Dinámicos */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa, contacto, RUT, teléfono o email..."
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

        {/* Pestañas de Filtro Primario: Todos | Clientes | Prospectos | Inactivos */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold pb-1 scrollbar-none">
            <button
              onClick={() => setFilterPrimary("todos")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterPrimary === "todos"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
              }`}
            >
              Todos ({countActiveTotal})
            </button>
            <button
              onClick={() => setFilterPrimary("clientes")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterPrimary === "clientes"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
              }`}
            >
              🚀 Clientes ({countClientesTotal})
            </button>
            <button
              onClick={() => setFilterPrimary("prospectos")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterPrimary === "prospectos"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
              }`}
            >
              🎯 Prospectos ({countProspectosTotal})
            </button>
            <button
              onClick={() => setFilterPrimary("inactivos")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterPrimary === "inactivos"
                  ? "bg-rose-500/80 text-white shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
              }`}
            >
              🚫 Inactivos ({countInactivosTotal})
            </button>
          </div>

          <span className="text-xs font-mono font-bold text-muted-foreground">
            {sorted.length} de {clientes.length} registros
          </span>
        </div>

        {/* Sub-filtros para Prospectos (Solo se despliegan en Prospectos) */}
        {filterPrimary === "prospectos" && (
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs font-bold">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 pl-1">
              Sub-categorías:
            </span>
            <button
              onClick={() => setProspectSubFilter("todos")}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                prospectSubFilter === "todos"
                  ? "bg-sky-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos los prospectos
            </button>
            <button
              onClick={() => setProspectSubFilter("sin_contacto")}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                prospectSubFilter === "sin_contacto"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ⏳ Sin Contacto
            </button>
            <button
              onClick={() => setProspectSubFilter("contactados")}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                prospectSubFilter === "contactados"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📞 Contactados
            </button>
          </div>
        )}
      </div>

      {/* 4. Tabla Densa, Legible, Ordenable y Paginada */}
      <div className="rounded-3xl border border-white/10 bg-card/75 backdrop-blur-md shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Cargando directorio de clientes...</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground italic text-xs">
            No se encontraron registros que coincidan con la búsqueda o filtro activo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-left text-xs">
              <TableHeader className="bg-muted/30 border-b border-border/60">
                <TableRow className="hover:bg-transparent">
                  {/* Columna Nombre (Ordenable) */}
                  <TableHead 
                    className="font-black text-foreground py-3.5 pl-4 sm:pl-6 cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => handleSort("nombre")}
                  >
                    <span className="inline-flex items-center">
                      Nombre Comercial / Contacto {renderSortIcon("nombre")}
                    </span>
                  </TableHead>

                  {/* Columna Tipo (Ordenable) */}
                  <TableHead 
                    className="font-black text-foreground py-3.5 cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => handleSort("tipo")}
                  >
                    <span className="inline-flex items-center">
                      Tipo {renderSortIcon("tipo")}
                    </span>
                  </TableHead>

                  {/* Columna Sub-Estado (Ordenable) */}
                  <TableHead 
                    className="font-black text-foreground py-3.5 cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => handleSort("sub_estado")}
                  >
                    <span className="inline-flex items-center">
                      Sub-Estado {renderSortIcon("sub_estado")}
                    </span>
                  </TableHead>

                  {/* Columna Canales y Datos Clave */}
                  <TableHead className="font-black text-foreground py-3.5">
                    Canales Clave
                  </TableHead>

                  {/* Columna Fecha Registro (Ordenable) */}
                  <TableHead 
                    className="font-black text-foreground py-3.5 cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => handleSort("createdAt")}
                  >
                    <span className="inline-flex items-center">
                      Fecha Registro {renderSortIcon("createdAt")}
                    </span>
                  </TableHead>

                  {/* Columna Próximo Recordatorio (Ordenable) */}
                  <TableHead 
                    className="font-black text-foreground py-3.5 cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => handleSort("proximoRecordatorio")}
                  >
                    <span className="inline-flex items-center">
                      Próximo Recordatorio {renderSortIcon("proximoRecordatorio")}
                    </span>
                  </TableHead>

                  {/* Acciones */}
                  <TableHead className="font-black text-foreground py-3.5 text-right pr-4 sm:pr-6">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.map((c) => {
                  const isInactive = c.activo === false || c.estado === "inactivo";
                  const isProspecto = c.tipo_registro === "prospecto" || (!c.tipo_registro && c.estado === "prospecto");
                  const subEstado = isProspecto ? (c.sub_estado || "sin_contacto") : "activo";

                  // Parse recordatorio
                  let recordatorioBadge = null;
                  if (c.proximoRecordatorio) {
                    const recDate = c.proximoRecordatorio.split("T")[0];
                    const isOverdue = recDate < todayStr && !c.recordatorioCompletado;
                    const isToday = recDate === todayStr && !c.recordatorioCompletado;

                    recordatorioBadge = (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        c.recordatorioCompletado
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : isOverdue
                          ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          : isToday
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        <Calendar className="h-3 w-3" />
                        {recDate}
                      </span>
                    );
                  }

                  return (
                    <TableRow 
                      key={c.id} 
                      className={`hover:bg-muted/20 border-b border-border/40 transition-colors group cursor-pointer ${
                        isInactive ? "opacity-60 bg-muted/10" : ""
                      }`}
                      onClick={() => setSelectedCliente(c)}
                    >
                      {/* 1. Nombre Comercial / Contacto */}
                      <TableCell className="py-3.5 pl-4 sm:pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm shadow-xs shrink-0 ${
                            isInactive 
                              ? "bg-muted text-muted-foreground" 
                              : isProspecto 
                              ? "bg-gradient-to-tr from-sky-600 to-sky-400 text-white" 
                              : "bg-gradient-to-tr from-[#2e3c7e] to-[#abaafd] text-white"
                          }`}>
                            {c.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-black text-sm text-foreground block truncate group-hover:text-primary transition-colors">
                              {c.nombre}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                              {c.contacto && (
                                <span className="flex items-center gap-1">
                                  <UserCheck className="h-3 w-3 text-muted-foreground/70" />
                                  {c.contacto}
                                </span>
                              )}
                              {c.rut && (
                                <span className="font-mono text-[10px] opacity-75">
                                  {c.rut}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Estado (Prospecto vs Cliente vs Inactivo) */}
                      <TableCell className="py-3.5">
                        {isInactive ? (
                          <Badge variant="outline" className="border-rose-500/40 text-rose-400 text-[10px] font-black bg-rose-500/10">
                            🚫 Inactivo
                          </Badge>
                        ) : isProspecto ? (
                          <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 text-[10px] font-black">
                            🎯 Prospecto
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-black">
                            🚀 Cliente
                          </Badge>
                        )}
                      </TableCell>

                      {/* 3. Sub-Estado Comercial */}
                      <TableCell className="py-3.5">
                        {isInactive ? (
                          <span className="text-muted-foreground font-mono text-[11px]">
                            Inhabilitado
                          </span>
                        ) : isProspecto ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSubEstado?.(c.id!, c.sub_estado);
                            }}
                            title={`Click rápido: alternar a ${subEstado === "contactado" ? "Sin Contacto" : "Contactado"}`}
                            className="group/sub cursor-pointer focus:outline-none"
                          >
                            {subEstado === "contactado" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold text-[10px] group-hover/sub:bg-sky-500/30 group-hover/sub:border-sky-500/50 transition-all hover:scale-105 active:scale-95 shadow-2xs">
                                📞 Contactado
                                <RefreshCw className="h-2.5 w-2.5 opacity-60 group-hover/sub:opacity-100 group-hover/sub:rotate-180 transition-all" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600 font-bold text-[10px] group-hover/sub:bg-slate-700 group-hover/sub:border-slate-500 transition-all hover:scale-105 active:scale-95 shadow-2xs">
                                ⏳ Sin Contacto
                                <RefreshCw className="h-2.5 w-2.5 opacity-60 group-hover/sub:opacity-100 group-hover/sub:rotate-180 transition-all" />
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold text-[10px]">
                            ● Activo
                          </span>
                        )}
                      </TableCell>

                      {/* 4. Canales & Datos Clave */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {c.telefono && (
                            <WhatsAppButton
                              telefono={c.telefono}
                              clienteNombre={c.nombre}
                              size="sm"
                              className="h-7 px-2 text-[10px] rounded-lg shadow-none"
                            />
                          )}
                          {c.email && (
                            <a
                              href={`mailto:${c.email}`}
                              title={c.email}
                              className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {c.social_web && (
                            <a
                              href={c.social_web.startsWith("http") ? c.social_web : `https://${c.social_web}`}
                              target="_blank"
                              rel="noreferrer"
                              title={c.social_web}
                              className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Globe className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </TableCell>

                      {/* 5. Fecha de Registro */}
                      <TableCell className="py-3.5 font-mono text-[11px] text-muted-foreground">
                        {formatFechaRegistro(c.createdAt)}
                      </TableCell>

                      {/* 6. Próximo Recordatorio */}
                      <TableCell className="py-3.5">
                        {recordatorioBadge || <span className="text-muted-foreground/40 font-mono">—</span>}
                      </TableCell>

                      {/* 7. Acciones Rápidas */}
                      <TableCell className="py-3.5 text-right pr-4 sm:pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCliente(c)}
                            className="h-8 px-2.5 rounded-xl text-primary hover:bg-primary/10 font-bold text-xs gap-1"
                          >
                            <FileEdit className="h-3.5 w-3.5" /> Ficha
                          </Button>

                          {isInactive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExecuteReactivar(c)}
                              className="h-8 px-2.5 rounded-xl text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 font-bold text-xs gap-1"
                              title="Reactivar registro"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Reactivar
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartInhabilitar(c)}
                              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                              title="Inhabilitar registro"
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 5. Controles de Paginación */}
        {sorted.length > 0 && (
          <div className="p-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-muted/10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>
                Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, sorted.length)} de {sorted.length} registros
              </span>
              <span className="hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]">Filas:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg bg-background border border-border px-2 py-1 text-xs text-foreground outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5 rounded-xl border-border text-xs gap-1 font-bold"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  // Mostrar primera, última y cercanas
                  if (
                    pNum === 1 || 
                    pNum === totalPages || 
                    (pNum >= currentPage - 1 && pNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pNum}
                        onClick={() => setCurrentPage(pNum)}
                        className={`h-8 w-8 rounded-xl font-bold transition-all ${
                          currentPage === pNum
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  }
                  if (pNum === currentPage - 2 || pNum === currentPage + 2) {
                    return <span key={pNum} className="text-muted-foreground px-0.5">...</span>;
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2.5 rounded-xl border-border text-xs gap-1 font-bold"
              >
                Siguiente <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Alta Rápida de Clientes / Prospectos */}
      {quickCreateOpen && (
        <ClienteQuickModal
          open={quickCreateOpen}
          onOpenChange={setQuickCreateOpen}
          onSuccess={() => onRefresh()}
        />
      )}

      {/* Sheet / Panel Lateral para Detalle del Cliente con Organización por Pestañas */}
      <Sheet open={!!selectedCliente} onOpenChange={(open) => !open && setSelectedCliente(null)}>
        <SheetContent 
          side="right" 
          className="!w-screen sm:!w-[80vw] sm:!max-w-[1150px] p-0 border-none shadow-2xl overflow-hidden flex flex-col [&>button]:hidden bg-background"
        >
          {selectedCliente && (
            <ClienteTabsDetail
              cliente={selectedCliente}
              onUpdate={() => onRefresh()}
              onClose={() => setSelectedCliente(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Diálogo Paso 1: Preguntar si está seguro de inhabilitar */}
      <AlertDialog open={inactivateStep === 1} onOpenChange={(open) => !open && setInactivateStep(null)}>
        <AlertDialogContent className="rounded-3xl border border-white/10 bg-card p-6 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <UserX className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-lg font-black text-foreground">
                ¿Inhabilitar a {inactivateCandidate?.nombre}?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-2">
              Este registro pasará al estado inactivo y no aparecerá en el listado activo de operaciones diarias.
              <br /><br />
              <strong className="text-foreground">Importante:</strong> El cliente <strong>no se borrará</strong>. Todo su historial comercial, notas, proyectos y tickets se conservarán intactos y podrás reactivarlo en cualquier momento desde el filtro &quot;Inactivos&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 pt-4">
            <AlertDialogCancel className="rounded-xl border-border text-xs font-bold">
              Cancelar
            </AlertDialogCancel>
            <Button
              onClick={() => setInactivateStep(2)}
              className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
            >
              Continuar a confirmación
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo Paso 2: Segunda confirmación obligatoria antes de inhabilitar */}
      <AlertDialog open={inactivateStep === 2} onOpenChange={(open) => !open && setInactivateStep(null)}>
        <AlertDialogContent className="rounded-3xl border border-white/10 bg-card p-6 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <UserX className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-lg font-black text-foreground">
                ⚠️ Confirmación final requerida
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-2">
              ¿Estás completamente seguro de inhabilitar el registro de <strong className="text-foreground">{inactivateCandidate?.nombre}</strong>?
              <br /><br />
              Al presionar confirmar, se marcará como inactivo inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              disabled={inactivating}
              onClick={() => setInactivateStep(1)}
              className="rounded-xl border-border text-xs font-bold"
            >
              Regresar
            </Button>
            <Button
              disabled={inactivating}
              onClick={handleExecuteInhabilitar}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {inactivating ? "Inhabilitando..." : "Sí, Inhabilitar Registro"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
