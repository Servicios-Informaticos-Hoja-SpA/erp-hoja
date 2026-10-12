"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Globe, 
  Edit3, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  Camera, 
  Share2, 
  Info, 
  LogOut, 
  Calendar, 
  Key, 
  Server, 
  Flame,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Sparkles,
  Building2,
  Clock,
  UserCheck
} from "lucide-react";
import { Cliente, ClienteEstado } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { ClientesListSkeleton } from "@/components/common/skeletons";

interface ClientesListViewProps {
  clientes: Cliente[];
  search: string;
  setSearch: (val: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onLogout: () => void;
  loading: boolean;
}

export const ClientesListView: React.FC<ClientesListViewProps> = ({
  clientes,
  search,
  setSearch,
  onAdd,
  onEdit,
  onDelete,
  onLogout,
  loading,
}) => {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Buscador inteligente multi-campo
  const filtered = clientes.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.nombre.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.rut || "").toLowerCase().includes(q) ||
      (c.telefono || "").includes(q) ||
      (c.contacto || "").toLowerCase().includes(q) ||
      (c.sintomaPrincipal || "").toLowerCase().includes(q) ||
      (c.etapaPipeline || "").toLowerCase().includes(q) ||
      (c.infraestructura?.dominio?.nombre || "").toLowerCase().includes(q) ||
      (c.infraestructura?.hosting?.proveedor || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (estadoFilter === "todos") return true;
    if (["Detectado", "Contactado", "En Diagnóstico", "Cotización Presentada", "Cerrado Ganado", "Perdido"].includes(estadoFilter)) {
      return (c.etapaPipeline || "Detectado") === estadoFilter;
    }
    return (c.estado || "prospecto") === estadoFilter;
  });

  const toggleExpand = (id: string) => {
    setExpandedClientId((prev) => (prev === id ? null : id));
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar cliente");
    } finally {
      setIsDeleting(false);
    }
  };

  const getPipelineBadge = (etapa?: string) => {
    switch (etapa) {
      case "Contactado":
        return <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-[10px] font-bold">📞 Contactado</Badge>;
      case "En Diagnóstico":
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold">🔬 En Diagnóstico</Badge>;
      case "Cotización Presentada":
        return <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] font-bold">📄 Cotización Presentada</Badge>;
      case "Cerrado Ganado":
        return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">🏆 Cerrado Ganado</Badge>;
      case "Perdido":
        return <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] font-bold">❌ Perdido</Badge>;
      case "Detectado":
      default:
        return <Badge className="bg-slate-700/60 text-slate-300 border-slate-600 text-[10px] font-bold">🔍 Detectado</Badge>;
    }
  };

  const getEstadoBadge = (estado?: ClienteEstado) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-black">Activo en Desarrollo</Badge>;
      case "recurrente":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px] font-black">Servicio Recurrente</Badge>;
      case "inactivo":
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-[10px] font-black">Inactivo</Badge>;
      case "prospecto":
      default:
        return <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 text-[10px] font-black">Prospecto Comercial</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-3 py-6 sm:px-6 sm:py-12 md:px-[10%] lg:px-[15%] xl:px-[15%]">
      
      {/* Encabezado */}
      <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/')} 
            className="rounded-full bg-muted/50 text-primary shrink-0 h-10 w-10 sm:h-12 sm:w-12"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-foreground leading-none">CRM Clientes</h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground font-medium mt-1">Gestión de contactos, memoria operativa e infraestructura</p>
          </div>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onLogout}
            className="gap-2 text-muted-foreground hover:text-destructive transition-colors font-bold px-2 sm:px-4 h-11"
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Cerrar Sesión</span>
          </Button>
          <Button 
            onClick={() => router.push("/prospeccion")} 
            className="flex-1 sm:flex-initial gap-2 rounded-2xl px-3 sm:px-6 h-11 sm:h-12 text-xs sm:text-base font-black shadow-xl shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all hover:scale-105 justify-center"
          >
            <Flame className="h-4 w-4 sm:h-5 sm:w-5 fill-slate-950" /> <span className="whitespace-nowrap">Prospección</span>
          </Button>
          <Button 
            onClick={onAdd} 
            className="flex-1 sm:flex-initial gap-2 rounded-2xl px-4 sm:px-8 h-11 sm:h-12 text-xs sm:text-base font-black shadow-xl shadow-primary/20 bg-primary text-primary-foreground transition-all hover:scale-105 justify-center"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" /> <span className="whitespace-nowrap">Nuevo Cliente</span>
          </Button>
        </div>
      </div>

      {/* Buscador de Alto Rendimiento y Filtros */}
      <div className="space-y-4 mb-6 sm:mb-8">
        <div className="relative">
          <Search className="absolute left-4 sm:left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, RUT, email, fono, contacto, síntoma o dominio..." 
            className="pl-12 sm:pl-14 pr-24 py-5 sm:py-7 text-sm sm:text-base rounded-2xl sm:rounded-3xl bg-card border-2 border-white/10 focus-visible:border-primary shadow-xl"
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

        {/* Barra de Filtros por Estado / Pipeline */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex overflow-x-auto items-center gap-1.5 sm:gap-2 pb-1 scrollbar-none text-xs font-bold -mx-3 px-3 sm:mx-0 sm:px-0">
            <button
              onClick={() => setEstadoFilter("todos")}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl transition-all ${
                estadoFilter === "todos" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
              }`}
            >
              Todos ({clientes.length})
            </button>
            <button
              onClick={() => setEstadoFilter("prospecto")}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl transition-all ${
                estadoFilter === "prospecto" ? "bg-sky-500 text-white shadow-sm" : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
              }`}
            >
              🎯 Prospectos
            </button>
            <button
              onClick={() => setEstadoFilter("activo")}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl transition-all ${
                estadoFilter === "activo" ? "bg-emerald-500 text-white shadow-sm" : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
              }`}
            >
              🚀 Activos
            </button>
            <button
              onClick={() => setEstadoFilter("recurrente")}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl transition-all ${
                estadoFilter === "recurrente" ? "bg-purple-500 text-white shadow-sm" : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
              }`}
            >
              🔄 Recurrentes
            </button>
            <button
              onClick={() => setEstadoFilter("inactivo")}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl transition-all ${
                estadoFilter === "inactivo" ? "bg-slate-500 text-white shadow-sm" : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
              }`}
            >
              ⏸️ Inactivos
            </button>
          </div>

          <span className="hidden sm:inline-block text-xs font-bold text-muted-foreground shrink-0 font-mono">
            {filtered.length} de {clientes.length} clientes
          </span>
        </div>
      </div>

      {/* Listado de Clientes con Ficha Desplegable In-Line */}
      <div className="space-y-4">
        {loading ? (
          <ClientesListSkeleton count={3} />
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground italic font-medium border border-dashed border-white/10 rounded-3xl">
            No se encontraron clientes que coincidan con la búsqueda.
          </div>
        ) : (
          filtered.map((c) => {
            const rawFecha = c.fechaProximoSeguimiento || c.proximoContacto?.fecha;
            const proximoFecha = rawFecha ? rawFecha.split("T")[0] : null;
            const isOverdue = proximoFecha && proximoFecha < todayStr && c.proximoContacto?.estado !== "realizado";
            const isToday = proximoFecha && proximoFecha === todayStr;
            const isExpanded = expandedClientId === c.id;

            return (
              <Card 
                key={c.id} 
                className={`overflow-hidden border transition-all duration-200 bg-card/75 backdrop-blur-sm rounded-2xl sm:rounded-3xl ${
                  isExpanded 
                    ? "border-primary/50 shadow-2xl shadow-primary/5 ring-1 ring-primary/20" 
                    : "border-white/10 hover:border-white/20 shadow-md"
                }`}
              >
                {/* Cabecera / Resumen de la Tarjeta (Clickable para desplegar detalles) */}
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Identidad del Cliente */}
                    <div 
                      onClick={() => toggleExpand(c.id!)}
                      className="flex items-start gap-3 sm:gap-4 flex-1 cursor-pointer min-w-0"
                    >
                      <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2e3c7e] to-[#abaafd] text-white font-black text-lg sm:text-2xl shadow-md">
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-xl font-black text-foreground leading-tight truncate">
                            {c.nombre}
                          </h3>
                          {getEstadoBadge(c.estado)}
                          {getPipelineBadge(c.etapaPipeline)}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {c.rut && (
                            <span className="font-mono font-bold text-primary">
                              {c.rut}
                            </span>
                          )}
                          {c.contacto && (
                            <span className="flex items-center gap-1 font-medium">
                              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                              {c.contacto}
                            </span>
                          )}
                          {c.telefono && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {c.telefono}
                            </span>
                          )}
                        </div>

                        {/* Síntoma Clave si existe */}
                        {c.sintomaPrincipal && (
                          <div className="pt-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                              🩺 {c.sintomaPrincipal}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones Rápidas & Botón Desplegable */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                      <div className="flex items-center gap-1.5">
                        {c.telefono && (
                          <WhatsAppButton
                            telefono={c.telefono}
                            clienteNombre={c.nombre}
                            contexto={{
                              tipo: "seguimiento",
                              motivo: c.proximoContacto?.motivo || "nuestro contacto comercial"
                            }}
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-10 w-10 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          />
                        )}

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onEdit(c.id!)} 
                          className="rounded-xl h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                          title="Editar ficha del cliente"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeleteId(c.id!)} 
                          className="rounded-xl h-10 w-10 hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Botón Expansor */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(c.id!)}
                        className={`h-10 px-3 rounded-xl text-xs font-black gap-1.5 border transition-all ${
                          isExpanded 
                            ? "bg-primary text-primary-foreground border-primary shadow-md" 
                            : "bg-muted/40 hover:bg-muted text-foreground border-white/10"
                        }`}
                      >
                        <span>{isExpanded ? "Ocultar" : "Detalles"}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                  </div>

                  {/* ============================================================== */}
                  {/* SECCIÓN DESPLEGABLE: FICHA DETALLADA IN-LINE                    */}
                  {/* ============================================================== */}
                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-white/10 space-y-5 animate-in fade-in duration-200">
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Bloque 1: Canales de Contacto Directo */}
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" /> Canales de Contacto
                          </span>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between py-1 border-b border-white/5">
                              <span className="text-muted-foreground">Email:</span>
                              {c.email ? (
                                <a href={`mailto:${c.email}`} className="font-bold text-sky-400 hover:underline truncate max-w-[180px]">
                                  {c.email}
                                </a>
                              ) : (
                                <span className="text-muted-foreground italic">No registrado</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-white/5">
                              <span className="text-muted-foreground">Teléfono:</span>
                              {c.telefono ? (
                                <a href={`tel:${c.telefono}`} className="font-mono font-bold text-emerald-400 hover:underline">
                                  {c.telefono}
                                </a>
                              ) : (
                                <span className="text-muted-foreground italic">No registrado</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between py-1">
                              <span className="text-muted-foreground">Contacto:</span>
                              <span className="font-bold text-foreground">
                                {c.contacto || "Directo"}
                              </span>
                            </div>
                          </div>

                          {/* Redes Sociales y Web */}
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                            {c.social_web && (
                              <a 
                                href={c.social_web.startsWith("http") ? c.social_web : `https://${c.social_web}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 text-[11px] font-bold hover:bg-sky-500/20"
                              >
                                <Globe className="h-3 w-3" /> Web
                              </a>
                            )}
                            {c.social_instagram && (
                              <a 
                                href={`https://instagram.com/${c.social_instagram.replace('@', '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-300 text-[11px] font-bold hover:bg-pink-500/20"
                              >
                                <Camera className="h-3 w-3" /> @{c.social_instagram.replace('@', '')}
                              </a>
                            )}
                            {c.social_linkedin && (
                              <a 
                                href={c.social_linkedin.startsWith("http") ? c.social_linkedin : `https://${c.social_linkedin}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 text-[11px] font-bold hover:bg-blue-500/20"
                              >
                                <Share2 className="h-3 w-3" /> LinkedIn
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Bloque 2: Diagnóstico y Próximo Seguimiento */}
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> Pipeline & Próximo Contacto
                          </span>

                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Etapa Comercial</span>
                              <div className="mt-0.5">{getPipelineBadge(c.etapaPipeline)}</div>
                            </div>

                            {/* Alerta de seguimiento */}
                            {proximoFecha ? (
                              <div className={`p-2.5 rounded-xl border space-y-1 ${
                                isOverdue 
                                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                  : isToday
                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                    : "bg-muted/40 border-white/5 text-muted-foreground"
                              }`}>
                                <div className="flex items-center gap-1.5 font-bold">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>{isOverdue ? "⚠️ Seguimiento Vencido" : isToday ? "📅 Contactar Hoy" : "Próximo Contacto"}</span>
                                </div>
                                <p className="font-mono font-bold text-foreground">{proximoFecha}</p>
                                <p className="text-[11px]">{c.proximoContacto?.motivo || "Sin asunto específico"}</p>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No hay fecha de seguimiento agendada.</p>
                            )}
                          </div>
                        </div>

                        {/* Bloque 3: Infraestructura, Hosting & Accesos */}
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                            <Server className="h-3.5 w-3.5" /> Infraestructura & Hosting
                          </span>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-white/5">
                              <span className="text-muted-foreground">Dominio:</span>
                              <span className="font-mono font-bold text-foreground">
                                {c.infraestructura?.dominio?.nombre || "No asociado"}
                              </span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-white/5">
                              <span className="text-muted-foreground">Proveedor Hosting:</span>
                              <span className="font-bold text-purple-300">
                                {c.infraestructura?.hosting?.proveedor || "Por definir"}
                              </span>
                            </div>

                            <div className="flex justify-between py-1">
                              <span className="text-muted-foreground">Credenciales / Accesos:</span>
                              <span className="font-bold text-foreground">
                                {c.infraestructura?.accesos?.length ? `${c.infraestructura.accesos.length} guardado(s)` : "Ninguno"}
                              </span>
                            </div>

                            {c.historialNotas && c.historialNotas.length > 0 && (
                              <p className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded-lg border border-white/5 mt-1 italic">
                                Última nota: {c.historialNotas[0].texto}
                              </p>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Botones de Acción al pie de la Ficha Desplegada */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="text-[11px] text-muted-foreground">
                          ID: <span className="font-mono text-slate-400">{c.id}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/presupuestos/nuevo?clienteId=${c.id}`)}
                            className="rounded-xl h-10 px-4 bg-primary text-primary-foreground font-black text-xs gap-1.5 shadow-md shadow-primary/20 hover:scale-105 transition-all"
                          >
                            <FileText className="h-3.5 w-3.5" /> Emitir Cotización a este Cliente
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(c.id!)}
                            className="rounded-xl h-10 px-4 border-white/15 bg-card hover:bg-muted text-foreground text-xs font-bold gap-1.5"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Editar Ficha Completa
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

      {/* Modal de Confirmación de Eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && !isDeleting && setDeleteId(null)}>
        <AlertDialogContent className="border border-white/10 shadow-2xl rounded-3xl bg-card text-foreground p-6 max-w-[400px]">
          <AlertDialogHeader className="space-y-3 items-start text-left">
            <AlertDialogTitle className="text-xl font-bold tracking-tight">¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed text-left">
              Esta acción eliminará permanentemente al cliente de <span className="text-foreground font-semibold">Hoja SpA Cloud</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-6 mt-0 bg-transparent border-none m-0 p-0 flex-row justify-end">
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl border border-white/10 bg-muted/40 hover:bg-muted text-foreground h-10 px-4 m-0 font-medium text-sm">Cancelar</AlertDialogCancel>
            <Button 
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              variant="destructive"
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 font-bold text-sm gap-2 m-0"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
