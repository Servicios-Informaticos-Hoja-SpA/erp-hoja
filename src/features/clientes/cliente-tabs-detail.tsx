"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Cliente, 
  Proyecto, 
  TicketSoporte, 
  TicketSeveridad, 
  TicketEstado,
  ItemPaginaWeb,
  ItemCorreos,
  ItemDominio,
  ItemAppPersonalizada,
  ItemHardware,
  ServicioAsociado,
  CuentaCorreo,
  ClienteNota,
  TipoRegistro,
  SubEstadoProspecto,
  Presupuesto,
  Subscription
} from "@/lib/types";
import { 
  updateCliente, 
  getProyectos, 
  getTicketsByCliente, 
  getPresupuestosByCliente,
  getSubscriptions,
  saveTicket, 
  updateTicket, 
  deleteTicket 
} from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import Link from "next/link";
import { 
  User, 
  Briefcase, 
  Server, 
  LifeBuoy, 
  Mail, 
  Globe, 
  Camera, 
  Share2, 
  Calendar, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight, 
  Cpu, 
  Laptop,
  FileText,
  Pencil,
  ArrowUpRight,
  ExternalLink,
  RefreshCw,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { sanitizeString, sanitizeData } from "@/lib/sanitize";
import { useAuth } from "@/context/auth-context";

interface ClienteTabsDetailProps {
  cliente: Cliente;
  onUpdate: () => void;
  onClose: () => void;
}

export const ClienteTabsDetail: React.FC<ClienteTabsDetailProps> = ({
  cliente,
  onUpdate,
  onClose,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"basico" | "proyectos" | "presupuestos" | "matriz" | "tickets">("basico");
  const [isEditingBasico, setIsEditingBasico] = useState(false);

  // Form State para Pestaña 1 (Básico y CRM)
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>(
    cliente.tipo_registro || (cliente.estado === "prospecto" ? "prospecto" : "cliente")
  );
  const [subEstado, setSubEstado] = useState<SubEstadoProspecto>(
    cliente.sub_estado || "sin_contacto"
  );
  const [nombre, setNombre] = useState(cliente.nombre || "");
  const [contacto, setContacto] = useState(cliente.contacto || "");
  const [telefono, setTelefono] = useState(cliente.telefono || "");
  const [email, setEmail] = useState(cliente.email || "");
  const [rut, setRut] = useState(cliente.rut || "");
  const [socialWeb, setSocialWeb] = useState(cliente.social_web || "");
  const [socialInstagram, setSocialInstagram] = useState(cliente.social_instagram || "");
  const [socialLinkedin, setSocialLinkedin] = useState(cliente.social_linkedin || "");
  const [proximoRecordatorio, setProximoRecordatorio] = useState(cliente.proximoRecordatorio || "");
  const [recordatorioNota, setRecordatorioNota] = useState(cliente.recordatorioNota || "");
  const [recordatorioCompletado, setRecordatorioCompletado] = useState(cliente.recordatorioCompletado || false);
  const [historialNotas, setHistorialNotas] = useState<ClienteNota[]>(cliente.historialNotas || []);
  const [nuevaNotaTexto, setNuevaNotaTexto] = useState("");
  const [nuevaNotaTipo, setNuevaNotaTipo] = useState<"reunion" | "llamada" | "whatsapp" | "acuerdo">("llamada");
  const [savingBasico, setSavingBasico] = useState(false);
  const [savingNota, setSavingNota] = useState(false);

  useEffect(() => {
    setHistorialNotas(cliente.historialNotas || []);
  }, [cliente.id, cliente.historialNotas]);

  // State para Pestaña 2 (Proyectos vinculados con paginación de 5 registros)
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loadingProyectos, setLoadingProyectos] = useState(false);
  const [proyectosPage, setProyectosPage] = useState(1);
  const PROYECTOS_PER_PAGE = 5;

  // State para Pestaña 3 (Presupuestos vinculados)
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loadingPresupuestos, setLoadingPresupuestos] = useState(false);

  // State para Pestaña 4 (Matriz Operativa)
  const [matrizSubTab, setMatrizSubTab] = useState<"web" | "correos" | "dominio" | "app" | "hardware">("web");
  const [paginasWeb, setPaginasWeb] = useState<ItemPaginaWeb[]>(cliente.matrizOperativa?.paginasWeb || []);
  const [correos, setCorreos] = useState<ItemCorreos[]>(cliente.matrizOperativa?.correos || []);
  const [dominios, setDominios] = useState<ItemDominio[]>(cliente.matrizOperativa?.dominios || []);
  const [appsPersonalizadas, setAppsPersonalizadas] = useState<ItemAppPersonalizada[]>(cliente.matrizOperativa?.appsPersonalizadas || []);
  const [hardware, setHardware] = useState<ItemHardware[]>(cliente.matrizOperativa?.hardware || []);
  const [savingMatriz, setSavingMatriz] = useState(false);
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});

  // State para Pestaña 5 (Tickets de Soporte)
  const [tickets, setTickets] = useState<TicketSoporte[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketTitulo, setNewTicketTitulo] = useState("");
  const [newTicketDescripcion, setNewTicketDescripcion] = useState("");
  const [newTicketSeveridad, setNewTicketSeveridad] = useState<TicketSeveridad>("Media");
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<string>("todos");

  // Carga diferida de proyectos al abrir pestaña 2
  useEffect(() => {
    let isMounted = true;
    if (activeTab === "proyectos" && cliente.id) {
      queueMicrotask(() => setLoadingProyectos(true));
      getProyectos()
        .then((all) => {
          if (isMounted) {
            const clientProjs = all.filter((p) => p.clienteId === cliente.id);
            setProyectos(clientProjs);
            setLoadingProyectos(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) {
            toast.error("Error al cargar proyectos del cliente");
            setLoadingProyectos(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab, cliente.id]);

  // Carga diferida de presupuestos al abrir pestaña presupuestos
  useEffect(() => {
    let isMounted = true;
    if (activeTab === "presupuestos" && cliente.id) {
      queueMicrotask(() => setLoadingPresupuestos(true));
      getPresupuestosByCliente(cliente.id, cliente.nombre)
        .then((all) => {
          if (isMounted) {
            setPresupuestos(all);
            setLoadingPresupuestos(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) {
            toast.error("Error al cargar presupuestos");
            setLoadingPresupuestos(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab, cliente.id, cliente.nombre]);

  // Carga diferida e independiente de tickets al abrir pestaña 4
  useEffect(() => {
    let isMounted = true;
    if (activeTab === "tickets" && cliente.id) {
      queueMicrotask(() => setLoadingTickets(true));
      getTicketsByCliente(cliente.id)
        .then((data) => {
          if (isMounted) {
            setTickets(data);
            setLoadingTickets(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) {
            toast.error("Error al cargar tickets de soporte");
            setLoadingTickets(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab, cliente.id]);

  // Carga diferida de servicios recurrentes y mantenciones al abrir la Matriz Operativa
  const [clienteSubs, setClienteSubs] = useState<Subscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (activeTab === "matriz" && cliente.id) {
      queueMicrotask(() => setLoadingSubs(true));
      getSubscriptions()
        .then((all) => {
          if (isMounted) {
            const subs = all.filter(
              (s) => s.clienteId === cliente.id || (s.clienteNombre && s.clienteNombre.toLowerCase() === (cliente.nombre || "").toLowerCase())
            );
            setClienteSubs(subs);
            setLoadingSubs(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) setLoadingSubs(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab, cliente.id, cliente.nombre]);

  const togglePassVisibility = (id: string) => {
    setShowPassMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Guardar Pestaña 1
  const handleSaveBasico = async () => {
    if (!cliente.id) return;
    if (!nombre.trim()) {
      toast.warning("El nombre comercial no puede estar vacío");
      return;
    }

    setSavingBasico(true);
    try {
      // Extraemos id para no enviarlo dentro del documento a actualizar
      const { id: _ignoredId, ...restCliente } = cliente;

      // Garantizar que no se borre absolutamente ninguna información previa
      const updateData: Partial<Cliente> = {
        ...restCliente,
        nombre: sanitizeString(nombre.trim()),
        contacto: sanitizeString(contacto.trim()),
        telefono: sanitizeString(telefono.trim()),
        email: sanitizeString(email.trim()),
        rut: sanitizeString(rut.trim()),
        social_web: sanitizeString(socialWeb.trim()),
        social_instagram: sanitizeString(socialInstagram.trim()),
        social_linkedin: sanitizeString(socialLinkedin.trim()),
        tipo_registro: tipoRegistro,
        sub_estado: tipoRegistro === "prospecto" ? subEstado : (cliente.sub_estado || "contactado"),
        estado: tipoRegistro === "prospecto" ? "prospecto" : (cliente.estado === "prospecto" ? "activo" : (cliente.estado || "activo")),
        proximoRecordatorio: proximoRecordatorio ? sanitizeString(proximoRecordatorio) : "",
        recordatorioNota: sanitizeString(recordatorioNota.trim()),
        recordatorioCompletado,
        historialNotas,
      };

      await updateCliente(cliente.id, sanitizeData(updateData));
      toast.success("Información básica actualizada");
      setIsEditingBasico(false);
      onUpdate();
    } catch (err: unknown) {
      console.error("[handleSaveBasico error]:", err);
      const msg = err instanceof Error ? err.message : "Error al actualizar información básica";
      toast.error(msg);
    } finally {
      setSavingBasico(false);
    }
  };

  // Agregar Nota Interna
  const handleAddNota = async () => {
    if (!nuevaNotaTexto.trim()) {
      toast.warning("La nota no puede estar vacía");
      return;
    }

    if (!cliente.id) {
      toast.error("Error: identificador de cliente no encontrado");
      return;
    }

    setSavingNota(true);
    try {
      const autor = user?.displayName || user?.email?.split("@")[0] || "Operador";
      const nuevaNota: ClienteNota = {
        id: `nota-${Date.now()}`,
        autorNombre: autor,
        autorEmail: user?.email || "",
        fecha: new Date().toISOString(),
        texto: sanitizeString(nuevaNotaTexto.trim()),
        tipo: nuevaNotaTipo,
      };

      const updated = [nuevaNota, ...historialNotas];
      setHistorialNotas(updated);
      setNuevaNotaTexto("");

      // Guardar en Firestore/API inmediatamente
      await updateCliente(cliente.id, {
        historialNotas: updated,
      });

      toast.success("Nota guardada en el historial");
      onUpdate();
    } catch (err) {
      console.error("[handleAddNota error]:", err);
      toast.error("Error al guardar la nota en la base de datos");
    } finally {
      setSavingNota(false);
    }
  };

  const handleDeleteNota = async (notaId: string) => {
    if (!cliente.id) return;
    const updated = historialNotas.filter((n) => n.id !== notaId);
    setHistorialNotas(updated);
    try {
      await updateCliente(cliente.id, {
        historialNotas: updated,
      });
      toast.success("Nota eliminada");
      onUpdate();
    } catch (err) {
      console.error("[handleDeleteNota error]:", err);
      toast.error("Error al eliminar la nota");
    }
  };

  // Guardar Matriz Operativa (Pestaña 3)
  const handleSaveMatriz = async () => {
    if (!cliente.id) return;
    setSavingMatriz(true);
    try {
      const matrizData = {
        paginasWeb,
        correos,
        dominios,
        appsPersonalizadas,
        hardware,
      };

      await updateCliente(cliente.id, {
        matrizOperativa: sanitizeData(matrizData),
      });

      toast.success("Matriz operativa guardada");
      onUpdate();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Error al guardar la matriz operativa");
    } finally {
      setSavingMatriz(false);
    }
  };

  // Crear Ticket de Soporte (Pestaña 4)
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.id) return;
    if (!newTicketTitulo.trim()) {
      toast.warning("El título del problema es obligatorio");
      return;
    }

    setCreatingTicket(true);
    try {
      const created = await saveTicket(cliente.id, {
        titulo: sanitizeString(newTicketTitulo.trim()),
        descripcion: sanitizeString(newTicketDescripcion.trim()),
        severidad: newTicketSeveridad,
        estado: "abierto",
        autor: user?.displayName || user?.email?.split("@")[0] || "Operador",
      });

      setTickets((prev) => [...prev, created]);
      setShowNewTicketModal(false);
      setNewTicketTitulo("");
      setNewTicketDescripcion("");
      setNewTicketSeveridad("Media");
      toast.success(`Ticket #${created.numero} registrado con éxito`);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Error al registrar el ticket de soporte");
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, nextStatus: TicketEstado) => {
    if (!cliente.id) return;
    try {
      await updateTicket(cliente.id, ticketId, { estado: nextStatus });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, estado: nextStatus } : t))
      );
      toast.success("Estado del ticket actualizado");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo actualizar el estado del ticket");
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!cliente.id) return;
    try {
      await deleteTicket(cliente.id, ticketId);
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      toast.success("Ticket eliminado");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el ticket");
    }
  };

  // Paginación de Proyectos (5 por página)
  const totalProyectosPages = Math.max(1, Math.ceil(proyectos.length / PROYECTOS_PER_PAGE));
  const paginatedProyectos = useMemo(() => {
    const start = (proyectosPage - 1) * PROYECTOS_PER_PAGE;
    return proyectos.slice(start, start + PROYECTOS_PER_PAGE);
  }, [proyectos, proyectosPage]);

  // Filtrado de Tickets
  const filteredTickets = useMemo(() => {
    if (ticketFilter === "todos") return tickets;
    return tickets.filter((t) => t.estado === ticketFilter || t.severidad === ticketFilter);
  }, [tickets, ticketFilter]);

  const getSeveridadBadge = (sev: TicketSeveridad) => {
    switch (sev) {
      case "Alta":
        return <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] font-bold">🔴 Alta</Badge>;
      case "Media":
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold">🟡 Media</Badge>;
      case "Baja":
        return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">🟢 Baja</Badge>;
      case "Recomendación/Sugerencia":
        return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-bold">💡 Recomendación</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Encabezado del Detalle */}
      <div className="p-4 sm:p-6 border-b border-white/10 bg-card/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#2e3c7e] to-[#abaafd] text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
                {cliente.nombre}
              </h2>
              {tipoRegistro === "prospecto" ? (
                <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 text-xs font-black">
                  🎯 Prospecto
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-black">
                  🚀 Cliente Activo
                </Badge>
              )}
              {tipoRegistro === "prospecto" && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  subEstado === "contactado"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : "bg-slate-700/60 text-slate-300 border border-slate-600"
                }`}>
                  {subEstado === "contactado" ? "📞 Contactado" : "⏳ Sin Contacto"}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              ID: {cliente.id} {cliente.rut ? `• RUT: ${cliente.rut}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl border-border text-xs font-bold"
          >
            Cerrar
          </Button>
        </div>
      </div>

      {/* Navegación por Pestañas Temáticas (Evita scroll vertical masivo) */}
      <div className="px-4 sm:px-6 border-b border-white/10 bg-card/40 flex overflow-x-auto gap-2 scrollbar-none shrink-0">
        <button
          onClick={() => setActiveTab("basico")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-black transition-all whitespace-nowrap ${
            activeTab === "basico"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Ficha & Detalles</span>
        </button>

        <button
          onClick={() => setActiveTab("proyectos")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-black transition-all whitespace-nowrap ${
            activeTab === "proyectos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>Proyectos</span>
          <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-[10px]">
            {proyectos.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("presupuestos")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-black transition-all whitespace-nowrap ${
            activeTab === "presupuestos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Presupuestos</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
            {presupuestos.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("matriz")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-black transition-all whitespace-nowrap ${
            activeTab === "matriz"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Server className="h-4 w-4" />
          <span>Matriz Operativa</span>
        </button>

        <button
          onClick={() => setActiveTab("tickets")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-black transition-all whitespace-nowrap ${
            activeTab === "tickets"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <LifeBuoy className="h-4 w-4" />
          <span>Tickets de Soporte</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
            {tickets.length}
          </span>
        </button>
      </div>

      {/* Contenedor Principal de Pestañas con Scroll Interno */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* ============================================================ */}
        {/* PESTAÑA 1: INFORMACIÓN BÁSICA, PRESENCIA DIGITAL & CRM NOTES */}
        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* PESTAÑA 1: FICHA DE DETALLES Y EDICIÓN SEPARADA              */}
        {/* ============================================================ */}
        {activeTab === "basico" && !isEditingBasico && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header de la Ficha con botón de Edición */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-card border border-white/10 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md shrink-0 ${
                  tipoRegistro === "prospecto" 
                    ? "bg-gradient-to-tr from-sky-600 to-sky-400" 
                    : "bg-gradient-to-tr from-[#2e3c7e] to-[#abaafd]"
                }`}>
                  {nombre.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-foreground truncate">
                      {nombre}
                    </h3>
                    <Badge className={tipoRegistro === "prospecto" ? "bg-sky-500/20 text-sky-400 border-sky-500/30 text-[10px] font-black" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-black"}>
                      {tipoRegistro === "prospecto" ? "🎯 Prospecto" : "🚀 Cliente Activo"}
                    </Badge>
                    {tipoRegistro === "prospecto" && (
                      <button
                        type="button"
                        onClick={async () => {
                          const nextSub: SubEstadoProspecto = subEstado === "contactado" ? "sin_contacto" : "contactado";
                          setSubEstado(nextSub);
                          try {
                            await updateCliente(cliente.id!, { sub_estado: nextSub });
                            toast.success(nextSub === "contactado" ? "Marcado como 📞 Contactado" : "Marcado como ⏳ Sin Contacto");
                            onUpdate();
                          } catch {
                            toast.error("Error al actualizar sub-estado");
                          }
                        }}
                        title={`Click para cambiar a ${subEstado === "contactado" ? "Sin Contacto" : "Contactado"}`}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xs ${
                          subEstado === "contactado"
                            ? "bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30"
                            : "bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-700"
                        }`}
                      >
                        {subEstado === "contactado" ? "📞 Contactado" : "⏳ Sin Contacto"}
                        <RefreshCw className="h-2.5 w-2.5 opacity-70" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {rut ? `RUT: ${rut} • ` : ""}{contacto ? `Contacto: ${contacto}` : "Sin contacto directo registrado"}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setIsEditingBasico(true)}
                className="rounded-2xl px-4 py-2 bg-primary text-primary-foreground font-bold text-xs gap-1.5 shadow-md shadow-primary/20 hover:scale-105 transition-all w-fit"
              >
                <Pencil className="h-3.5 w-3.5" /> Modificar Información
              </Button>
            </div>

            {/* Grid de Datos: Contacto & Presencia Digital */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Información de Contacto */}
              <div className="p-5 rounded-3xl bg-card border border-white/10 shadow-sm space-y-3.5">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                  <User className="h-3.5 w-3.5 text-primary" /> Datos de Contacto
                </span>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Persona de Contacto:</span>
                    <span className="font-bold text-foreground">{contacto || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Teléfono / WhatsApp:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{telefono || "—"}</span>
                      {telefono && (
                        <WhatsAppButton
                          telefono={telefono}
                          clienteNombre={nombre}
                          size="sm"
                          className="h-6 px-2 text-[10px] rounded-lg shadow-none"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Correo Electrónico:</span>
                    {email ? (
                      <a href={`mailto:${email}`} className="text-primary hover:underline font-bold truncate max-w-[200px]">
                        {email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">RUT / Identificador:</span>
                    <span className="font-mono text-foreground font-bold">{rut || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Presencia Digital */}
              <div className="p-5 rounded-3xl bg-card border border-white/10 shadow-sm space-y-3.5">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                  <Globe className="h-3.5 w-3.5 text-sky-400" /> Presencia Digital
                </span>
                
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Sitio Web:</span>
                    {socialWeb ? (
                      <a
                        href={socialWeb.startsWith("http") ? socialWeb : `https://${socialWeb}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:underline font-bold flex items-center gap-1 truncate max-w-[200px]"
                      >
                        {socialWeb} <ArrowUpRight className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground">Instagram:</span>
                    {socialInstagram ? (
                      <span className="font-bold text-foreground">
                        {socialInstagram.startsWith("@") ? socialInstagram : `@${socialInstagram}`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">LinkedIn:</span>
                    {socialLinkedin ? (
                      <span className="font-bold text-foreground truncate max-w-[200px]">
                        {socialLinkedin}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Próximo Recordatorio Comercial */}
            <div className="p-5 rounded-3xl bg-card border border-white/10 shadow-sm space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                <Calendar className="h-3.5 w-3.5 text-amber-400" /> Seguimiento & Recordatorio
              </span>

              {proximoRecordatorio ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/30 border border-white/5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-foreground">
                        📅 {new Date(proximoRecordatorio).toLocaleString("es-CL")}
                      </span>
                      {recordatorioCompletado ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                          Completado
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-400 text-[10px] animate-pulse">
                          Pendiente
                        </Badge>
                      )}
                    </div>
                    {recordatorioNota && (
                      <p className="text-xs text-muted-foreground">
                        {recordatorioNota}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRecordatorioCompletado(!recordatorioCompletado);
                      toast.info(recordatorioCompletado ? "Recordatorio pendiente" : "Recordatorio completado");
                    }}
                    className="h-8 text-xs font-bold rounded-xl border-border"
                  >
                    {recordatorioCompletado ? "Marcar Pendiente" : "Marcar Completado"}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">
                  No hay un recordatorio agendado para este cliente. Haz clic en &quot;Modificar Información&quot; para programar uno.
                </p>
              )}
            </div>

            {/* Card 4: Bitácora de Notas Internas */}
            <div className="p-5 rounded-3xl bg-card border border-white/10 shadow-sm space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                <FileText className="h-3.5 w-3.5 text-primary" /> Bitácora & Notas Internas
              </span>

              {/* Formulario rápido para nueva nota */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-white/5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground">
                    Nueva Entrada en Bitácora:
                  </span>
                  <div className="flex gap-1">
                    {(["llamada", "reunion", "whatsapp", "acuerdo"] as const).map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setNuevaNotaTipo(tipo)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                          nuevaNotaTipo === tipo
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  value={nuevaNotaTexto}
                  onChange={(e) => setNuevaNotaTexto(e.target.value)}
                  placeholder="Escribe comentarios de la conversación, objeciones, acuerdos..."
                  className="rounded-xl bg-background border-border text-xs"
                  rows={2}
                />

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={savingNota || !nuevaNotaTexto.trim()}
                    onClick={handleAddNota}
                    className="rounded-xl bg-primary text-primary-foreground font-bold text-xs gap-1.5"
                  >
                    {savingNota ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" /> Agregar Nota
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Listado cronológico de notas */}
              <div className="space-y-2.5 pt-2">
                {historialNotas.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    Sin notas registradas en este cliente.
                  </p>
                ) : (
                  historialNotas.map((nota) => (
                    <div
                      key={nota.id}
                      className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-xs flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            {nota.autorNombre}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(nota.fecha).toLocaleString("es-CL")}
                          </span>
                          {nota.tipo && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[9px] capitalize">
                              {nota.tipo}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {nota.texto}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteNota(nota.id!)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-lg transition-colors"
                        title="Eliminar nota"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modo Edición: Formulario estructurado similar al modal de agregar */}
        {activeTab === "basico" && isEditingBasico && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div>
                <h3 className="text-lg font-black text-foreground">
                  Modificar Información del Cliente
                </h3>
                <p className="text-xs text-muted-foreground">
                  Actualiza datos básicos, presencia digital o convierte de prospecto a cliente sin perder trazabilidad.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingBasico(false)}
                className="rounded-xl border-border text-xs font-bold"
              >
                Cancelar Edición
              </Button>
            </div>

            {/* Selector Tipo de Registro: Prospecto vs Cliente */}
            <div className="space-y-1.5 p-4 rounded-3xl bg-card border border-white/10 shadow-sm">
              <Label className="text-xs font-bold text-foreground">
                Tipo de Registro
              </Label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-2xl border border-border/50">
                <button
                  type="button"
                  onClick={() => setTipoRegistro("prospecto")}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    tipoRegistro === "prospecto"
                      ? "bg-sky-500 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🎯 Prospecto Comercial
                </button>
                <button
                  type="button"
                  onClick={() => setTipoRegistro("cliente")}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    tipoRegistro === "cliente"
                      ? "bg-emerald-500 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🚀 Cliente con Proyectos
                </button>
              </div>
            </div>

            {/* Sub-estado si es prospecto */}
            {tipoRegistro === "prospecto" && (
              <div className="space-y-1.5 p-4 rounded-3xl bg-sky-500/5 border border-sky-500/20">
                <Label className="text-xs font-bold text-sky-400">
                  Sub-Estado del Prospecto
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSubEstado("sin_contacto")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      subEstado === "sin_contacto"
                        ? "bg-slate-700 text-white border-slate-600 shadow-sm"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    ⏳ Sin Contacto
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubEstado("contactado")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      subEstado === "contactado"
                        ? "bg-sky-600 text-white border-sky-500 shadow-sm"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    📞 Contactado
                  </button>
                </div>
              </div>
            )}

            {/* Información Básica */}
            <div className="p-5 rounded-3xl bg-card border border-white/10 shadow-sm space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block border-b border-border/40 pb-2">
                Datos Generales & Contacto
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Nombre Comercial / Razón Social *</Label>
                  <Input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="rounded-xl bg-background border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Persona de Contacto</Label>
                  <Input
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    className="rounded-xl bg-background border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Teléfono (WhatsApp)</Label>
                  <Input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="rounded-xl bg-background border-border font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Correo Electrónico</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl bg-background border-border"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-foreground">RUT / Identificador Fiscal</Label>
                  <Input
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    className="rounded-xl bg-background border-border font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Presencia Digital */}
            <div className="p-5 rounded-3xl bg-card border border-white/10 shadow-sm space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block border-b border-border/40 pb-2">
                Presencia Digital & Enlaces Web
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Sitio Web
                  </Label>
                  <Input
                    placeholder="https://..."
                    value={socialWeb}
                    onChange={(e) => setSocialWeb(e.target.value)}
                    className="rounded-xl bg-background border-border text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" /> Instagram
                  </Label>
                  <Input
                    placeholder="@usuario"
                    value={socialInstagram}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                    className="rounded-xl bg-background border-border text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Share2 className="h-3.5 w-3.5" /> LinkedIn
                  </Label>
                  <Input
                    placeholder="perfil / empresa"
                    value={socialLinkedin}
                    onChange={(e) => setSocialLinkedin(e.target.value)}
                    className="rounded-xl bg-background border-border text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Próximo Recordatorio */}
            <div className="p-5 rounded-3xl bg-card border border-white/10 shadow-sm space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block border-b border-border/40 pb-2">
                Programar Recordatorio
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Fecha y Hora</Label>
                  <Input
                    type="datetime-local"
                    value={proximoRecordatorio}
                    onChange={(e) => setProximoRecordatorio(e.target.value)}
                    className="rounded-xl bg-background border-border text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Motivo o Nota del Recordatorio</Label>
                  <Input
                    placeholder="Ej. Llamar para presentar propuesta..."
                    value={recordatorioNota}
                    onChange={(e) => setRecordatorioNota(e.target.value)}
                    className="rounded-xl bg-background border-border text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Botones de Acción al pie de la Edición */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsEditingBasico(false)}
                className="rounded-xl border-border text-xs font-bold"
              >
                Cancelar
              </Button>

              <Button
                onClick={handleSaveBasico}
                disabled={savingBasico}
                className="rounded-xl px-6 py-2.5 bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-2"
              >
                {savingBasico ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA 2: PROYECTOS VINCULADOS (MÁXIMO 5 POR PÁGINA)       */}
        {/* ============================================================ */}
        {activeTab === "proyectos" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div>
                <h3 className="text-base font-black text-foreground">Proyectos del Cliente</h3>
                <p className="text-xs text-muted-foreground">
                  Desarrollos y servicios asignados (paginación estricta de 5 por página).
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-primary">
                Total: {proyectos.length}
              </span>
            </div>

            {loadingProyectos ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs">Cargando proyectos...</span>
              </div>
            ) : proyectos.length === 0 ? (
              <div className="p-10 rounded-3xl border border-dashed border-border text-center text-muted-foreground text-xs italic">
                Este cliente no cuenta con proyectos registrados en la plataforma.
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedProyectos.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-card border border-white/10 shadow-sm hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-foreground">
                          {p.nombre}
                        </span>
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold">
                          {p.fase}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {p.descripcion || "Sin descripción"}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                        <span>Inicio: {p.fechaInicio || "N/A"}</span>
                        <span>•</span>
                        <span>Entrega: {p.fechaEntregaComprometida || "N/A"}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                      <span className="text-sm font-black text-foreground font-mono">
                        {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(p.montos?.total || 0)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold">
                        {p.hitosPago?.length || 0} hitos de pago
                      </span>
                    </div>
                  </div>
                ))}

                {/* Controles de Paginación Obligatoria (5 registros máx por página) */}
                {totalProyectosPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs">
                    <span className="text-muted-foreground font-medium">
                      Página {proyectosPage} de {totalProyectosPages} ({proyectos.length} proyectos)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={proyectosPage <= 1}
                        onClick={() => setProyectosPage((p) => Math.max(1, p - 1))}
                        className="rounded-xl h-8 px-2.5 text-xs gap-1"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={proyectosPage >= totalProyectosPages}
                        onClick={() => setProyectosPage((p) => Math.min(totalProyectosPages, p + 1))}
                        className="rounded-xl h-8 px-2.5 text-xs gap-1"
                      >
                        Siguiente <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA 3: PRESUPUESTOS Y COTIZACIONES ASIGNADAS             */}
        {/* ============================================================ */}
        {activeTab === "presupuestos" && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
              <div>
                <h3 className="text-base font-black text-foreground">Presupuestos & Cotizaciones</h3>
                <p className="text-xs text-muted-foreground">
                  Propuestas económicas vinculadas al cliente ({cliente.nombre}).
                </p>
              </div>

              <Link
                href={`/presupuestos?clienteId=${cliente.id}&clienteNombre=${encodeURIComponent(cliente.nombre)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-md shadow-primary/20 hover:scale-105 transition-all w-fit"
              >
                <Plus className="h-3.5 w-3.5" /> Nueva Cotización
              </Link>
            </div>

            {/* Resumen Métrico de Cotizaciones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-card border border-white/10 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Total Cotizado
                </span>
                <span className="text-lg font-black text-foreground font-mono">
                  ${presupuestos.reduce((acc, p) => acc + (p.totales?.total || 0), 0).toLocaleString("es-CL")}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {presupuestos.length} propuesta(s) registrada(s)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                  Aprobados
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  ${presupuestos.filter(p => p.estado === "aprobado").reduce((acc, p) => acc + (p.totales?.total || 0), 0).toLocaleString("es-CL")}
                </span>
                <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                  {presupuestos.filter(p => p.estado === "aprobado").length} aprobada(s)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">
                  En Negociación / Enviados
                </span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {presupuestos.filter(p => p.estado === "enviado" || p.estado === "emitido" || p.estado === "en_negociacion").length}
                </span>
                <span className="text-[10px] text-amber-400/80 block mt-0.5">
                  Pendientes de cierre
                </span>
              </div>
            </div>

            {/* Listado de Presupuestos */}
            {loadingPresupuestos ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Cargando cotizaciones del cliente...</span>
              </div>
            ) : presupuestos.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card/40 space-y-3">
                <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                <h4 className="text-sm font-bold text-foreground">No hay presupuestos asignados</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Aún no se han emitido propuestas para este cliente. Puedes generar una cotización formal con plantilla de servicios.
                </p>
                <Link
                  href={`/presupuestos?clienteId=${cliente.id}&clienteNombre=${encodeURIComponent(cliente.nombre)}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Generar Primera Cotización
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border/40">
                    <tr>
                      <th className="py-3 px-4 font-black text-foreground">N° Presupuesto</th>
                      <th className="py-3 px-4 font-black text-foreground">Fecha</th>
                      <th className="py-3 px-4 font-black text-foreground">Descripción / Proyecto</th>
                      <th className="py-3 px-4 font-black text-foreground">Estado</th>
                      <th className="py-3 px-4 font-black text-foreground text-right">Total</th>
                      <th className="py-3 px-4 font-black text-foreground text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presupuestos.map((p) => {
                      const getBadgeColor = (estado?: string) => {
                        switch (estado) {
                          case "aprobado":
                            return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
                          case "enviado":
                          case "emitido":
                            return "bg-sky-500/20 text-sky-400 border-sky-500/30";
                          case "rechazado":
                            return "bg-rose-500/20 text-rose-400 border-rose-500/30";
                          default:
                            return "bg-muted text-muted-foreground border-border";
                        }
                      };

                      let fechaStr = "—";
                      if (typeof p.fecha === "string") {
                        fechaStr = p.fecha.split("T")[0];
                      } else if (p.fecha && typeof p.fecha === "object" && "seconds" in p.fecha) {
                        fechaStr = new Date((p.fecha as { seconds: number }).seconds * 1000).toISOString().split("T")[0];
                      }

                      return (
                        <tr key={p.id || p.numero} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-foreground">
                            {p.numero}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-mono">
                            {fechaStr}
                          </td>
                          <td className="py-3 px-4 text-foreground truncate max-w-[200px]">
                            {p.nombre_proyecto || p.descripcion_proyecto || "Servicios Informáticos"}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getBadgeColor(p.estado)}`}>
                              {p.estado || "Borrador"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                            ${(p.totales?.total || 0).toLocaleString("es-CL")}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/presupuestos?q=${encodeURIComponent(p.numero)}`}
                              className="inline-flex items-center gap-1 text-primary hover:underline font-bold text-xs"
                            >
                              Ver <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA 4: MATRIZ OPERATIVA (PRODUCTOS Y SERVICIOS)          */}
        {/* ============================================================ */}
        {activeTab === "matriz" && (
          <div className="max-w-4xl mx-auto space-y-5">
            {/* PANEL RESUMEN: SERVICIOS RECURRENTES, MANTENCIONES & TIEMPOS DE COBRO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-white/15 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <RotateCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      Servicios Recurrentes & Tiempos de Cobro
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-slate-300 font-mono">
                        {clienteSubs.length} contratados
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Resumen financiero y operativo de mantenciones y hosting cobrados a este cliente
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/suscripciones"
                    className="h-8 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <span>Ir a Suscripciones</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {loadingSubs ? (
                <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin text-indigo-400" />
                  Cargando servicios recurrentes...
                </div>
              ) : clienteSubs.length === 0 ? (
                <div className="py-4 px-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                  <p>
                    Este cliente no tiene mantenciones web ni servicios de hosting registrados en el sistema.
                  </p>
                  <Link
                    href="/suscripciones"
                    className="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar Mantención
                  </Link>
                </div>
              ) : (() => {
                const totalCLP = clienteSubs.reduce((acc, s) => acc + (s.montoEstimadoMensualCLP || (s.moneda === "CLP" ? s.monto : 0)), 0);
                const totalHorasSla = clienteSubs.reduce((acc, s) => acc + (s.slaHorasMensuales || 0), 0);
                const totalHorasConsumidas = clienteSubs.reduce((acc, s) => acc + (s.horasConsumidasMes || 0), 0);
                const tieneVencido = clienteSubs.some(s => s.estadoCobro === "vencido" || s.estado === "vencido");
                const tienePorCobrar = clienteSubs.some(s => s.estadoCobro === "por_cobrar" || s.estado === "por_vencer");
                const proximoCorte = clienteSubs
                  .filter(s => s.fechaCorte)
                  .sort((a, b) => (a.fechaCorte! > b.fechaCorte! ? 1 : -1))[0];

                return (
                  <div className="space-y-3.5">
                    {/* Tarjetas de Métricas de Cobro */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Mensual</span>
                        <span className="text-sm font-mono font-black text-emerald-400">
                          ${totalCLP.toLocaleString("es-CL")} CLP
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado General</span>
                        <div>
                          {tieneVencido ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <ShieldAlert className="w-3 h-3 text-rose-400" /> Vencido
                            </span>
                          ) : tienePorCobrar ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-amber-400" /> Por Cobrar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Al Día
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Próximo Corte</span>
                        <span className="text-xs font-mono font-bold text-slate-200 block">
                          {proximoCorte?.fechaCorte ? new Date(proximoCorte.fechaCorte).toLocaleDateString("es-CL") : "N/A"}
                        </span>
                        {proximoCorte?.diasRestantes !== undefined && (
                          <span className={`text-[10px] font-bold ${proximoCorte.diasRestantes < 0 ? "text-rose-400" : proximoCorte.diasRestantes <= 7 ? "text-amber-400" : "text-slate-400"}`}>
                            {proximoCorte.diasRestantes < 0 ? `Atrasado ${Math.abs(proximoCorte.diasRestantes)}d` : `En ${proximoCorte.diasRestantes}d`}
                          </span>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-teal-400 block">SLA Soporte</span>
                        <span className="text-xs font-mono font-bold text-teal-300 block">
                          {totalHorasConsumidas}h / {totalHorasSla}h mes
                        </span>
                        <span className="text-[10px] text-slate-400">Horas incluidas</span>
                      </div>
                    </div>

                    {/* Lista Breve de Servicios del Cliente */}
                    <div className="space-y-1.5">
                      {clienteSubs.map((sub) => (
                        <div 
                          key={sub.id} 
                          className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">{sub.nombre}</span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              {sub.dominio && <span>{sub.dominio} • </span>}
                              <span className="capitalize">{sub.cicloFacturacion}</span>
                              {sub.aplicaFactura && <span className="text-emerald-400 font-bold">• Factura IVA</span>}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="font-mono font-bold text-white text-xs">
                              ${sub.monto.toLocaleString("es-CL")} {sub.moneda}
                            </span>

                            {cliente.telefono && (
                              <button
                                type="button"
                                onClick={() => {
                                  const tel = cliente.telefono?.replace(/\D/g, "");
                                  const txt = encodeURIComponent(
                                    `Hola ${cliente.nombre}, te contacto de Servicios Informáticos Hoja SpA respecto a la mantención de *${sub.nombre}* ($${sub.monto.toLocaleString("es-CL")} ${sub.moneda}).`
                                  );
                                  window.open(`https://wa.me/${tel}?text=${txt}`, "_blank");
                                }}
                                className="h-7 w-7 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/30 transition-all"
                                title="Enviar mensaje de cobro por WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Sub-navegador de la Matriz Operativa */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1 bg-muted/40 rounded-2xl border border-border/50">
              <button
                type="button"
                onClick={() => setMatrizSubTab("web")}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  matrizSubTab === "web" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe className="h-3.5 w-3.5" /> Páginas Web
              </button>
              <button
                type="button"
                onClick={() => setMatrizSubTab("correos")}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  matrizSubTab === "correos" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail className="h-3.5 w-3.5" /> Correos
              </button>
              <button
                type="button"
                onClick={() => setMatrizSubTab("dominio")}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  matrizSubTab === "dominio" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Server className="h-3.5 w-3.5" /> Dominios
              </button>
              <button
                type="button"
                onClick={() => setMatrizSubTab("app")}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  matrizSubTab === "app" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Laptop className="h-3.5 w-3.5" /> Apps
              </button>
              <button
                type="button"
                onClick={() => setMatrizSubTab("hardware")}
                className={`col-span-2 sm:col-span-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  matrizSubTab === "hardware" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Cpu className="h-3.5 w-3.5" /> Hardware
              </button>
            </div>

            {/* 1. Sub-sección: Páginas Web */}
            {matrizSubTab === "web" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-bold text-muted-foreground">Páginas Web & CMS</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      const nuevo: ItemPaginaWeb = {
                        id: `web-${Date.now()}`,
                        url: "",
                        tipoCMSOTecnologia: "WordPress",
                        hostingProveedor: "",
                        credenciales: { panelUrl: "", usuario: "", password: "", notas: "" },
                        serviciosAsociados: [],
                      };
                      setPaginasWeb((prev) => [...prev, nuevo]);
                    }}
                    className="rounded-xl text-xs font-bold gap-1 h-8"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir Web
                  </Button>
                </div>

                {paginasWeb.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    Sin páginas web registradas en la matriz operativa.
                  </p>
                ) : (
                  paginasWeb.map((w, index) => (
                    <div key={w.id} className="p-4 rounded-3xl bg-card border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-primary">Web #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setPaginasWeb((prev) => prev.filter((_, i) => i !== index))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">URL Sitio Web</Label>
                          <Input
                            placeholder="https://empresa.cl"
                            value={w.url}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPaginasWeb((prev) => prev.map((item, i) => i === index ? { ...item, url: val } : item));
                            }}
                            className="rounded-xl text-xs bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">CMS / Stack</Label>
                          <Input
                            placeholder="WordPress / Next.js / Shopify"
                            value={w.tipoCMSOTecnologia}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPaginasWeb((prev) => prev.map((item, i) => i === index ? { ...item, tipoCMSOTecnologia: val } : item));
                            }}
                            className="rounded-xl text-xs bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Proveedor Hosting</Label>
                          <Input
                            placeholder="Bluehosting / Vercel / AWS"
                            value={w.hostingProveedor}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPaginasWeb((prev) => prev.map((item, i) => i === index ? { ...item, hostingProveedor: val } : item));
                            }}
                            className="rounded-xl text-xs bg-background"
                          />
                        </div>
                      </div>

                      {/* Credenciales de Acceso */}
                      <div className="p-3 rounded-2xl bg-muted/20 border border-border/40 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Credenciales & Panel</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Input
                            placeholder="Panel URL (ej. /wp-admin)"
                            value={w.credenciales?.panelUrl || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPaginasWeb((prev) => prev.map((item, i) => i === index ? { ...item, credenciales: { ...item.credenciales, panelUrl: val } } : item));
                            }}
                            className="rounded-xl text-xs bg-background"
                          />
                          <Input
                            placeholder="Usuario / Correo"
                            value={w.credenciales?.usuario || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPaginasWeb((prev) => prev.map((item, i) => i === index ? { ...item, credenciales: { ...item.credenciales, usuario: val } } : item));
                            }}
                            className="rounded-xl text-xs bg-background"
                          />
                          <div className="relative">
                            <Input
                              type={showPassMap[`web-${w.id}`] ? "text" : "password"}
                              placeholder="Contraseña"
                              value={w.credenciales?.password || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPaginasWeb((prev) => prev.map((item, i) => i === index ? { ...item, credenciales: { ...item.credenciales, password: val } } : item));
                              }}
                              className="rounded-xl text-xs bg-background pr-8"
                            />
                            <button
                              type="button"
                              onClick={() => togglePassVisibility(`web-${w.id}`)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassMap[`web-${w.id}`] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Sub-servicios asociados (ej. Cloudflare) */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-muted-foreground">Servicios Asociados (Cloudflare, CDN, SSL, etc.)</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nuevoServ: ServicioAsociado = {
                                id: `serv-${Date.now()}`,
                                proveedor: "Cloudflare",
                                nombre: "DNS & Proxy SSL",
                                descripcion: "",
                              };
                              setPaginasWeb((prev) => prev.map((item, i) => i === index ? { ...item, serviciosAsociados: [...(item.serviciosAsociados || []), nuevoServ] } : item));
                            }}
                            className="text-[10px] font-bold text-primary hover:underline"
                          >
                            + Añadir Servicio
                          </button>
                        </div>
                        {w.serviciosAsociados?.map((s, sIdx) => (
                          <div key={s.id} className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border/50 text-xs">
                            <Input
                              placeholder="Proveedor (Cloudflare)"
                              value={s.proveedor}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...w.serviciosAsociados];
                                updated[sIdx].proveedor = val;
                                setPaginasWeb((prev) => prev.map((item, i) => i === index ? { ...item, serviciosAsociados: updated } : item));
                              }}
                              className="h-7 text-xs rounded-lg"
                            />
                            <Input
                              placeholder="Descripción del servicio"
                              value={s.descripcion || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...w.serviciosAsociados];
                                updated[sIdx].descripcion = val;
                                setPaginasWeb((prev) => prev.map((item, i) => i === index ? { ...item, serviciosAsociados: updated } : item));
                              }}
                              className="h-7 text-xs rounded-lg flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = w.serviciosAsociados.filter((_, i) => i !== sIdx);
                                setPaginasWeb((prev) => prev.map((item, i) => i === index ? { ...item, serviciosAsociados: updated } : item));
                              }}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. Sub-sección: Correos */}
            {matrizSubTab === "correos" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-bold text-muted-foreground">Configuración de Correos Corporativos</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      const nuevo: ItemCorreos = {
                        id: `correo-${Date.now()}`,
                        dominioCorreo: "",
                        proveedor: "Bluehosting",
                        cuentas: [],
                      };
                      setCorreos((prev) => [...prev, nuevo]);
                    }}
                    className="rounded-xl text-xs font-bold gap-1 h-8"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir Dominio de Correo
                  </Button>
                </div>

                {correos.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    Sin dominios de correo registrados.
                  </p>
                ) : (
                  correos.map((c, index) => (
                    <div key={c.id} className="p-4 rounded-3xl bg-card border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-primary">Servicio de Correos #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setCorreos((prev) => prev.filter((_, i) => i !== index))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Dominio (@empresa.cl)</Label>
                          <Input
                            placeholder="empresa.cl"
                            value={c.dominioCorreo}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCorreos((prev) => prev.map((item, i) => i === index ? { ...item, dominioCorreo: val } : item));
                            }}
                            className="rounded-xl text-xs bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Proveedor de Correo</Label>
                          <Input
                            placeholder="Bluehosting / Google Workspace / Microsoft 365"
                            value={c.proveedor}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCorreos((prev) => prev.map((item, i) => i === index ? { ...item, proveedor: val } : item));
                            }}
                            className="rounded-xl text-xs bg-background"
                          />
                        </div>
                      </div>

                      {/* Lista de cuentas creadas */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-muted-foreground">Buzones & Cuentas</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nuevaCuenta: CuentaCorreo = {
                                email: "",
                                password: "",
                                notas: "",
                              };
                              setCorreos((prev) => prev.map((item, i) => i === index ? { ...item, cuentas: [...(item.cuentas || []), nuevaCuenta] } : item));
                            }}
                            className="text-[10px] font-bold text-primary hover:underline"
                          >
                            + Añadir Cuenta
                          </button>
                        </div>

                        {c.cuentas?.map((acc, aIdx) => (
                          <div key={aIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 rounded-xl bg-background border border-border/50 text-xs">
                            <Input
                              placeholder="contacto@empresa.cl"
                              value={acc.email}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...c.cuentas];
                                updated[aIdx].email = val;
                                setCorreos((prev) => prev.map((item, i) => i === index ? { ...item, cuentas: updated } : item));
                              }}
                              className="h-7 text-xs rounded-lg"
                            />
                            <div className="relative">
                              <Input
                                type={showPassMap[`mail-${c.id}-${aIdx}`] ? "text" : "password"}
                                placeholder="Contraseña"
                                value={acc.password || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...c.cuentas];
                                  updated[aIdx].password = val;
                                  setCorreos((prev) => prev.map((item, i) => i === index ? { ...item, cuentas: updated } : item));
                                }}
                                className="h-7 text-xs rounded-lg pr-7"
                              />
                              <button
                                type="button"
                                onClick={() => togglePassVisibility(`mail-${c.id}-${aIdx}`)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                              >
                                {showPassMap[`mail-${c.id}-${aIdx}`] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Input
                                placeholder="Notas / Servidor"
                                value={acc.notas || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...c.cuentas];
                                  updated[aIdx].notas = val;
                                  setCorreos((prev) => prev.map((item, i) => i === index ? { ...item, cuentas: updated } : item));
                                }}
                                className="h-7 text-xs rounded-lg flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = c.cuentas.filter((_, i) => i !== aIdx);
                                  setCorreos((prev) => prev.map((item, i) => i === index ? { ...item, cuentas: updated } : item));
                                }}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. Sub-sección: Dominios */}
            {matrizSubTab === "dominio" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-bold text-muted-foreground">Registro & Renovación de Dominios</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      const nuevo: ItemDominio = {
                        id: `dom-${Date.now()}`,
                        dominio: "",
                        administradoPorNosotros: true,
                        proveedorRegistrador: "NIC Chile",
                        fechaRenovacion: "",
                        costoRenovacion: 0,
                      };
                      setDominios((prev) => [...prev, nuevo]);
                    }}
                    className="rounded-xl text-xs font-bold gap-1 h-8"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir Dominio
                  </Button>
                </div>

                {dominios.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    Sin dominios registrados.
                  </p>
                ) : (
                  dominios.map((d, index) => (
                    <div key={d.id} className="p-4 rounded-3xl bg-card border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-primary">Dominio #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setDominios((prev) => prev.filter((_, i) => i !== index))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Nombre de Dominio</Label>
                          <Input
                            placeholder="miempresa.cl"
                            value={d.dominio}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDominios((prev) => prev.map((item, i) => i === index ? { ...item, dominio: val } : item));
                            }}
                            className="rounded-xl text-xs bg-background font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Registrador</Label>
                          <Input
                            placeholder="NIC Chile / GoDaddy"
                            value={d.proveedorRegistrador}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDominios((prev) => prev.map((item, i) => i === index ? { ...item, proveedorRegistrador: val } : item));
                            }}
                            className="rounded-xl text-xs bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Fecha de Renovación</Label>
                          <Input
                            type="date"
                            value={d.fechaRenovacion || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDominios((prev) => prev.map((item, i) => i === index ? { ...item, fechaRenovacion: val } : item));
                            }}
                            className="rounded-xl text-xs bg-background font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/40 text-xs">
                        <span className="font-bold text-foreground">
                          ¿La compra y administración corre por nuestra cuenta?
                        </span>
                        <input
                          type="checkbox"
                          checked={d.administradoPorNosotros}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setDominios((prev) => prev.map((item, i) => i === index ? { ...item, administradoPorNosotros: val } : item));
                          }}
                          className="h-4 w-4 accent-primary rounded"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. Sub-sección: App Personalizada */}
            {matrizSubTab === "app" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-bold text-muted-foreground">Aplicaciones a Medida</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      const nuevo: ItemAppPersonalizada = {
                        id: `app-${Date.now()}`,
                        nombreApp: "",
                        tipoApp: "web",
                        stackTecnologico: "Next.js / Node.js",
                        serviciosAsociados: [],
                      };
                      setAppsPersonalizadas((prev) => [...prev, nuevo]);
                    }}
                    className="rounded-xl text-xs font-bold gap-1 h-8"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir App
                  </Button>
                </div>

                {appsPersonalizadas.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    Sin aplicaciones registradas.
                  </p>
                ) : (
                  appsPersonalizadas.map((app, index) => (
                    <div key={app.id} className="p-4 rounded-3xl bg-card border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-primary">App #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setAppsPersonalizadas((prev) => prev.filter((_, i) => i !== index))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Nombre de la Aplicación</Label>
                          <Input
                            placeholder="Portal Clientes / App Móvil"
                            value={app.nombreApp}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAppsPersonalizadas((prev) => prev.map((item, i) => i === index ? { ...item, nombreApp: val } : item));
                            }}
                            className="rounded-xl text-xs bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Tipo de App</Label>
                          <select
                            value={app.tipoApp}
                            onChange={(e) => {
                              const val = e.target.value as ItemAppPersonalizada["tipoApp"];
                              setAppsPersonalizadas((prev) => prev.map((item, i) => i === index ? { ...item, tipoApp: val } : item));
                            }}
                            className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
                          >
                            <option value="web">Web App</option>
                            <option value="movil">App Móvil (iOS/Android)</option>
                            <option value="interna">Software Interno / ERP</option>
                            <option value="otra">Otra</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Stack Tecnológico</Label>
                          <Input
                            placeholder="React Native / FastAPI"
                            value={app.stackTecnologico}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAppsPersonalizadas((prev) => prev.map((item, i) => i === index ? { ...item, stackTecnologico: val } : item));
                            }}
                            className="rounded-xl text-xs bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 5. Sub-sección: Hardware */}
            {matrizSubTab === "hardware" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-bold text-muted-foreground">Equipamiento e Infraestructura Física</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      const nuevo: ItemHardware = {
                        id: `hw-${Date.now()}`,
                        equipo: "",
                        numeroSerie: "",
                        ubicacion: "Oficina Principal",
                        historialMantenimientos: [],
                      };
                      setHardware((prev) => [...prev, nuevo]);
                    }}
                    className="rounded-xl text-xs font-bold gap-1 h-8"
                  >
                    <Plus className="h-3.5 w-3.5" /> Registrar Equipo
                  </Button>
                </div>

                {hardware.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    Sin equipamiento físico registrado.
                  </p>
                ) : (
                  hardware.map((hw, index) => (
                    <div key={hw.id} className="p-4 rounded-3xl bg-card border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-primary">Equipo #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setHardware((prev) => prev.filter((_, i) => i !== index))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Descripción del Equipo</Label>
                          <Input
                            placeholder="Servidor Dell / Router Mikrotik"
                            value={hw.equipo}
                            onChange={(e) => {
                              const val = e.target.value;
                              setHardware((prev) => prev.map((item, i) => i === index ? { ...item, equipo: val } : item));
                            }}
                            className="rounded-xl text-xs bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Número de Serie</Label>
                          <Input
                            placeholder="SN-123456789"
                            value={hw.numeroSerie || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setHardware((prev) => prev.map((item, i) => i === index ? { ...item, numeroSerie: val } : item));
                            }}
                            className="rounded-xl text-xs bg-background font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Ubicación / Sala</Label>
                          <Input
                            placeholder="Rack Servidores / Sucursal"
                            value={hw.ubicacion || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setHardware((prev) => prev.map((item, i) => i === index ? { ...item, ubicacion: val } : item));
                            }}
                            className="rounded-xl text-xs bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Guardar Matriz Operativa */}
            <div className="flex justify-end pt-3 border-t border-border/40">
              <Button
                onClick={handleSaveMatriz}
                disabled={savingMatriz}
                className="rounded-2xl px-6 py-2.5 bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-2"
              >
                {savingMatriz ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando Matriz...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Guardar Matriz Operativa
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA 4: TICKETS DE SOPORTE (SECUENCIALES POR CLIENTE)     */}
        {/* ============================================================ */}
        {activeTab === "tickets" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
              <div>
                <h3 className="text-base font-black text-foreground">Tickets de Incidencias & Soporte</h3>
                <p className="text-xs text-muted-foreground">
                  Identificador secuencial por cliente (Ticket #1, #2...) con 4 niveles de severidad.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowNewTicketModal(true)}
                  className="rounded-xl bg-primary text-primary-foreground font-black gap-1.5 h-9"
                >
                  <Plus className="h-4 w-4" /> Nuevo Ticket
                </Button>
              </div>
            </div>

            {/* Filtros de tickets */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
              <button
                type="button"
                onClick={() => setTicketFilter("todos")}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  ticketFilter === "todos" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                Todos ({tickets.length})
              </button>
              <button
                type="button"
                onClick={() => setTicketFilter("abierto")}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  ticketFilter === "abierto" ? "bg-sky-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                Abiertos
              </button>
              <button
                type="button"
                onClick={() => setTicketFilter("en_progreso")}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  ticketFilter === "en_progreso" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                En Progreso
              </button>
              <button
                type="button"
                onClick={() => setTicketFilter("resuelto")}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  ticketFilter === "resuelto" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                Resueltos
              </button>
            </div>

            {/* Modal de Creación de Ticket */}
            {showNewTicketModal && (
              <form onSubmit={handleCreateTicket} className="p-4 rounded-3xl bg-card border border-primary/40 shadow-xl space-y-3.5 animate-in fade-in-50">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-primary">
                    Nuevo Ticket de Incidencia
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewTicketModal(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-bold text-foreground">Título / Problema Reportado *</Label>
                    <Input
                      placeholder="Ej. Falla en sincronización de correos IMAP"
                      value={newTicketTitulo}
                      onChange={(e) => setNewTicketTitulo(e.target.value)}
                      className="rounded-xl text-xs bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-bold text-foreground">Descripción Detallada *</Label>
                    <Textarea
                      placeholder="Indica el comportamiento esperado, mensaje de error y pasos para reproducir..."
                      value={newTicketDescripcion}
                      onChange={(e) => setNewTicketDescripcion(e.target.value)}
                      className="rounded-xl text-xs bg-background"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-bold text-foreground">
                      Nivel de Severidad (4 opciones obligatorias) *
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(["Baja", "Media", "Alta", "Recomendación/Sugerencia"] as TicketSeveridad[]).map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setNewTicketSeveridad(sev)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-black border transition-all text-center ${
                            newTicketSeveridad === sev
                              ? sev === "Alta"
                                ? "bg-rose-500 text-white border-rose-600 shadow-md"
                                : sev === "Media"
                                ? "bg-amber-500 text-white border-amber-600 shadow-md"
                                : sev === "Baja"
                                ? "bg-emerald-500 text-white border-emerald-600 shadow-md"
                                : "bg-purple-600 text-white border-purple-700 shadow-md"
                              : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewTicketModal(false)}
                    className="rounded-xl text-xs"
                  >
                    Descartar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={creatingTicket}
                    className="rounded-xl bg-primary text-primary-foreground font-black text-xs gap-1.5"
                  >
                    {creatingTicket ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Registrar Ticket
                  </Button>
                </div>
              </form>
            )}

            {/* Listado de Tickets */}
            {loadingTickets ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs">Cargando tickets de soporte...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-border text-center text-muted-foreground text-xs italic">
                No hay tickets registrados que coincidan con el filtro.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-3xl bg-card border border-white/10 shadow-sm space-y-2 hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-black text-xs font-mono">
                          Ticket #{t.numero}
                        </span>
                        {getSeveridadBadge(t.severidad)}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          t.estado === "resuelto"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : t.estado === "en_progreso"
                            ? "bg-amber-500/20 text-amber-300"
                            : t.estado === "cerrado"
                            ? "bg-slate-500/20 text-slate-300"
                            : "bg-sky-500/20 text-sky-300"
                        }`}>
                          {t.estado}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={t.estado}
                          onChange={(e) => handleUpdateTicketStatus(t.id!, e.target.value as TicketEstado)}
                          className="h-7 text-[11px] rounded-lg border border-border bg-background px-2 font-bold"
                        >
                          <option value="abierto">Abierto</option>
                          <option value="en_progreso">En Progreso</option>
                          <option value="resuelto">Resuelto</option>
                          <option value="cerrado">Cerrado</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteTicket(t.id!)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-lg"
                          title="Eliminar ticket"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-black text-foreground pt-0.5">
                      {t.titulo}
                    </h4>

                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {t.descripcion}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
                      <span>Registrado por: {t.autor || "Operador"}</span>
                      <span>
                        {typeof t.createdAt === "string" 
                          ? new Date(t.createdAt).toLocaleString("es-CL") 
                          : "Reciente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
