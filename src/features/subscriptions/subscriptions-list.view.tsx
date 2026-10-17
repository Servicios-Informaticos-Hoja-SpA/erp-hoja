"use client";

import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Server, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  Edit3, 
  Trash2, 
  ExternalLink,
  DollarSign,
  Globe,
  CreditCard,
  Cpu,
  Wifi,
  Package,
  ShieldAlert,
  ArrowUpDown,
  History,
  Receipt,
  PauseCircle,
  Building,
  User,
  MessageSquare,
  Phone,
  Code2,
  Headphones,
  Check,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Subscription, 
  Cliente,
  CategoriaServicioRecurrente, 
  CicloFacturacion, 
  EstadoSuscripcion,
  EstadoCobroServicio
} from "@/lib/types";

interface SubscriptionsListViewProps {
  subscriptions: Subscription[];
  clientes?: Cliente[];
  loading: boolean;
  onNew: (clienteId?: string) => void;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => Promise<void>;
  onPauseToggle: (sub: Subscription) => Promise<void>;
  onRenovar: (id: string, payload: { periodo?: CicloFacturacion; monto?: number; notas?: string; comprobanteRef?: string }) => Promise<void>;
}

const CATEGORIAS_INFO: Record<CategoriaServicioRecurrente, { label: string; icon: React.ElementType; color: string; border: string; bg: string }> = {
  // Clientes
  mantencion_web: {
    label: "Mantención Web & CMS",
    icon: Globe,
    color: "text-sky-400",
    border: "border-sky-500/30",
    bg: "bg-sky-500/10"
  },
  mantencion_software: {
    label: "Mantención Software & App",
    icon: Code2,
    color: "text-indigo-400",
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/10"
  },
  soporte_mensual: {
    label: "Soporte SLA & Mesa Ayuda",
    icon: Headphones,
    color: "text-teal-400",
    border: "border-teal-500/30",
    bg: "bg-teal-500/10"
  },
  hosting_cliente: {
    label: "Hosting Administrado Cliente",
    icon: Server,
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10"
  },
  servidor_dedicado: {
    label: "Servidor Dedicado / VPS",
    icon: Cpu,
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10"
  },
  // Costos Propios Hoja SpA
  bancario_tarjetas: { 
    label: "Tarjetas & Cuentas", 
    icon: CreditCard, 
    color: "text-amber-400", 
    border: "border-amber-500/30", 
    bg: "bg-amber-500/10" 
  },
  hosting_propio: { 
    label: "Hosting & Infra Propia", 
    icon: Server, 
    color: "text-indigo-400", 
    border: "border-indigo-500/30", 
    bg: "bg-indigo-500/10" 
  },
  software_saas: { 
    label: "Software & SaaS / APIs", 
    icon: Cpu, 
    color: "text-violet-400", 
    border: "border-violet-500/30", 
    bg: "bg-violet-500/10" 
  },
  dominios_propios: { 
    label: "Dominios Propios", 
    icon: Globe, 
    color: "text-emerald-400", 
    border: "border-emerald-500/30", 
    bg: "bg-emerald-500/10" 
  },
  conectividad: { 
    label: "Conectividad & Telefonía", 
    icon: Wifi, 
    color: "text-blue-400", 
    border: "border-blue-500/30", 
    bg: "bg-blue-500/10" 
  },
  otro: { 
    label: "Otros Costos Fijos", 
    icon: Package, 
    color: "text-slate-400", 
    border: "border-slate-500/30", 
    bg: "bg-slate-500/10" 
  },
};

type SortField = "nombre" | "proveedor" | "monto" | "fechaCorte";
type SortDirection = "asc" | "desc";
type TabView = "clientes" | "empresa" | "todos";

export function SubscriptionsListView({
  subscriptions,
  clientes = [],
  loading,
  onNew,
  onEdit,
  onDelete,
  onPauseToggle,
  onRenovar,
}: SubscriptionsListViewProps) {
  const [activeTab, setActiveTab] = useState<TabView>("clientes");
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todas");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("fechaCorte");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Modales interactivos
  const [renewSub, setRenewSub] = useState<Subscription | null>(null);
  const [renewCycle, setRenewCycle] = useState<CicloFacturacion>("mensual");
  const [renewMonto, setRenewMonto] = useState<number>(0);
  const [renewNotas, setRenewNotas] = useState("");
  const [renewComprobante, setRenewComprobante] = useState("");
  const [renewing, setRenewing] = useState(false);

  const [historySub, setHistorySub] = useState<Subscription | null>(null);
  const [deleteSub, setDeleteSub] = useState<Subscription | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(1);
  const [deleting, setDeleting] = useState(false);

  // Ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Separación por tipo
  const subsClientes = useMemo(() => {
    return subscriptions.filter(s => s.tipoRecurrencia === "cliente_ingreso" || Boolean(s.clienteId));
  }, [subscriptions]);

  const subsEmpresa = useMemo(() => {
    return subscriptions.filter(s => s.tipoRecurrencia !== "cliente_ingreso" && !s.clienteId);
  }, [subscriptions]);

  // KPIs Generales y de Atención
  const kpis = useMemo(() => {
    let ingresosMensualCLP = 0;
    let egresosMensualCLP = 0;
    let cobrosPendientesClientesCount = 0;
    let cobrosPendientesMontoCLP = 0;
    let proximosVencerCount = 0;

    subscriptions.forEach(s => {
      const isPaused = s.estado === "pausado" || s.estado === "suspendido";
      if (isPaused) return;

      const montoMensual = s.montoEstimadoMensualCLP || (s.moneda === "CLP" ? s.monto : 0);
      const isCliente = s.tipoRecurrencia === "cliente_ingreso" || Boolean(s.clienteId);

      if (isCliente) {
        ingresosMensualCLP += montoMensual;
        if (s.estadoCobro === "por_cobrar" || s.estadoCobro === "vencido" || s.estado === "vencido" || s.estado === "por_vencer") {
          cobrosPendientesClientesCount += 1;
          cobrosPendientesMontoCLP += (s.moneda === "CLP" ? s.monto : (s.montoEstimadoMensualCLP || 0));
        }
      } else {
        egresosMensualCLP += montoMensual;
      }

      if (s.estado === "por_vencer" || (s.diasRestantes !== undefined && s.diasRestantes >= 0 && s.diasRestantes <= 15)) {
        proximosVencerCount += 1;
      }
    });

    const mrrNetoCLP = ingresosMensualCLP - egresosMensualCLP;

    return {
      ingresosMensualCLP,
      egresosMensualCLP,
      mrrNetoCLP,
      cobrosPendientesClientesCount,
      cobrosPendientesMontoCLP,
      proximosVencerCount,
      totalClientesActivos: new Set(subsClientes.map(s => s.clienteId || s.clienteNombre).filter(Boolean)).size,
    };
  }, [subscriptions, subsClientes]);

  // Agrupación por Cliente
  const gruposClientes = useMemo(() => {
    const map = new Map<string, {
      clienteId?: string;
      clienteNombre: string;
      clienteRut?: string;
      clienteTelefono?: string;
      clienteEmail?: string;
      servicios: Subscription[];
      totalMensualCLP: number;
      estadoCobroGeneral: "al_dia" | "por_cobrar" | "vencido";
      diasProximoCorte?: number;
      proximoCorteFecha?: string;
      horasSlaTotal: number;
      horasSlaConsumidas: number;
    }>();

    // 1. Agregar clientes que tienen servicios asociados
    subsClientes.forEach(sub => {
      const key = sub.clienteId || sub.clienteNombre || "Sin Cliente";
      const existing = map.get(key) || {
        clienteId: sub.clienteId,
        clienteNombre: sub.clienteNombre || "Cliente General",
        clienteRut: sub.clienteRut,
        clienteTelefono: sub.clienteTelefono,
        clienteEmail: sub.clienteEmail,
        servicios: [],
        totalMensualCLP: 0,
        estadoCobroGeneral: "al_dia",
        horasSlaTotal: 0,
        horasSlaConsumidas: 0,
      };

      existing.servicios.push(sub);

      const monto = sub.montoEstimadoMensualCLP || (sub.moneda === "CLP" ? sub.monto : 0);
      existing.totalMensualCLP += monto;
      existing.horasSlaTotal += (sub.slaHorasMensuales || 0);
      existing.horasSlaConsumidas += (sub.horasConsumidasMes || 0);

      // Estado general: 'vencido' domina sobre 'por_cobrar', y este sobre 'al_dia'
      if (sub.estadoCobro === "vencido" || sub.estado === "vencido") {
        existing.estadoCobroGeneral = "vencido";
      } else if ((sub.estadoCobro === "por_cobrar" || sub.estado === "por_vencer") && existing.estadoCobroGeneral !== "vencido") {
        existing.estadoCobroGeneral = "por_cobrar";
      }

      // Buscar el próximo corte más cercano
      if (sub.fechaCorte) {
        if (!existing.proximoCorteFecha || sub.fechaCorte < existing.proximoCorteFecha) {
          existing.proximoCorteFecha = sub.fechaCorte;
          existing.diasProximoCorte = sub.diasRestantes;
        }
      }

      map.set(key, existing);
    });

    // Enriquecer datos con la lista general de clientes si falta teléfono o rut
    clientes.forEach(c => {
      if (c.id && map.has(c.id)) {
        const item = map.get(c.id)!;
        if (!item.clienteRut && c.rut) item.clienteRut = c.rut;
        if (!item.clienteTelefono && c.telefono) item.clienteTelefono = c.telefono;
        if (!item.clienteEmail && c.email) item.clienteEmail = c.email;
      }
    });

    const list = Array.from(map.values());

    // Filtrar por búsqueda si aplica
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(g => 
      g.clienteNombre.toLowerCase().includes(q) ||
      (g.clienteRut || "").toLowerCase().includes(q) ||
      g.servicios.some(s => (s.nombre || "").toLowerCase().includes(q) || (s.dominio || "").toLowerCase().includes(q))
    );
  }, [subsClientes, clientes, search]);

  // Lista filtrada general (para pestaña general y empresa)
  const filtered = useMemo(() => {
    const sourceList = activeTab === "empresa" ? subsEmpresa : activeTab === "clientes" ? subsClientes : subscriptions;

    return sourceList
      .filter((sub) => {
        const query = search.toLowerCase();
        const matchesSearch = 
          (sub.nombre || "").toLowerCase().includes(query) ||
          (sub.proveedor || "").toLowerCase().includes(query) ||
          (sub.clienteNombre || "").toLowerCase().includes(query) ||
          (sub.tarjetaOCuenta || "").toLowerCase().includes(query) ||
          (sub.notas || "").toLowerCase().includes(query) ||
          (sub.dominio || "").toLowerCase().includes(query);

        if (!matchesSearch) return false;

        if (filterEstado !== "todos") {
          if (filterEstado === "pausados") {
            if (sub.estado !== "pausado" && sub.estado !== "suspendido") return false;
          } else if (filterEstado === "por_cobrar") {
            if (sub.estadoCobro !== "por_cobrar" && sub.estado !== "por_vencer") return false;
          } else if (filterEstado === "vencido") {
            if (sub.estadoCobro !== "vencido" && sub.estado !== "vencido") return false;
          } else if (sub.estado !== filterEstado) {
            return false;
          }
        }

        if (filterCategoria !== "todas" && sub.categoria !== filterCategoria) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";

        if (sortField === "nombre") {
          valA = (a.nombre || a.dominio || "").toLowerCase();
          valB = (b.nombre || b.dominio || "").toLowerCase();
        } else if (sortField === "proveedor") {
          valA = (a.proveedor || a.clienteNombre || "").toLowerCase();
          valB = (b.proveedor || b.clienteNombre || "").toLowerCase();
        } else if (sortField === "monto") {
          valA = a.montoEstimadoMensualCLP || a.monto || 0;
          valB = b.montoEstimadoMensualCLP || b.monto || 0;
        } else if (sortField === "fechaCorte") {
          valA = a.fechaCorte || "9999";
          valB = b.fechaCorte || "9999";
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [activeTab, subsEmpresa, subsClientes, subscriptions, search, filterEstado, filterCategoria, sortField, sortDirection]);

  // Abrir modal de renovación rápida
  const handleOpenRenovar = (sub: Subscription) => {
    setRenewSub(sub);
    setRenewCycle(sub.cicloFacturacion || "mensual");
    setRenewMonto(sub.monto || 0);
    setRenewNotas(sub.clienteNombre ? `Cobro mensual recibido de ${sub.clienteNombre}` : "");
    setRenewComprobante("");
  };

  const handleConfirmRenovar = async () => {
    if (!renewSub?.id) return;
    try {
      setRenewing(true);
      await onRenovar(renewSub.id, {
        periodo: renewCycle,
        monto: Number(renewMonto),
        notas: renewNotas.trim() || undefined,
        comprobanteRef: renewComprobante.trim() || undefined,
      });
      setRenewSub(null);
    } finally {
      setRenewing(false);
    }
  };

  // Abrir modal de eliminación
  const handleOpenDelete = (sub: Subscription) => {
    setDeleteSub(sub);
    setDeleteConfirmStep(1);
  };

  const handleConfirmDelete = async () => {
    if (!deleteSub?.id) return;
    try {
      setDeleting(true);
      await onDelete(deleteSub.id);
      setDeleteSub(null);
    } finally {
      setDeleting(false);
    }
  };

  // Generador de mensaje de WhatsApp para cobro de mantención
  const handleOpenWhatsAppCobro = (sub: Subscription, clienteTel?: string) => {
    const tel = clienteTel || sub.clienteTelefono || "";
    const cleanTel = tel.replace(/\D/g, "");
    if (!cleanTel) {
      alert("Este cliente no tiene un teléfono celular registrado.");
      return;
    }
    const montoStr = `$${sub.monto.toLocaleString("es-CL")} ${sub.moneda}`;
    const fechaCorteStr = sub.fechaCorte ? new Date(sub.fechaCorte).toLocaleDateString("es-CL") : "fin de mes";
    const texto = encodeURIComponent(
      `Hola ${sub.clienteNombre || "estimado/a"}, te saludo desde Servicios Informáticos Hoja SpA.\n\n` +
      `Te escribo para coordinar la facturación y pago de la mantención mensual correspondiente a: *${sub.nombre}* (${montoStr}).\n` +
      `Fecha de vencimiento/corte: ${fechaCorteStr}.\n\n` +
      `Quedamos a tu disposición para emitir la factura correspondiente. ¡Muchas gracias!`
    );
    window.open(`https://wa.me/${cleanTel}?text=${texto}`, "_blank");
  };

  const getEstadoCobroBadge = (estado?: EstadoCobroServicio | EstadoSuscripcion, diasRestantes?: number) => {
    switch (estado) {
      case "vencido":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Vencido {diasRestantes !== undefined && diasRestantes < 0 ? `(${Math.abs(diasRestantes)}d exp.)` : ""}
          </span>
        );
      case "por_cobrar":
      case "por_vencer":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Por Cobrar {diasRestantes !== undefined ? `(${diasRestantes}d)` : ""}
          </span>
        );
      case "al_dia":
      case "activo":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Al Día
          </span>
        );
      case "pausado":
      case "suspendido":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-700/50 text-slate-400 border border-slate-600">
            <PauseCircle className="w-3.5 h-3.5 text-slate-400" />
            Pausado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white/5 text-slate-300 border border-white/10">
            Activo
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ENCABEZADO PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <RotateCw className="w-7 h-7 text-indigo-400 animate-[spin_10s_linear_infinite]" />
            Suscripciones, Mantenciones & Tiempos de Cobro
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Gestión separada por cliente con control de horas SLA, cobros recurrentes y costos fijos cruzados con Flujo de Caja.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => onNew()}
            className="w-full sm:w-auto h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2 shadow-lg shadow-indigo-600/25 transition-all justify-center"
          >
            <Plus className="w-4 h-4" />
            Nuevo Servicio o Mantención
          </Button>
        </div>
      </div>

      {/* RESUMEN EJECUTIVO: QUÉ ATENDER EN TIEMPOS Y COBROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Cobros Pendientes a Clientes */}
        <Card className={`border relative overflow-hidden transition-all ${
          kpis.cobrosPendientesClientesCount > 0 
            ? "bg-amber-950/20 border-amber-500/40" 
            : "bg-card border-white/15"
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Cobros a Atender (Clientes)
              </span>
              {kpis.cobrosPendientesClientesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {kpis.cobrosPendientesClientesCount} por cobrar
                </span>
              )}
            </div>
            <div className="text-xl font-mono font-black text-amber-300">
              ${kpis.cobrosPendientesMontoCLP.toLocaleString("es-CL")} <span className="text-xs text-slate-400 font-sans">CLP</span>
            </div>
            <p className="text-xs text-slate-400">
              {kpis.cobrosPendientesClientesCount > 0
                ? "Mantenciones vencidas o con corte próximo"
                : "Todos los clientes al día en cobros"}
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Próximos Vencimientos en ≤ 15 días */}
        <Card className="bg-card border-white/15">
          <CardContent className="p-5 space-y-1.5">
            <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Cortes en ≤ 15 Días (Tiempos)
            </span>
            <div className="text-2xl font-mono font-black text-indigo-300">
              {kpis.proximosVencerCount}
            </div>
            <p className="text-xs text-slate-400">
              Servicios que requieren facturar o renovar pronto
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Egresos Recurrentes de Infraestructura */}
        <Card className="bg-card border-white/15">
          <CardContent className="p-5 space-y-1.5">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              Costos Fijos de Infraestructura
            </span>
            <div className="text-xl font-mono font-black text-rose-300">
              ${kpis.egresosMensualCLP.toLocaleString("es-CL")} <span className="text-xs text-slate-400 font-sans">CLP/mes</span>
            </div>
            <p className="text-xs text-slate-400">
              Hetzner, Bluehosting, Vercel, NIC y SaaS propios
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Margen Recurrente Neto (MRR Neto) */}
        <Card className="bg-card border-white/15 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          <CardContent className="p-5 space-y-1.5">
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Margen Recurrente Neto (MRR)
            </span>
            <div className={`text-xl font-mono font-black ${kpis.mrrNetoCLP >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              ${kpis.mrrNetoCLP.toLocaleString("es-CL")} <span className="text-xs text-slate-400 font-sans">CLP/mes</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Ingresos (+${kpis.ingresosMensualCLP.toLocaleString("es-CL")}) vs Egresos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* BARRA DE NAVEGACIÓN ENTRE MÓDULOS / PESTAÑAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* Pestañas de Vista */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10 max-w-full overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("clientes")}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 whitespace-nowrap ${
              activeTab === "clientes"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Por Cliente (Mantenciones & Cobros)
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">
              {gruposClientes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("empresa")}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 whitespace-nowrap ${
              activeTab === "empresa"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Costos de Infraestructura Propia
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">
              {subsEmpresa.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("todos")}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 whitespace-nowrap ${
              activeTab === "todos"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Todos los Servicios ({subscriptions.length})
          </button>
        </div>

        {/* Buscador Rápido */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, dominio, servicio..."
            className="pl-10 h-10 rounded-xl bg-card border-white/15 text-foreground placeholder:text-slate-500 text-xs font-medium"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: POR CLIENTE (MANTENCIONES & TIEMPOS DE COBRO)                   */}
      {/* ========================================================================= */}
      {activeTab === "clientes" && (
        <div className="space-y-5">
          {gruposClientes.length === 0 ? (
            <Card className="bg-card border-white/15 p-12 text-center rounded-2xl">
              <User className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-black text-white">No hay mantenciones de clientes registradas</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
                Registra los servicios recurrentes que cobras mensualmente a tus clientes (soporte web, hosting administrado, mantención de software).
              </p>
              <Button
                onClick={() => onNew()}
                className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2"
              >
                <Plus className="w-4 h-4" />
                Registrar Primer Servicio a Cliente
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {gruposClientes.map((grupo) => {
                const tieneCobroPendiente = grupo.estadoCobroGeneral === "por_cobrar" || grupo.estadoCobroGeneral === "vencido";
                const primerServicio = grupo.servicios[0];

                return (
                  <Card 
                    key={grupo.clienteId || grupo.clienteNombre}
                    className={`bg-card rounded-2xl overflow-hidden border transition-all ${
                      grupo.estadoCobroGeneral === "vencido"
                        ? "border-rose-500/40 shadow-lg shadow-rose-950/20"
                        : grupo.estadoCobroGeneral === "por_cobrar"
                        ? "border-amber-500/40 shadow-lg shadow-amber-950/20"
                        : "border-white/15 hover:border-indigo-500/30"
                    }`}
                  >
                    {/* Header de la Tarjeta de Cliente */}
                    <div className="p-5 bg-white/[0.02] border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Información de Identificación */}
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-base shrink-0">
                          {grupo.clienteNombre.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-white tracking-tight">
                              {grupo.clienteNombre}
                            </h3>
                            {getEstadoCobroBadge(grupo.estadoCobroGeneral, grupo.diasProximoCorte)}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-0.5">
                            {grupo.clienteRut && <span className="font-mono text-slate-300 font-bold">RUT: {grupo.clienteRut}</span>}
                            {grupo.clienteTelefono && (
                              <span className="flex items-center gap-1 text-slate-300">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {grupo.clienteTelefono}
                              </span>
                            )}
                            {grupo.horasSlaTotal > 0 && (
                              <span className="flex items-center gap-1 text-teal-300 font-bold">
                                <Clock className="w-3 h-3 text-teal-400" />
                                SLA: {grupo.horasSlaConsumidas}h / {grupo.horasSlaTotal}h mes
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Métricas y Acciones del Cliente */}
                      <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Mensual</span>
                          <span className="text-base font-mono font-black text-emerald-400">
                            ${grupo.totalMensualCLP.toLocaleString("es-CL")} <span className="text-xs font-sans text-slate-400">CLP/m</span>
                          </span>
                        </div>

                        {/* Botones de Acción Directa */}
                        <div className="flex items-center gap-2">
                          {/* Aviso WhatsApp de Cobro */}
                          {grupo.clienteTelefono && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenWhatsAppCobro(primerServicio, grupo.clienteTelefono)}
                              className={`h-9 px-3 rounded-xl font-bold text-xs gap-1.5 transition-all ${
                                tieneCobroPendiente
                                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                                  : "bg-white/5 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 border border-white/10"
                              }`}
                              title="Enviar recordatorio de cobro por WhatsApp con mensaje pre-armado"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden sm:inline">Aviso Cobro</span>
                            </Button>
                          )}

                          {/* Enlace Matriz Operativa del Cliente */}
                          {grupo.clienteId && (
                            <a
                              href={`/clientes?id=${grupo.clienteId}&tab=matriz`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-bold text-xs flex items-center gap-1.5 transition-all"
                              title="Ver Matriz Operativa técnica (Páginas, correos, dominios y servidores)"
                            >
                              <span>Matriz Operativa</span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
                            </a>
                          )}

                          {/* Añadir otro servicio a este cliente */}
                          <Button
                            size="sm"
                            onClick={() => onNew(grupo.clienteId)}
                            className="h-9 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs gap-1"
                            title="Añadir otra mantención o servicio recurrente a este cliente"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Añadir Servicio</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Sub-tabla / Lista de Servicios de este Cliente */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.01] text-slate-400 select-none">
                            <th className="py-2.5 px-5 font-bold">Servicio Contratado</th>
                            <th className="py-2.5 px-4 font-bold">Monto & Ciclo</th>
                            <th className="py-2.5 px-4 font-bold">Corte / Cobro (Tiempos)</th>
                            <th className="py-2.5 px-4 font-bold">Horas SLA</th>
                            <th className="py-2.5 px-4 font-bold">Estado Cobro</th>
                            <th className="py-2.5 px-5 font-bold text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {grupo.servicios.map((sub) => {
                            const catConfig = CATEGORIAS_INFO[sub.categoria] || CATEGORIAS_INFO.mantencion_web;
                            const CatIcon = catConfig.icon;
                            const isOverdue = sub.diasRestantes !== undefined && sub.diasRestantes < 0;

                            return (
                              <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                                {/* Servicio y Dominio */}
                                <td className="py-3 px-5 align-middle">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl ${catConfig.bg} border ${catConfig.border} flex items-center justify-center shrink-0`}>
                                      <CatIcon className={`w-3.5 h-3.5 ${catConfig.color}`} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-white text-xs truncate max-w-[280px] flex items-center gap-1.5">
                                        {sub.nombre}
                                        {sub.dominio && (
                                          <a
                                            href={sub.dominio.startsWith("http") ? sub.dominio : `https://${sub.dominio}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-400 hover:underline flex items-center gap-0.5 font-normal text-[11px]"
                                            title="Abrir sitio web del cliente"
                                          >
                                            ({sub.dominio})
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                        <span className={catConfig.color}>{catConfig.label}</span>
                                        {sub.aplicaFactura && (
                                          <>
                                            <span>•</span>
                                            <span className="text-emerald-400 font-bold">Factura IVA</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Monto y Ciclo */}
                                <td className="py-3 px-4 align-middle font-mono font-bold text-white">
                                  {sub.moneda === "UF"
                                    ? `${sub.monto} UF`
                                    : sub.moneda === "USD"
                                    ? `US$${sub.monto.toLocaleString("es-CL")}`
                                    : `$${sub.monto.toLocaleString("es-CL")} CLP`}
                                  <span className="block text-[10px] text-slate-400 font-sans capitalize font-normal">
                                    {sub.cicloFacturacion} {sub.diaPago ? `(Día ${sub.diaPago})` : ""}
                                  </span>
                                </td>

                                {/* Corte / Tiempos */}
                                <td className="py-3 px-4 align-middle">
                                  <div className="flex items-center gap-1.5 font-mono text-xs text-slate-200 font-bold">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    {sub.fechaCorte ? new Date(sub.fechaCorte).toLocaleDateString("es-CL") : "Sin fecha"}
                                  </div>
                                  <div className="mt-0.5">
                                    {sub.diasRestantes !== undefined ? (
                                      <span className={`text-[10px] font-bold ${
                                        isOverdue ? "text-rose-400 font-black" : sub.diasRestantes <= 7 ? "text-amber-400" : "text-emerald-400"
                                      }`}>
                                        {isOverdue 
                                          ? `Atrasado ${Math.abs(sub.diasRestantes)} días` 
                                          : sub.diasRestantes === 0
                                          ? "Corte hoy"
                                          : `En ${sub.diasRestantes} días`}
                                      </span>
                                    ) : null}
                                  </div>
                                </td>

                                {/* Horas SLA */}
                                <td className="py-3 px-4 align-middle">
                                  {sub.slaHorasMensuales ? (
                                    <div className="text-xs">
                                      <span className="font-mono font-bold text-teal-300">
                                        {sub.horasConsumidasMes || 0} / {sub.slaHorasMensuales} hrs
                                      </span>
                                      <div className="w-24 bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                                        <div 
                                          className={`h-full ${
                                            (sub.horasConsumidasMes || 0) >= sub.slaHorasMensuales ? "bg-rose-500" : "bg-teal-400"
                                          }`} 
                                          style={{ width: `${Math.min(100, Math.round(((sub.horasConsumidasMes || 0) / sub.slaHorasMensuales) * 100))}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 text-[11px]">Sin SLA fijo</span>
                                  )}
                                </td>

                                {/* Estado Cobro */}
                                <td className="py-3 px-4 align-middle">
                                  {getEstadoCobroBadge(sub.estadoCobro || sub.estado, sub.diasRestantes)}
                                </td>

                                {/* Acciones */}
                                <td className="py-3 px-5 align-middle text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {/* Registrar Cobro / Factura */}
                                    <Button
                                      size="sm"
                                      onClick={() => handleOpenRenovar(sub)}
                                      className="h-8 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold gap-1 transition-all"
                                      title="Registrar cobro de este ciclo y avanzar fecha"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Registrar Cobro</span>
                                    </Button>

                                    {/* Historial */}
                                    {Array.isArray(sub.historialPagos) && sub.historialPagos.length > 0 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setHistorySub(sub)}
                                        className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                                        title={`Ver ${sub.historialPagos.length} cobros anteriores`}
                                      >
                                        <History className="w-3.5 h-3.5" />
                                      </Button>
                                    )}

                                    {/* Editar */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onEdit(sub)}
                                      className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                                      title="Editar mantención"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </Button>

                                    {/* Eliminar / Pausar */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenDelete(sub)}
                                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                      title="Pausar o eliminar servicio"
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2 O 3: COSTOS DE INFRAESTRUCTURA PROPIA O TABLA GENERAL           */}
      {/* ========================================================================= */}
      {(activeTab === "empresa" || activeTab === "todos") && (
        <div className="space-y-4">
          {/* Pastillas de Filtro de Estado */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterEstado("todos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                filterEstado === "todos"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-white/15 text-slate-300 hover:bg-white/5"
              }`}
            >
              Todos ({filtered.length})
            </button>
            <button
              onClick={() => setFilterEstado("activo")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                filterEstado === "activo"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Al Día / Activos
            </button>
            <button
              onClick={() => setFilterEstado("por_cobrar")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                filterEstado === "por_cobrar"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Por Vencer / Por Cobrar
            </button>
            <button
              onClick={() => setFilterEstado("vencido")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                filterEstado === "vencido"
                  ? "bg-rose-500 text-white shadow-md"
                  : "bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Vencidos
            </button>
            <button
              onClick={() => setFilterEstado("pausados")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                filterEstado === "pausados"
                  ? "bg-slate-700 text-white shadow-md"
                  : "bg-card border border-white/15 text-slate-400 hover:bg-white/5"
              }`}
            >
              <PauseCircle className="w-3.5 h-3.5" />
              Pausados
            </button>
          </div>

          {/* Tabla de Servicios */}
          <Card className="bg-card border-white/15 overflow-hidden shadow-xl rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-300 select-none">
                    <th 
                      onClick={() => handleSort("nombre")}
                      className="py-3 px-4 font-black cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Servicio & Titular</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("monto")}
                      className="py-3 px-4 font-black cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Monto & Ciclo</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black">Medio de Pago / Factura</th>
                    <th 
                      onClick={() => handleSort("fechaCorte")}
                      className="py-3 px-4 font-black cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Próximo Vencimiento</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black">Estado</th>
                    <th className="py-3 px-4 font-black text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <RotateCw className="w-4 h-4 animate-spin text-indigo-400" />
                          Cargando servicios recurrentes...
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        No se encontraron registros con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((sub) => {
                      const catConfig = CATEGORIAS_INFO[sub.categoria] || CATEGORIAS_INFO.otro;
                      const CatIcon = catConfig.icon;
                      const isOverdue = sub.diasRestantes !== undefined && sub.diasRestantes < 0;
                      const isCliente = sub.tipoRecurrencia === "cliente_ingreso" || Boolean(sub.clienteId);

                      return (
                        <tr 
                          key={sub.id} 
                          className={`hover:bg-white/[0.03] transition-colors ${
                            sub.estado === "pausado" || sub.estado === "suspendido" ? "opacity-60 bg-slate-900/40" : ""
                          }`}
                        >
                          {/* Servicio y Proveedor / Cliente */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl ${catConfig.bg} border ${catConfig.border} flex items-center justify-center shrink-0`}>
                                <CatIcon className={`w-4 h-4 ${catConfig.color}`} />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-white text-xs truncate max-w-[260px] flex items-center gap-1.5">
                                  {sub.nombre || sub.dominio || "Servicio"}
                                  {sub.enlaceGestion && (
                                    <a 
                                      href={sub.enlaceGestion} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      title="Abrir panel"
                                      className="text-slate-400 hover:text-indigo-400 transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                                  <span className="text-indigo-300 font-bold">
                                    {isCliente ? (sub.clienteNombre || "Cliente") : (sub.proveedor || "Hoja SpA")}
                                  </span>
                                  <span>•</span>
                                  <span className={catConfig.color}>{catConfig.label}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Monto y Ciclo */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="font-mono font-bold text-white text-xs">
                              {sub.moneda === "UF" 
                                ? `${sub.monto} UF`
                                : sub.moneda === "USD"
                                ? `US$${sub.monto.toLocaleString("es-CL")}`
                                : `$${sub.monto.toLocaleString("es-CL")} CLP`}
                            </div>
                            <div className="text-[10px] text-slate-400 capitalize font-medium flex items-center gap-1 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[9px] uppercase font-bold text-slate-300">
                                {sub.cicloFacturacion || "mensual"}
                              </span>
                              {sub.cicloFacturacion !== "mensual" && sub.montoEstimadoMensualCLP && (
                                <span className="text-slate-400 font-mono">
                                  (~${sub.montoEstimadoMensualCLP.toLocaleString("es-CL")}/m)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Medio de Pago y Facturación */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[170px]" title={sub.tarjetaOCuenta || "Sin cuenta definida"}>
                                {sub.tarjetaOCuenta || (isCliente ? "Transferencia Bancaria" : "Pago Directo")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {sub.aplicaFactura ? (
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                  <Receipt className="w-2.5 h-2.5" />
                                  {sub.deducibleIva ? "Factura IVA" : "Factura"}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-medium">Sin Factura</span>
                              )}
                              {sub.diaPago && (
                                <span className="text-[10px] text-slate-400">
                                  (Día {sub.diaPago})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Próximo Vencimiento */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-200 font-bold">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {sub.fechaCorte ? new Date(sub.fechaCorte).toLocaleDateString("es-CL") : "Sin fecha"}
                            </div>
                            <div className="mt-1">
                              {sub.diasRestantes !== undefined ? (
                                <span className={`text-[10px] font-bold ${
                                  isOverdue ? "text-rose-400 font-black" : sub.diasRestantes <= 7 ? "text-amber-400 font-bold" : "text-emerald-400"
                                }`}>
                                  {isOverdue 
                                    ? `Vencido hace ${Math.abs(sub.diasRestantes)} días` 
                                    : sub.diasRestantes === 0
                                    ? "Vence hoy"
                                    : `En ${sub.diasRestantes} días`}
                                </span>
                              ) : null}
                            </div>
                          </td>

                          {/* Estado */}
                          <td className="py-3.5 px-4 align-middle">
                            {getEstadoCobroBadge(sub.estadoCobro || sub.estado, sub.diasRestantes)}
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-4 align-middle text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Registrar Pago / Renovar Ciclo */}
                              <Button
                                size="sm"
                                onClick={() => handleOpenRenovar(sub)}
                                className="h-8 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold gap-1 transition-all"
                                title={isCliente ? "Registrar cobro de cliente" : "Registrar pago de gasto propio"}
                              >
                                <RotateCw className="w-3 h-3" />
                                <span className="hidden xl:inline">{isCliente ? "Cobrado" : "Pagar"}</span>
                              </Button>

                              {/* Ver Historial de Pagos */}
                              {Array.isArray(sub.historialPagos) && sub.historialPagos.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setHistorySub(sub)}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                                  title={`Ver ${sub.historialPagos.length} transacciones`}
                                >
                                  <History className="w-3.5 h-3.5" />
                                </Button>
                              )}

                              {/* Editar */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(sub)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                                title="Editar datos"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>

                              {/* Pausar / Eliminar */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDelete(sub)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                title="Pausar o eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: REGISTRAR PAGO & RENOVAR CICLO */}
      {renewSub && (
        <Dialog open={!!renewSub} onOpenChange={(open) => !open && setRenewSub(null)}>
          <DialogContent className="sm:max-w-[480px] bg-slate-950 border border-white/15 text-slate-100 rounded-2xl shadow-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <RotateCw className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-white">
                    {renewSub.clienteNombre ? "Registrar Cobro de Mantención" : "Registrar Pago & Renovar Ciclo"}
                  </DialogTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {renewSub.nombre} • <span className="text-indigo-400 font-bold">{renewSub.clienteNombre || renewSub.proveedor}</span>
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Corte / Vencimiento Actual:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {renewSub.fechaCorte ? new Date(renewSub.fechaCorte).toLocaleDateString("es-CL") : "Sin fecha"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Medio / Cuenta:</span>
                  <span className="text-slate-200 font-medium">
                    {renewSub.tarjetaOCuenta || "Transferencia Directa"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Ciclo a Extender</Label>
                  <Select value={renewCycle} onValueChange={(val) => setRenewCycle(val as CicloFacturacion)}>
                    <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/15 text-white">
                      <SelectItem value="mensual" className="text-xs focus:bg-white/10">+1 Mes (Mensual)</SelectItem>
                      <SelectItem value="trimestral" className="text-xs focus:bg-white/10">+3 Meses (Trimestral)</SelectItem>
                      <SelectItem value="semestral" className="text-xs focus:bg-white/10">+6 Meses (Semestral)</SelectItem>
                      <SelectItem value="anual" className="text-xs focus:bg-white/10">+1 Año (Anual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Monto ({renewSub.moneda})</Label>
                  <Input
                    type="number"
                    value={renewMonto}
                    onChange={(e) => setRenewMonto(parseFloat(e.target.value) || 0)}
                    className="bg-slate-900 border-white/15 text-white font-mono text-xs h-10 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">N° de Comprobante / Factura (Opcional)</Label>
                <Input
                  value={renewComprobante}
                  onChange={(e) => setRenewComprobante(e.target.value)}
                  placeholder="Ej: Factura SII #441, TEF Santander #9981"
                  className="bg-slate-900 border-white/15 text-white placeholder:text-slate-500 text-xs h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Notas de este Cobro/Pago</Label>
                <Input
                  value={renewNotas}
                  onChange={(e) => setRenewNotas(e.target.value)}
                  placeholder="Ej: Transferencia recibida y confirmada"
                  className="bg-slate-900 border-white/15 text-white placeholder:text-slate-500 text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-white/10 pt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setRenewSub(null)}
                className="bg-white/5 border-white/15 text-slate-300 hover:bg-white/10 text-xs h-10 rounded-xl px-4"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmRenovar}
                disabled={renewing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 rounded-xl px-5 shadow-lg shadow-emerald-600/30"
              >
                {renewing ? "Registrando..." : "Confirmar Cobro / Pago & Extender"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: HISTORIAL DE PAGOS */}
      {historySub && (
        <Dialog open={!!historySub} onOpenChange={(open) => !open && setHistorySub(null)}>
          <DialogContent className="sm:max-w-[550px] bg-slate-950 border border-white/15 text-slate-100 rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-white">
                    Historial de Cobros & Renovaciones
                  </DialogTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {historySub.nombre} • {historySub.clienteNombre || historySub.proveedor}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 pt-3">
              {historySub.historialPagos && historySub.historialPagos.length > 0 ? (
                historySub.historialPagos.map((p, idx) => (
                  <div key={p.id || idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        {p.periodoCubierto || "Ciclo de Mantención"}
                      </span>
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        {p.moneda === "UF" ? `${p.monto} UF` : `$${p.monto.toLocaleString("es-CL")} ${p.moneda}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{p.fechaPago ? new Date(p.fechaPago).toLocaleString("es-CL") : "Fecha no registrada"}</span>
                      {p.comprobanteRef && (
                        <span className="text-indigo-300 font-mono">Ref: {p.comprobanteRef}</span>
                      )}
                    </div>
                    {p.notas && (
                      <p className="text-[11px] text-slate-300 italic pt-1 border-t border-white/5 mt-1">
                        &quot;{p.notas}&quot;
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  No hay pagos ni cobros registrados aún en el historial.
                </p>
              )}
            </div>

            <DialogFooter className="border-t border-white/10 pt-3">
              <Button
                variant="outline"
                onClick={() => setHistorySub(null)}
                className="bg-white/5 border-white/15 text-slate-300 hover:bg-white/10 text-xs h-9 rounded-xl px-4"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: DOBLE CONFIRMACIÓN DE DESACTIVACIÓN / ELIMINACIÓN */}
      {deleteSub && (
        <Dialog open={!!deleteSub} onOpenChange={(open) => !open && setDeleteSub(null)}>
          <DialogContent className="sm:max-w-[460px] bg-slate-950 border border-white/15 text-slate-100 rounded-2xl shadow-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-white">
                    {deleteConfirmStep === 1 ? "Gestionar Servicio Recurrente" : "¿Confirmar Eliminación Definitiva?"}
                  </DialogTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {deleteSub.nombre} ({deleteSub.clienteNombre || deleteSub.proveedor})
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-3">
              {deleteConfirmStep === 1 ? (
                <>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Puedes <strong className="text-amber-300">Pausar</strong> este servicio para mantener todo su historial contable y reactivarlo cuando desees, o <strong className="text-rose-400">Eliminarlo definitivamente</strong> de la base de datos.
                  </p>

                  <div className="space-y-2 pt-1">
                    <Button
                      onClick={async () => {
                        await onPauseToggle(deleteSub);
                        setDeleteSub(null);
                      }}
                      className="w-full h-11 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs gap-2"
                    >
                      <PauseCircle className="w-4 h-4" />
                      {deleteSub.estado === "pausado" ? "Reactivar Servicio" : "Pausar Servicio (Recomendado)"}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => setDeleteConfirmStep(2)}
                      className="w-full h-10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold"
                    >
                      Deseo eliminarlo completamente...
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed space-y-1">
                    <p className="font-bold">⚠️ Esta acción no se puede deshacer.</p>
                    <p>Se borrarán los datos del servicio y todo su historial de cobros/pagos registrados.</p>
                  </div>

                  <p className="text-xs text-slate-300">
                    ¿Estás absolutamente seguro de que deseas eliminar permanentemente <strong className="text-white">{deleteSub.nombre}</strong>?
                  </p>
                </>
              )}
            </div>

            <DialogFooter className="border-t border-white/10 pt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteSub(null)}
                className="bg-white/5 border-white/15 text-slate-300 hover:bg-white/10 text-xs h-10 rounded-xl px-4"
              >
                Cancelar
              </Button>
              {deleteConfirmStep === 2 && (
                <Button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-10 rounded-xl px-5 shadow-lg shadow-rose-600/30"
                >
                  {deleting ? "Eliminando..." : "Sí, Eliminar Definitivamente"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
