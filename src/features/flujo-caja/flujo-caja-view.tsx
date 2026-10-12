"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  ArrowLeft, 
  Plus, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  Search,
  Server,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Receipt,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Scale,
  Landmark,
  FileText,
  Info,
  ShieldAlert,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  EventoFinanciero, 
  EventoFinancieroTipo, 
  EventoFinancieroCategoria,
  GastoOperativo,
  CategoriaGastoOperativo,
  Subscription
} from "@/lib/types";
import { 
  getEventosFinancieros, 
  saveEventoFinanciero, 
  updateEventoFinanciero,
  getGastosOperativos,
  saveGastoOperativo,
  deleteGastoOperativo,
  getSubscriptions
} from "@/lib/services";
import { 
  calcularF29Mes, 
  obtenerAlertaCalendarioSII, 
  calcularDesgloseIva, 
  formatCLP, 
  NOMBRES_MESES, 
  PPM_TASA_REFERENCIAL,
  IVA_TASA_CHILE 
} from "@/lib/tributario-utils";
import { FlujoCajaListSkeleton } from "@/components/common/skeletons";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const FlujoCajaView: React.FC = () => {
  const router = useRouter();
  const [eventos, setEventos] = useState<EventoFinanciero[]>([]);
  const [gastos, setGastos] = useState<GastoOperativo[]>([]);
  const [suscripciones, setSuscripciones] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"movimientos" | "tributario" | "costos">("movimientos");

  // Filtros
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");

  // Período tributario F29 seleccionado (Mes y Año)
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);

  // Modal para nuevo movimiento financiero
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nuevoConcepto, setNuevoConcepto] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState<number>(0);
  const [montoNeto, setMontoNeto] = useState<number>(0);
  const [ivaMonto, setIvaMonto] = useState<number>(0);
  const [montoTotal, setMontoTotal] = useState<number>(0);
  const [aplicaFactura, setAplicaFactura] = useState<boolean>(true);
  const [deducibleIva, setDeducibleIva] = useState<boolean>(true);
  const [nuevoTipo, setNuevoTipo] = useState<EventoFinancieroTipo>("ingreso");
  const [nuevaCategoria, setNuevaCategoria] = useState<EventoFinancieroCategoria>("cobro_proyecto");
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().split("T")[0]);
  const [esRecurrente, setEsRecurrente] = useState(false);

  // Modal para registrar costo de infraestructura
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expConcepto, setExpConcepto] = useState("");
  const [expProveedor, setExpProveedor] = useState("Bluehosting");
  const [expCategoria, setExpCategoria] = useState<CategoriaGastoOperativo>("hosting_reseller");
  const [expMonto, setExpMonto] = useState<number>(0);
  const [expMoneda, setExpMoneda] = useState<"CLP" | "UF">("CLP");
  const [expPeriodicidad, setExpPeriodicidad] = useState<"mensual" | "anual">("mensual");
  const [expFechaRenovacion, setExpFechaRenovacion] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);

  const formatCLP = (val: number = 0) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [evData, gasData, subData] = await Promise.all([
        getEventosFinancieros(),
        getGastosOperativos(),
        getSubscriptions(),
      ]);
      setEventos(evData);
      setGastos(gasData);
      setSuscripciones(subData);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar la información financiera");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cálculos de Flujo Real
  const totalIngresos = eventos
    .filter((e) => e.tipo === "ingreso")
    .reduce((acc, curr) => acc + (curr.monto || 0), 0);

  const totalCobrado = eventos
    .filter((e) => e.tipo === "ingreso" && e.estado === "cobrado")
    .reduce((acc, curr) => acc + (curr.monto || 0), 0);

  const totalEgresos = eventos
    .filter((e) => e.tipo === "egreso")
    .reduce((acc, curr) => acc + (curr.monto || 0), 0);

  // Costos fijos operativos del mes (Infrastructure expenses)
  const costosOperativosMes = gastos
    .filter((g) => g.estado === "activo")
    .reduce((acc, g) => {
      const valor = g.periodicidad === "anual" ? Math.round(g.monto / 12) : g.monto;
      return acc + valor;
    }, 0);

  // Margen Bruto Real (Cobrado real menos costos operativos)
  const margenBruto = totalCobrado - costosOperativosMes;

  // Piso Recurrente (MRR proyectado desde suscripciones activas)
  const pisoRecurrenteCLP = suscripciones
    .filter((s) => s.estado === "activo" || s.estado === "por_vencer")
    .reduce((acc, s) => {
      if (s.moneda === "CLP") {
        return acc + (s.cicloFacturacion === "anual" ? Math.round(s.monto / 12) : s.monto);
      }
      return acc;
    }, 0);

  const pisoRecurrenteUF = suscripciones
    .filter((s) => s.estado === "activo" || s.estado === "por_vencer")
    .reduce((acc, s) => {
      if (s.moneda === "UF") {
        return acc + (s.cicloFacturacion === "anual" ? s.monto / 12 : s.monto);
      }
      return acc;
    }, 0);

  const saldoNeto = totalIngresos - totalEgresos;

  // Proyección tributaria mensual F29 y Alerta de Calendario SII
  const proyeccionF29 = calcularF29Mes(eventos, selectedYear, selectedMonth, today);
  const alertaCalendarioSII = obtenerAlertaCalendarioSII(eventos, today);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
  };

  // Manejadores reactivos de Monto Neto, IVA y Total para el modal
  const handleNetoChange = (val: number) => {
    const neto = Math.max(0, val);
    setMontoNeto(neto);
    if (aplicaFactura) {
      const iva = Math.round(neto * IVA_TASA_CHILE);
      setIvaMonto(iva);
      setMontoTotal(neto + iva);
      setNuevoMonto(neto + iva);
    } else {
      setIvaMonto(0);
      setMontoTotal(neto);
      setNuevoMonto(neto);
    }
  };

  const handleTotalChange = (val: number) => {
    const total = Math.max(0, val);
    setMontoTotal(total);
    setNuevoMonto(total);
    if (aplicaFactura) {
      const neto = Math.round(total / (1 + IVA_TASA_CHILE));
      setMontoNeto(neto);
      setIvaMonto(total - neto);
    } else {
      setMontoNeto(total);
      setIvaMonto(0);
    }
  };

  const handleAplicaFacturaChange = (checked: boolean) => {
    setAplicaFactura(checked);
    const base = montoTotal > 0 ? montoTotal : nuevoMonto;
    if (checked) {
      const neto = Math.round(base / (1 + IVA_TASA_CHILE));
      setMontoNeto(neto);
      setIvaMonto(base - neto);
      setMontoTotal(base);
    } else {
      setMontoNeto(base);
      setIvaMonto(0);
      setMontoTotal(base);
    }
  };

  const filteredEventos = eventos.filter((e) => {
    const matchesSearch = e.concepto.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterTipo === "todos") return true;
    if (filterTipo === "pendientes") return e.estado === "pendiente";
    return e.tipo === filterTipo;
  });

  const handleToggleEstado = async (evento: EventoFinanciero) => {
    if (!evento.id) return;
    const nextEstado = evento.estado === "pendiente" 
      ? (evento.tipo === "ingreso" ? "cobrado" : "pagado") 
      : "pendiente";

    try {
      await updateEventoFinanciero(evento.id, { estado: nextEstado });
      setEventos((prev) =>
        prev.map((e) => (e.id === evento.id ? { ...e, estado: nextEstado } : e))
      );
      toast.success(`Evento marcado como ${nextEstado}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar estado");
    }
  };

  const handleCreateEvento = async () => {
    const valorFinal = montoTotal > 0 ? montoTotal : nuevoMonto;
    if (!nuevoConcepto.trim() || valorFinal <= 0) {
      toast.warning("Ingresa un concepto y un monto válido");
      return;
    }

    try {
      const finalNeto = montoNeto > 0 ? montoNeto : (aplicaFactura ? Math.round(valorFinal / 1.19) : valorFinal);
      const finalIva = aplicaFactura ? (ivaMonto > 0 ? ivaMonto : valorFinal - finalNeto) : 0;

      const nuevo: Partial<EventoFinanciero> = {
        tipo: nuevoTipo,
        categoria: nuevaCategoria,
        concepto: nuevoConcepto.trim(),
        monto: valorFinal,
        montoNeto: finalNeto,
        ivaMonto: finalIva,
        montoTotal: valorFinal,
        aplicaFactura,
        deducibleIva: nuevoTipo === "egreso" ? deducibleIva : false,
        fechaVencimiento: nuevaFecha,
        estado: "pendiente",
        esRecurrente,
        recordatorioDiasAntes: 5,
      };

      await saveEventoFinanciero(nuevo);
      toast.success("Evento financiero registrado");
      setIsCreateOpen(false);
      setNuevoConcepto("");
      setNuevoMonto(0);
      setMontoNeto(0);
      setIvaMonto(0);
      setMontoTotal(0);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar evento");
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expConcepto.trim() || expMonto <= 0) {
      toast.warning("Ingresa un concepto y monto válido");
      return;
    }

    try {
      setSavingExpense(true);
      await saveGastoOperativo({
        concepto: expConcepto.trim(),
        proveedor: expProveedor.trim(),
        categoria: expCategoria,
        monto: expMonto,
        moneda: expMoneda,
        periodicidad: expPeriodicidad,
        fechaRenovacion: expFechaRenovacion || undefined,
        estado: "activo",
      });
      toast.success("Costo de infraestructura registrado");
      setIsExpenseOpen(false);
      setExpConcepto("");
      setExpMonto(0);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar el costo");
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("¿Eliminar este registro de costo operativo?")) return;
    try {
      await deleteGastoOperativo(id);
      toast.success("Costo operativo eliminado");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-3 py-6 sm:px-6 sm:py-12 md:px-[10%] lg:px-[15%]">
      
      {/* Encabezado */}
      <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/")} 
            className="rounded-full bg-muted/50 text-primary shrink-0 h-10 w-10 sm:h-12 sm:w-12"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-4xl font-black tracking-tight text-foreground leading-none">
              Flujo de Caja Real
            </h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground font-medium mt-1">
              Control de Margen Bruto, Piso Recurrente y Costos de Infraestructura (Reseller/NIC Chile/Vercel)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setIsExpenseOpen(true)}
            className="rounded-2xl px-4 h-11 sm:h-12 text-xs font-bold border-white/15 bg-card hover:bg-muted text-foreground gap-2 shrink-0 justify-center"
          >
            <Server className="h-4 w-4 text-indigo-400" /> + Costo Infraestructura
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-2xl px-5 h-11 sm:h-12 text-xs font-black shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:scale-105 transition-all gap-2 shrink-0 justify-center"
          >
            <Plus className="h-4 w-4" /> Registrar Movimiento
          </Button>
        </div>
      </div>

      {/* 1. ALERTA DE CALENDARIO TRIBUTARIO SII (Días 10 al 20 de cada mes) */}
      {alertaCalendarioSII && (
        <div className={`mb-8 p-4 sm:p-5 rounded-3xl border transition-all ${
          alertaCalendarioSII.esCritica
            ? "bg-rose-950/40 border-rose-500/50 shadow-xl shadow-rose-950/30"
            : "bg-amber-950/30 border-amber-500/40 shadow-lg shadow-amber-950/20"
        } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
              alertaCalendarioSII.esCritica 
                ? "bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-bounce" 
                : "bg-amber-500/20 border border-amber-500/40 text-amber-300"
            }`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-black uppercase tracking-wider ${
                  alertaCalendarioSII.esCritica ? "text-rose-400" : "text-amber-300"
                }`}>
                  {alertaCalendarioSII.esCritica ? "🚨 Vencimiento Crítico SII (Menos de 3 días)" : "⚖️ Calendario Tributario SII (F29)"}
                </span>
                <Badge className={alertaCalendarioSII.esCritica ? "bg-rose-600 text-white font-black" : "bg-amber-500 text-slate-950 font-black"}>
                  {alertaCalendarioSII.diasRestantes === 0 ? "¡Vence Hoy!" : `Quedan ${alertaCalendarioSII.diasRestantes} días`}
                </Badge>
              </div>
              <p className="text-sm sm:text-base font-bold text-white mt-1">
                {alertaCalendarioSII.mensaje}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setActiveTab("tributario")}
            className={`shrink-0 rounded-2xl font-black text-xs h-11 px-5 shadow-lg ${
              alertaCalendarioSII.esCritica 
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30" 
                : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25"
            }`}
          >
            Ver Provisión F29
          </Button>
        </div>
      )}

      {/* 2. COMPONENTE DE PROYECCIÓN TRIBUTARIA MENSUAL F29 / SII */}
      <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/80 to-slate-900/90 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Proyección Tributaria F29 / SII
                <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-[10px] font-bold">
                  Chile • PPM 0.25%
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Cálculo reactivo mensual: IVA Débito, IVA Crédito Deducible, PPM y Reserva de Impuestos.
              </p>
            </div>
          </div>

          {/* Selector de Mes */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8 rounded-xl text-slate-300 hover:text-white shrink-0"
              title="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-xs font-black text-white px-2 sm:px-3 flex-1 sm:min-w-[120px] text-center truncate">
              {proyeccionF29.nombreMes}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 rounded-xl text-slate-300 hover:text-white shrink-0"
              title="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {(selectedYear !== today.getFullYear() || selectedMonth !== today.getMonth() + 1) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCurrentMonth}
                className="h-8 px-2 sm:px-2.5 text-[10px] font-bold border-white/15 bg-slate-800 text-slate-300 rounded-xl ml-1 shrink-0"
              >
                Mes Actual
              </Button>
            )}
          </div>
        </div>

        {/* Las 3 Tarjetas de Desglose Claro Requeridas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          {/* Tarjeta 1: Total Facturado */}
          <Card className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                Total Facturado (Ventas)
              </span>
              <FileText className="h-4 w-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white">
              {formatCLP(proyeccionF29.totalFacturadoVentas)}
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t border-white/5">
              <div className="flex justify-between">
                <span>Ventas Netas:</span>
                <span className="font-mono font-bold text-slate-200">{formatCLP(proyeccionF29.ventasNetasTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA Débito (19%):</span>
                <span className="font-mono font-bold text-sky-300">+{formatCLP(proyeccionF29.ivaDebitoTotal)}</span>
              </div>
            </div>
          </Card>

          {/* Tarjeta 2: Provisión F29 (Dinero reservado para impuestos) */}
          <Card className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-2 shadow-lg shadow-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                Provisión F29 (Reserva Impuestos)
              </span>
              <Landmark className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
              {formatCLP(proyeccionF29.f29Estimado)}
            </div>
            <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-amber-500/20">
              <div className="flex justify-between text-[11px]">
                <span>IVA Débito:</span>
                <span className="font-mono text-slate-300">+{formatCLP(proyeccionF29.ivaDebitoTotal)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>(-) Crédito Fiscal Deducible:</span>
                <span className="font-mono text-emerald-400">-{formatCLP(proyeccionF29.ivaCreditoTotal)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-200">
                <span>(=) IVA Determinado:</span>
                <span className="font-mono">
                  {proyeccionF29.ivaAPagar > 0 
                    ? formatCLP(proyeccionF29.ivaAPagar) 
                    : <span className="text-emerald-400 font-bold">Remanente a favor ({formatCLP(proyeccionF29.remanenteAFavor)})</span>
                  }
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>(+) PPM (0.25% de ventas netas):</span>
                <span className="font-mono text-amber-400">+{formatCLP(proyeccionF29.ppmTotal)}</span>
              </div>
            </div>
          </Card>

          {/* Tarjeta 3: Caja Líquida Real Disponible */}
          <Card className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-2 shadow-lg shadow-emerald-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                Caja Líquida Real Disponible
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-300">
              {formatCLP(proyeccionF29.cajaLiquidaRealDisponible)}
            </div>
            <p className="text-xs text-muted-foreground pt-1 border-t border-emerald-500/20 leading-relaxed">
              Dinero disponible libre tras descontar la provisión tributaria estimada del F29. Fondo operativo protegido para retiro o reinversión.
            </p>
          </Card>
        </div>
      </div>

      {/* 3. KPI Cards Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Margen Bruto Real */}
        <Card className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Margen Bruto Real</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <p className={`text-2xl font-black font-mono ${margenBruto >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatCLP(margenBruto)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Cobrado ({formatCLP(totalCobrado)}) menos costos fijos
            </p>
          </CardContent>
        </Card>

        {/* Piso Recurrente Proyectado (MRR) */}
        <Card className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Piso Recurrente (MRR)</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <Server className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-black font-mono text-indigo-300">
              {formatCLP(pisoRecurrenteCLP)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {pisoRecurrenteUF > 0 ? `+ ${pisoRecurrenteUF.toFixed(1)} UF/mes de contratos` : "Total mensual proyectado en hosting activo"}
            </p>
          </CardContent>
        </Card>

        {/* Costos Fijos Infraestructura */}
        <Card className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Costos Infraestructura</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                <ArrowDownRight className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-black font-mono text-rose-400">
              {formatCLP(costosOperativosMes)} <span className="text-xs text-muted-foreground font-sans font-normal">/mes</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              {gastos.length} servicios de soporte y hosting registrados
            </p>
          </CardContent>
        </Card>

        {/* Saldo Neto Global */}
        <Card className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">Balance Proyectado</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                <DollarSign className="h-4 w-4" />
              </span>
            </div>
            <p className={`text-2xl font-black font-mono ${saldoNeto >= 0 ? "text-sky-300" : "text-rose-400"}`}>
              {formatCLP(saldoNeto)}
            </p>
            <p className="text-[11px] text-muted-foreground">Ingresos totales vs egresos programados</p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Selector de Pestañas con scroll horizontal táctil */}
      <div className="flex overflow-x-auto items-center gap-2 sm:gap-3 border-b border-white/10 pb-3 mb-6 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab("movimientos")}
          className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "movimientos"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card border border-white/10 text-slate-300 hover:bg-white/5"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Movimientos ({eventos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("tributario")}
          className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "tributario"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25"
              : "bg-card border border-white/10 text-amber-300 hover:bg-white/5"
          }`}
        >
          <Scale className="w-4 h-4 text-amber-400" />
          <span>Proyección F29 SII</span>
        </button>

        <button
          onClick={() => setActiveTab("costos")}
          className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "costos"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
              : "bg-card border border-white/10 text-slate-300 hover:bg-white/5"
          }`}
        >
          <Server className="w-4 h-4 text-indigo-400" />
          <span>Costos Infraestructura ({gastos.length})</span>
        </button>
      </div>

      {/* PESTAÑA 1: MOVIMIENTOS DE CAJA */}
      {activeTab === "movimientos" && (
        <div className="space-y-6">
          {/* Buscador y Filtros */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar concepto o cliente..." 
                className="pl-11 h-12 text-xs rounded-xl bg-card border-white/15 focus-visible:ring-primary shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <button
                onClick={() => setFilterTipo("todos")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterTipo === "todos" ? "bg-primary text-primary-foreground shadow-sm" : "bg-card border border-white/10 text-slate-300 hover:bg-white/5"
                }`}
              >
                Todos ({eventos.length})
              </button>
              <button
                onClick={() => setFilterTipo("pendientes")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterTipo === "pendientes" ? "bg-amber-500 text-slate-950 shadow-sm" : "bg-card border border-white/10 text-amber-300 hover:bg-white/5"
                }`}
              >
                ⏳ Pendientes
              </button>
              <button
                onClick={() => setFilterTipo("ingreso")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterTipo === "ingreso" ? "bg-emerald-500 text-white shadow-sm" : "bg-card border border-white/10 text-emerald-300 hover:bg-white/5"
                }`}
              >
                📥 Cobros / Ingresos
              </button>
              <button
                onClick={() => setFilterTipo("egreso")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterTipo === "egreso" ? "bg-rose-500 text-white shadow-sm" : "bg-card border border-white/10 text-rose-300 hover:bg-white/5"
                }`}
              >
                📤 Egresos
              </button>
            </div>
          </div>

          {/* Listado de Eventos */}
          {loading ? (
            <FlujoCajaListSkeleton count={4} />
          ) : filteredEventos.length === 0 ? (
            <Card className="rounded-2xl border border-white/10 bg-card/60 p-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <h3 className="text-base font-black text-foreground">No hay movimientos registrados</h3>
              <p className="text-xs text-muted-foreground mt-1">Registra nuevos cobros o pagos para proyectar tu flujo.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredEventos.map((e) => {
                const isIngreso = e.tipo === "ingreso";
                const isRealizado = e.estado === "cobrado" || e.estado === "pagado";

                return (
                  <Card 
                    key={e.id}
                    className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm transition-all hover:border-white/20"
                  >
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isIngreso ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {isIngreso ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-foreground leading-tight">{e.concepto}</h4>
                            <Badge variant="outline" className="text-[10px] font-mono border-white/10">
                              {e.categoria}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1 font-semibold">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              {e.fechaVencimiento || "Sin fecha"}
                            </span>
                            {e.esRecurrente && (
                              <span className="text-indigo-400 font-bold">&bull; Recurrente</span>
                            )}
                          </div>

                          {/* Badges de Estado Tributario (Neto / IVA / Deducible) */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {e.aplicaFactura !== false && (e.montoNeto || e.ivaMonto) ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/25 text-sky-400 font-bold">
                                Neto: {formatCLP(e.montoNeto ?? Math.round(e.monto / 1.19))} • IVA 19%: {formatCLP(e.ivaMonto ?? (e.monto - Math.round(e.monto / 1.19)))}
                              </span>
                            ) : null}

                            {e.deducibleIva && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Crédito Fiscal Deducible F29
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                        <div className="text-left sm:text-right">
                          <p className={`text-base font-black font-mono ${isIngreso ? "text-emerald-400" : "text-rose-400"}`}>
                            {isIngreso ? "+" : "-"}{formatCLP(e.monto)}
                          </p>
                          <span className={`text-[10px] font-black uppercase ${isRealizado ? "text-emerald-400" : "text-amber-400"}`}>
                            {e.estado}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant={isRealizado ? "outline" : "default"}
                          onClick={() => handleToggleEstado(e)}
                          className={`h-9 px-3 rounded-xl text-xs font-bold gap-1.5 ${
                            isRealizado 
                              ? "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10" 
                              : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                          }`}
                        >
                          {isRealizado ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Completado</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5" />
                              <span>Marcar {isIngreso ? "Cobrado" : "Pagado"}</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: PROYECCIÓN TRIBUTARIA DETALLADA F29 (SII CHILE) */}
      {activeTab === "tributario" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Scale className="h-5 w-5 text-amber-400" />
                Conciliación y Liquidación Estimada F29 (SII)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Período seleccionado: <span className="text-white font-bold">{proyeccionF29.nombreMes}</span>. Vencimiento electrónico mensual: días 20.
              </p>
            </div>

            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-primary text-primary-foreground font-black text-xs h-10 px-4 rounded-xl gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Registrar Factura / Compra
            </Button>
          </div>

          {/* Tabla Desglose F29 */}
          <Card className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl overflow-hidden shadow-xl">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Bloque A: Ventas (IVA Débito) */}
                <div className="space-y-4 p-5 rounded-2xl bg-slate-950/60 border border-white/10">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-black uppercase text-sky-400 flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4" /> 1. Ventas y Facturación Emitida
                    </span>
                    <Badge variant="outline" className="border-sky-500/40 text-sky-300 text-[10px]">
                      IVA Débito Fiscal
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-muted-foreground">Ventas Netas Afectas:</span>
                      <span className="font-mono font-bold text-white">{formatCLP(proyeccionF29.ventasNetasTotal)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-muted-foreground">Tasa IVA Débito (19%):</span>
                      <span className="font-mono font-bold text-sky-400">+{formatCLP(proyeccionF29.ivaDebitoTotal)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 font-bold pt-2">
                      <span className="text-slate-300">Total Facturado Bruto:</span>
                      <span className="font-mono text-white text-sm">{formatCLP(proyeccionF29.totalFacturadoVentas)}</span>
                    </div>
                  </div>
                </div>

                {/* Bloque B: Compras (IVA Crédito Deducible) */}
                <div className="space-y-4 p-5 rounded-2xl bg-slate-950/60 border border-white/10">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4" /> 2. Compras Locales Deducibles
                    </span>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[10px]">
                      IVA Crédito Fiscal
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-muted-foreground">Compras Netas Deducibles:</span>
                      <span className="font-mono font-bold text-white">{formatCLP(proyeccionF29.comprasNetasDeducibles)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-muted-foreground">Crédito Fiscal IVA (19%):</span>
                      <span className="font-mono font-bold text-emerald-400">-{formatCLP(proyeccionF29.ivaCreditoTotal)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 font-bold pt-2">
                      <span className="text-slate-300">Crédito a favor para rebajar:</span>
                      <span className="font-mono text-emerald-300 text-sm">{formatCLP(proyeccionF29.ivaCreditoTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque C: Liquidación Tributaria Final */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-amber-400" />
                    3. Resumen y Total a Declarar en Formulario 29
                  </h4>
                  <span className="text-xs text-amber-300 font-mono font-bold">Vence el día 20</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">IVA Determinado a Pagar</span>
                    <p className="text-xl font-mono font-black text-white">
                      {formatCLP(proyeccionF29.ivaAPagar)}
                    </p>
                    {proyeccionF29.remanenteAFavor > 0 && (
                      <span className="text-[10px] text-emerald-400 font-bold block">
                        Remanente a favor: {formatCLP(proyeccionF29.remanenteAFavor)}
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">PPM Obligatorio (0.25%)</span>
                    <p className="text-xl font-mono font-black text-amber-400">
                      +{formatCLP(proyeccionF29.ppmTotal)}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      Base imponible: {formatCLP(proyeccionF29.ventasNetasTotal)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 space-y-1">
                    <span className="text-[10px] uppercase font-black text-amber-300">Total Provisión F29</span>
                    <p className="text-2xl font-mono font-black text-amber-300">
                      {formatCLP(proyeccionF29.f29Estimado)}
                    </p>
                    <span className="text-[10px] text-slate-300 font-medium block">
                      Reserva obligatoria del mes
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista de movimientos de este período que tributan */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Movimientos que integran la liquidación de {proyeccionF29.nombreMes}
                </h4>

                {eventos.filter(e => {
                  if (!e.fechaVencimiento) return false;
                  const [y, m] = e.fechaVencimiento.split("-").map(Number);
                  return y === selectedYear && m === selectedMonth;
                }).length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-white/10 text-center text-xs text-muted-foreground">
                    No hay movimientos registrados para {proyeccionF29.nombreMes}. Agrega ingresos o egresos con fecha en este mes para proyectar.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eventos.filter(e => {
                      if (!e.fechaVencimiento) return false;
                      const [y, m] = e.fechaVencimiento.split("-").map(Number);
                      return y === selectedYear && m === selectedMonth;
                    }).map((e) => {
                      const isVenta = e.tipo === "ingreso";
                      const netoVal = e.montoNeto ?? Math.round(e.monto / 1.19);
                      const ivaVal = e.ivaMonto ?? (e.monto - netoVal);

                      return (
                        <div
                          key={e.id}
                          className="p-3.5 rounded-xl border border-white/5 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                isVenta ? "bg-sky-500/20 text-sky-400" : "bg-emerald-500/20 text-emerald-400"
                              }`}>
                                {isVenta ? "Venta (Débito)" : e.deducibleIva ? "Compra Deducible" : "Compra No Deducible"}
                              </span>
                              <span className="font-bold text-white">{e.concepto}</span>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              Fecha: {e.fechaVencimiento} • Total: {formatCLP(e.monto)}
                            </span>
                          </div>

                          <div className="text-left sm:text-right font-mono text-[11px]">
                            <div className="text-slate-300">Neto: <span className="font-bold text-white">{formatCLP(netoVal)}</span></div>
                            <div className={isVenta ? "text-sky-400 font-bold" : e.deducibleIva ? "text-emerald-400 font-bold" : "text-muted-foreground"}>
                              {isVenta ? `+IVA Débito: ${formatCLP(ivaVal)}` : e.deducibleIva ? `-IVA Crédito: ${formatCLP(ivaVal)}` : "Sin crédito"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PESTAÑA 3: COSTOS FIJOS & INFRAESTRUCTURA (EXPENSES) */}
      {activeTab === "costos" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Costos Fijos Operativos (Infraestructura)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Planes Reseller cPanel, servidores Cloud, dominios .CL y licencias de software de Hoja SpA.
              </p>
            </div>
            <Button
              onClick={() => setIsExpenseOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold h-10 px-4 rounded-xl gap-2 shadow-lg shadow-indigo-600/25"
            >
              <Plus className="w-4 h-4" /> Agregar Costo
            </Button>
          </div>

          {gastos.length === 0 ? (
            <Card className="rounded-2xl border border-white/10 bg-card/60 p-12 text-center">
              <Server className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-black text-white">No hay costos fijos registrados</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Registra tus costos de hosting (ej. Plan Reseller Bluehosting o dominios NIC Chile) para calcular el Margen Bruto exacto.
              </p>
              <Button onClick={() => setIsExpenseOpen(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold">
                Registrar Primer Costo
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {gastos.map((g) => (
                <Card key={g.id} className="rounded-2xl border border-white/15 bg-card/70 hover:border-white/30 transition-all">
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white">{g.concepto}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {g.proveedor}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-medium">
                          <span>Categoría: <strong className="text-slate-300">{g.categoria}</strong></span>
                          <span>&bull; Periodicidad: <strong className="text-slate-300">{g.periodicidad}</strong></span>
                          {g.fechaRenovacion && (
                            <span>&bull; Renovación: <strong className="text-slate-300">{new Date(g.fechaRenovacion).toLocaleDateString("es-CL")}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                      <div className="text-left sm:text-right">
                        <p className="text-base font-black font-mono text-rose-400">
                          {g.moneda === "UF" ? `${g.monto} UF` : formatCLP(g.monto)}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 block">
                          /{g.periodicidad} {g.periodicidad === "anual" ? `(≈ ${formatCLP(Math.round(g.monto / 12))}/mes)` : ""}
                        </span>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteExpense(g.id!)}
                        className="h-9 w-9 text-rose-400 hover:bg-rose-500/10 rounded-xl"
                        title="Eliminar registro de costo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: REGISTRAR MOVIMIENTO GENERAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[480px] max-h-[88dvh] overflow-y-auto bg-card border-white/15 text-foreground shadow-2xl rounded-3xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">
              Registrar Movimiento Financiero
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Tipo de Movimiento</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={nuevoTipo === "ingreso" ? "default" : "outline"}
                  onClick={() => setNuevoTipo("ingreso")}
                  className={`h-10 text-xs font-black ${nuevoTipo === "ingreso" ? "bg-emerald-600 text-white" : "border-white/15 text-slate-300"}`}
                >
                  📥 Ingreso / Cobro
                </Button>
                <Button
                  type="button"
                  variant={nuevoTipo === "egreso" ? "default" : "outline"}
                  onClick={() => setNuevoTipo("egreso")}
                  className={`h-10 text-xs font-black ${nuevoTipo === "egreso" ? "bg-rose-600 text-white" : "border-white/15 text-slate-300"}`}
                >
                  📤 Egreso / Gasto
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Concepto del Movimiento *</Label>
              <Input
                value={nuevoConcepto}
                onChange={(e) => setNuevoConcepto(e.target.value)}
                placeholder="Ej. Anticipo 50% Proyecto Web Hoja"
                className="bg-muted/40 border-white/15 text-foreground text-sm"
              />
            </div>

            {/* Toggle de Factura Afecta / Exenta */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-white">Factura Afecta a IVA (19%)</span>
                </div>
                <input
                  type="checkbox"
                  id="afecta-iva-cb"
                  checked={aplicaFactura}
                  onChange={(e) => handleAplicaFacturaChange(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-muted/40 text-primary cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {aplicaFactura
                  ? "Afecto a IVA chileno. Se desglosará automáticamente Neto, 19% IVA y Total para el F29."
                  : "Exento o Boleta sin derecho a crédito/débito fiscal."}
              </p>
            </div>

            {/* Inputs de Montos con Desglose - Responsive para Móvil */}
            {aplicaFactura ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-white/10">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-300">Monto Neto *</Label>
                  <Input
                    type="number"
                    value={montoNeto || ""}
                    onChange={(e) => handleNetoChange(parseFloat(e.target.value) || 0)}
                    placeholder="Neto"
                    className="bg-muted/40 border-white/15 text-foreground font-mono text-xs font-bold h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-sky-400">IVA 19%</Label>
                  <div className="h-9 px-2.5 rounded-lg bg-sky-950/40 border border-sky-500/30 flex items-center text-xs font-mono font-bold text-sky-300">
                    {formatCLP(ivaMonto)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-emerald-400">Total Bruto *</Label>
                  <Input
                    type="number"
                    value={montoTotal || ""}
                    onChange={(e) => handleTotalChange(parseFloat(e.target.value) || 0)}
                    placeholder="Total"
                    className="bg-muted/40 border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold h-9"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Monto Total Exento (CLP) *</Label>
                <Input
                  type="number"
                  value={montoTotal || nuevoMonto || ""}
                  onChange={(e) => handleTotalChange(parseFloat(e.target.value) || 0)}
                  placeholder="Ej. 250000"
                  className="bg-muted/40 border-white/15 text-foreground font-mono font-bold"
                />
              </div>
            )}

            {/* Si es Egreso: Checkbox de Compra Deducible de IVA */}
            {nuevoTipo === "egreso" && aplicaFactura && (
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs">
                <input
                  type="checkbox"
                  id="deducible-iva-cb"
                  checked={deducibleIva}
                  onChange={(e) => setDeducibleIva(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-emerald-500/40 bg-emerald-900/40 text-emerald-400 cursor-pointer"
                />
                <label htmlFor="deducible-iva-cb" className="cursor-pointer text-[11px] text-emerald-200">
                  <strong className="block font-bold text-emerald-300">Compra con Factura Chilena Deducible (Crédito Fiscal SII)</strong>
                  Este IVA ({formatCLP(ivaMonto)}) rebajará directamente el F29 del mes en curso.
                </label>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Fecha Estimada</Label>
              <Input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                className="bg-muted/40 border-white/15 text-foreground font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Categoría</Label>
              <Select value={nuevaCategoria} onValueChange={(val) => setNuevaCategoria(val as EventoFinancieroCategoria)}>
                <SelectTrigger className="bg-muted/40 border-white/15 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/15 text-foreground">
                  <SelectItem value="cobro_proyecto">💼 Cobro Proyecto / Hito</SelectItem>
                  <SelectItem value="servicio_recurrente">🔄 Servicio Recurrente</SelectItem>
                  <SelectItem value="hosting_infraestructura">🌐 Infraestructura / Servidores</SelectItem>
                  <SelectItem value="licencia_software">🔑 Licencia Software</SelectItem>
                  <SelectItem value="otro">📦 Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="recurrente-cb"
                checked={esRecurrente}
                onChange={(e) => setEsRecurrente(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-muted/40 text-primary"
              />
              <label htmlFor="recurrente-cb" className="text-xs font-medium text-slate-300">
                Es un ingreso/egreso recurrente periódico
              </label>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-white/10">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-white/15 text-slate-300">
              Cancelar
            </Button>
            <Button onClick={handleCreateEvento} className="bg-primary text-primary-foreground font-bold">
              Guardar Movimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: REGISTRAR COSTO DE INFRAESTRUCTURA (EXPENSES) */}
      <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[88dvh] overflow-y-auto bg-slate-900 border-white/15 text-white shadow-2xl rounded-3xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              Registrar Costo de Infraestructura
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateExpense} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Concepto del Costo *</Label>
              <Input
                value={expConcepto}
                onChange={(e) => setExpConcepto(e.target.value)}
                placeholder="Ej. Plan Reseller Bluehosting cPanel 50 Cuentas"
                required
                className="bg-slate-950 border-white/15 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Proveedor</Label>
                <Input
                  value={expProveedor}
                  onChange={(e) => setExpProveedor(e.target.value)}
                  placeholder="Bluehosting, NIC Chile, Hetzner, etc."
                  required
                  className="bg-slate-950 border-white/15 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Categoría</Label>
                <Select value={expCategoria} onValueChange={(val) => setExpCategoria(val as CategoriaGastoOperativo)}>
                  <SelectTrigger className="bg-slate-950 border-white/15 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    <SelectItem value="hosting_reseller">🌐 Hosting Reseller (Bluehosting)</SelectItem>
                    <SelectItem value="dominio_nic">🇨🇱 Dominios NIC Chile (.CL)</SelectItem>
                    <SelectItem value="servidor_cloud">⚡ Servidor Cloud (Vercel / Hetzner)</SelectItem>
                    <SelectItem value="licencia">🔑 Licencias y Software</SelectItem>
                    <SelectItem value="otro">📦 Otro Costo Operativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Monto *</Label>
                <Input
                  type="number"
                  value={expMonto || ""}
                  onChange={(e) => setExpMonto(parseFloat(e.target.value) || 0)}
                  placeholder="Ej. 35000"
                  required
                  className="bg-slate-950 border-white/15 text-white font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Moneda</Label>
                <Select value={expMoneda} onValueChange={(val) => setExpMoneda(val as "CLP" | "UF")}>
                  <SelectTrigger className="bg-slate-950 border-white/15 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    <SelectItem value="CLP">Pesos (CLP)</SelectItem>
                    <SelectItem value="UF">UF (Chile)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Periodicidad</Label>
                <Select value={expPeriodicidad} onValueChange={(val) => setExpPeriodicidad(val as "mensual" | "anual")}>
                  <SelectTrigger className="bg-slate-950 border-white/15 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    <SelectItem value="mensual">🗓️ Mensual</SelectItem>
                    <SelectItem value="anual">📅 Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Próxima Renovación</Label>
                <Input
                  type="date"
                  value={expFechaRenovacion}
                  onChange={(e) => setExpFechaRenovacion(e.target.value)}
                  className="bg-slate-950 border-white/15 text-white font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-white/10">
              <Button type="button" variant="outline" onClick={() => setIsExpenseOpen(false)} className="border-white/15 text-slate-300">
                Cancelar
              </Button>
              <Button type="submit" disabled={savingExpense} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                {savingExpense ? "Guardando..." : "Guardar Costo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};
