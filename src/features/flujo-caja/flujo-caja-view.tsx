"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Building2,
  Filter,
  Eye,
  Edit3,
  ExternalLink,
  Tag,
  Briefcase,
  Check,
  RotateCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  EventoFinanciero, 
  EventoFinancieroTipo, 
  EventoFinancieroCategoria,
  Subscription,
  Proyecto,
  HitoPago,
  DeclaracionF29
} from "@/lib/types";
import { 
  getEventosFinancieros, 
  saveEventoFinanciero, 
  updateEventoFinanciero,
  deleteEventoFinanciero,
  getSubscriptions,
  getProyectos,
  updateProyecto,
  getDeclaracionesF29,
  marcarF29Declarado,
  desmarcarF29Declarado
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type SortField = "fecha" | "concepto" | "monto" | "neto" | "iva" | "estado" | "proyecto";
type SortDirection = "asc" | "desc";

export const FlujoCajaView: React.FC = () => {
  const router = useRouter();
  const [eventos, setEventos] = useState<EventoFinanciero[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [suscripciones, setSuscripciones] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<"movimientos" | "tributario" | "costos">("movimientos");

  // Período tributario seleccionado (Mes y Año)
  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [filterAllYear, setFilterAllYear] = useState(false);

  // Filtros dinámicos
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<"todos" | "ingreso" | "egreso">("todos");
  const [filterRegimen, setFilterRegimen] = useState<"todos" | "factura" | "proyecto_factura" | "sin_factura" | "hitos_proyecto">("todos");
  const [filterProyectoId, setFilterProyectoId] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  // Ordenamiento interactivo
  const [sortField, setSortField] = useState<SortField>("fecha");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EventoFinanciero | null>(null);

  // Eliminación con confirmación
  const [deleteItem, setDeleteItem] = useState<EventoFinanciero | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal para nuevo movimiento financiero
  const [nuevoTipo, setNuevoTipo] = useState<EventoFinancieroTipo>("ingreso");
  const [nuevoConcepto, setNuevoConcepto] = useState("");
  const [nuevoProyectoId, setNuevoProyectoId] = useState<string>("ninguno");
  const [nuevoTipoComprobante, setNuevoTipoComprobante] = useState<"factura" | "boleta" | "honorarios" | "sin_comprobante">("factura");
  const [nuevoNumeroFactura, setNuevoNumeroFactura] = useState("");
  const [nuevoRutContraparte, setNuevoRutContraparte] = useState("");
  const [nuevaRazonSocial, setNuevaRazonSocial] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState<number>(0);
  const [montoNeto, setMontoNeto] = useState<number>(0);
  const [ivaMonto, setIvaMonto] = useState<number>(0);
  const [montoTotal, setMontoTotal] = useState<number>(0);
  const [aplicaFactura, setAplicaFactura] = useState<boolean>(true);
  const [nuevaCategoria, setNuevaCategoria] = useState<EventoFinancieroCategoria>("cobro_proyecto");
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().split("T")[0]);
  const [nuevoEstado, setNuevoEstado] = useState<"pendiente" | "cobrado" | "pagado">("cobrado");
  const [nuevasNotas, setNuevasNotas] = useState("");
  const [isSavingMovement, setIsSavingMovement] = useState(false);

  // Apertura limpia de modal para ingresos
  const openCreateIngreso = () => {
    setNuevoTipo("ingreso");
    setNuevaCategoria("cobro_proyecto");
    setNuevoTipoComprobante("factura");
    setAplicaFactura(true);
    setNuevoEstado("cobrado");
    setNuevoConcepto("");
    setNuevoMonto(0);
    setMontoNeto(0);
    setIvaMonto(0);
    setMontoTotal(0);
    setNuevoNumeroFactura("");
    setNuevoProyectoId("ninguno");
    setNuevoRutContraparte("");
    setNuevaRazonSocial("");
    setNuevaFecha(new Date().toISOString().split("T")[0]);
    setNuevasNotas("");
    setIsCreateOpen(true);
  };

  // Apertura limpia de modal para egresos / gastos
  const openCreateEgreso = (deducibleFactura: boolean = false) => {
    setNuevoTipo("egreso");
    setNuevaCategoria("gasto_operativo");
    setNuevoTipoComprobante(deducibleFactura ? "factura" : "sin_comprobante");
    setAplicaFactura(deducibleFactura);
    setNuevoEstado("pagado");
    setNuevoConcepto("");
    setNuevoMonto(0);
    setMontoNeto(0);
    setIvaMonto(0);
    setMontoTotal(0);
    setNuevoNumeroFactura("");
    setNuevoProyectoId("ninguno");
    setNuevoRutContraparte("");
    setNuevaRazonSocial("");
    setNuevaFecha(new Date().toISOString().split("T")[0]);
    setNuevasNotas("");
    setIsCreateOpen(true);
  };

  // Modal para Asignar Factura rápida a un hito o movimiento
  const [invNumero, setInvNumero] = useState("");
  const [invFecha, setInvFecha] = useState(new Date().toISOString().split("T")[0]);
  const [invRut, setInvRut] = useState("");
  const [invRazonSocial, setInvRazonSocial] = useState("");
  const [invMarcarCobrado, setInvMarcarCobrado] = useState(true);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);

  // Estados para Declaraciones F29
  const [declaracionesF29, setDeclaracionesF29] = useState<DeclaracionF29[]>([]);
  const [isDeclareF29Open, setIsDeclareF29Open] = useState(false);
  const [f29DeclarePeriodo, setF29DeclarePeriodo] = useState("");
  const [f29DeclarePeriodoNombre, setF29DeclarePeriodoNombre] = useState("");
  const [f29DeclareMonto, setF29DeclareMonto] = useState<number>(0);
  const [f29DeclareSinMovimiento, setF29DeclareSinMovimiento] = useState(false);
  const [f29DeclareFolio, setF29DeclareFolio] = useState("");
  const [f29DeclareNotas, setF29DeclareNotas] = useState("");
  const [submittingDeclareF29, setSubmittingDeclareF29] = useState(false);

  // Carga de datos unificada (Inter-módulos: Caja + Proyectos + Suscripciones + F29)
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [evData, proyData, subData, f29Data] = await Promise.all([
        getEventosFinancieros(),
        getProyectos(),
        getSubscriptions(),
        getDeclaracionesF29().catch(() => []),
      ]);
      setEventos(evData);
      setProyectos(proyData);
      setSuscripciones(subData);
      setDeclaracionesF29(f29Data);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar la información financiera inter-módulos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // CRUCE DE INFORMACIÓN: Unificación de hitos de proyectos con eventos de caja
  const transaccionesUnificadas = useMemo(() => {
    const lista: EventoFinanciero[] = eventos.map((ev) => {
      const cLower = (ev.concepto || "").toLowerCase();
      const esSaldoInicial = 
        (ev.categoria as string) === "saldo_inicial" ||
        cLower.includes("saldo inicial") ||
        cLower.includes("caja inicial") ||
        cLower.includes("aporte de capital") ||
        cLower.includes("ingreso inicial") ||
        ev.tipoComprobante === "sin_comprobante" ||
        ev.aplicaFactura === false;

      if (esSaldoInicial) {
        return {
          ...ev,
          aplicaFactura: false,
          tipoComprobante: ev.tipoComprobante || "sin_comprobante",
          ivaMonto: 0,
          montoNeto: ev.montoTotal ?? ev.monto ?? 0,
          numeroFactura: undefined,
          deducibleIva: false,
        };
      }
      return ev;
    });

    const hitosRegistrados = new Set(
      eventos.map((e) => e.hitoPagoId).filter(Boolean)
    );

    // Integrar hitos de proyectos que aún no están en la colección flujo_caja
    proyectos.forEach((p) => {
      if (Array.isArray(p.hitosPago)) {
        p.hitosPago.forEach((h) => {
          if (!hitosRegistrados.has(h.id)) {
            const tieneFacturaHito = Boolean(h.numeroFactura && h.numeroFactura.trim().length > 0);
            const neto = tieneFacturaHito ? Math.round(h.monto / (1 + IVA_TASA_CHILE)) : h.monto;
            const iva = tieneFacturaHito ? h.monto - neto : 0;

            lista.push({
              id: `hito-${p.id}-${h.id}`,
              isProjectHito: true,
              tipo: "ingreso",
              categoria: "cobro_proyecto",
              referenciaId: p.id,
              referenciaNombre: p.nombre,
              proyectoId: p.id,
              proyectoNombre: p.nombre,
              clienteId: p.clienteId,
              clienteNombre: p.clienteNombre,
              clienteRut: p.clienteRut,
              hitoPagoId: h.id,
              concepto: `${p.nombre} — ${h.titulo} (${h.porcentaje}%)`,
              monto: h.monto,
              montoNeto: neto,
              ivaMonto: iva,
              montoTotal: h.monto,
              aplicaFactura: tieneFacturaHito,
              numeroFactura: h.numeroFactura,
              fechaFactura: h.fechaFactura,
              rutContraparte: p.clienteRut,
              razonSocialContraparte: p.clienteNombre,
              tipoComprobante: tieneFacturaHito ? "factura" : "sin_comprobante",
              fechaVencimiento: h.fechaEstimada || new Date().toISOString().split("T")[0],
              fechaPago: h.fechaCobroReal,
              estado: h.estado === "cobrado" ? "cobrado" : "pendiente",
              notas: `Hito de pago del proyecto COT-${p.presupuestoNumero || p.id?.slice(0, 5)}`,
            });
          }
        });
      }
    });

    // 2. Conexión del módulo de Servicios Recurrentes & Infraestructura (Ingresos de Clientes y Egresos Propios)
    const todayIso = new Date().toISOString().split("T")[0];
    const mesesAProyectar = filterAllYear ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [selectedMonth];

    suscripciones.forEach((sub) => {
      const isActiva = sub.estado === "activo" || sub.estado === "por_vencer" || !sub.estado;
      if (!isActiva) return;

      const montoMensual = sub.montoEstimadoMensualCLP || (sub.moneda === "CLP" ? sub.monto : 0);
      if (montoMensual <= 0 && (!sub.monto || sub.monto <= 0)) return;

      const esCliente = sub.tipoRecurrencia === "cliente_ingreso" || Boolean(sub.clienteId);

      mesesAProyectar.forEach((m) => {
        if (sub.cicloFacturacion === "anual") {
          const mesCorte = sub.fechaCorte ? (new Date(sub.fechaCorte).getMonth() + 1) : 1;
          if (mesCorte !== m) return;
        }

        const montoAplicable = sub.cicloFacturacion === "anual" ? sub.monto : montoMensual;
        const dia = Math.min(28, sub.diaPago || 15);
        const fechaEstimada = `${selectedYear}-${String(m).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

        const esAfecta = Boolean(sub.aplicaFactura);
        const neto = esAfecta ? Math.round(montoAplicable / (1 + IVA_TASA_CHILE)) : montoAplicable;
        const iva = esAfecta ? montoAplicable - neto : 0;

        if (esCliente) {
          // Ingreso recurrente por mantención o servicio cobrado a cliente
          const estaCobrado = sub.estadoCobro === "al_dia" || (sub.fechaCorte && sub.fechaCorte > todayIso) || (fechaEstimada <= todayIso && sub.estadoCobro !== "vencido" && sub.estadoCobro !== "por_cobrar");

          lista.push({
            id: `sub-ingreso-${sub.id || sub.nombre}-${selectedYear}-${m}`,
            tipo: "ingreso",
            categoria: "recurrente_cliente",
            referenciaId: sub.id,
            referenciaNombre: sub.nombre,
            clienteId: sub.clienteId,
            clienteNombre: sub.clienteNombre,
            clienteRut: sub.clienteRut,
            razonSocialContraparte: sub.clienteNombre,
            rutContraparte: sub.clienteRut,
            concepto: sub.clienteNombre ? `Mantención: ${sub.nombre} — ${sub.clienteNombre}` : `Mantención Recurrente: ${sub.nombre}`,
            monto: montoAplicable,
            montoTotal: montoAplicable,
            montoNeto: neto,
            ivaMonto: iva,
            aplicaFactura: esAfecta,
            deducibleIva: false, // Ingreso genera débito fiscal si aplica factura
            tipoComprobante: esAfecta ? "factura" : "sin_comprobante",
            fechaVencimiento: fechaEstimada,
            fechaPago: estaCobrado ? fechaEstimada : undefined,
            estado: estaCobrado ? "cobrado" : sub.estadoCobro === "vencido" ? "vencido" : "pendiente",
            esRecurrente: true,
            frecuencia: sub.cicloFacturacion === "anual" ? "anual" : "mensual",
            notas: `Cobro recurrente conectado desde Suscripciones (${sub.categoria}). Dominio: ${sub.dominio || "N/A"}. SLA: ${sub.slaHorasMensuales ? `${sub.slaHorasMensuales} hrs` : "N/A"}.`,
          });
        } else {
          // Egreso recurrente por costo de infraestructura propia
          const estaPagado = fechaEstimada <= todayIso && sub.estado !== "vencido";

          lista.push({
            id: `sub-egreso-${sub.id || sub.nombre}-${selectedYear}-${m}`,
            tipo: "egreso",
            categoria: "renovacion_infraestructura",
            referenciaId: sub.id,
            referenciaNombre: sub.nombre,
            concepto: `${sub.nombre} (${sub.proveedor || "Servicio Recurrente"})`,
            monto: montoAplicable,
            montoTotal: montoAplicable,
            montoNeto: neto,
            ivaMonto: iva,
            aplicaFactura: esAfecta,
            deducibleIva: Boolean(sub.deducibleIva),
            tipoComprobante: esAfecta ? "factura" : "sin_comprobante",
            fechaVencimiento: fechaEstimada,
            fechaPago: estaPagado ? fechaEstimada : undefined,
            estado: estaPagado ? "pagado" : sub.estado === "vencido" ? "vencido" : "pendiente",
            esRecurrente: true,
            frecuencia: sub.cicloFacturacion === "anual" ? "anual" : "mensual",
            notas: `Gasto recurrente de empresa conectado desde Suscripciones (${sub.categoria}). Medio: ${sub.tarjetaOCuenta || sub.metodoPago || "Automático"}.`,
          });
        }
      });
    });

    return lista;
  }, [eventos, proyectos, suscripciones, selectedYear, selectedMonth, filterAllYear]);

  // FILTRADO DINÁMICO
  const transaccionesFiltradas = useMemo(() => {
    const q = search.trim().toLowerCase();

    return transaccionesUnificadas.filter((item) => {
      // 1. Filtro por Período (Mes y Año o Todo el Año)
      if (!filterAllYear && item.fechaVencimiento) {
        const [anio, mes] = item.fechaVencimiento.split("-").map(Number);
        if (anio !== selectedYear || mes !== selectedMonth) {
          return false;
        }
      } else if (filterAllYear && item.fechaVencimiento) {
        const [anio] = item.fechaVencimiento.split("-").map(Number);
        if (anio !== selectedYear) return false;
      }

      // 2. Filtro por Tipo (Ingreso vs Egreso)
      if (filterTipo !== "todos" && item.tipo !== filterTipo) {
        return false;
      }

      // 3. Filtro por Régimen / Facturación
      const cLower = (item.concepto || "").toLowerCase();
      const esSaldoInicial = 
        (item.categoria as string) === "saldo_inicial" ||
        cLower.includes("saldo inicial") ||
        cLower.includes("caja inicial") ||
        cLower.includes("aporte de capital") ||
        cLower.includes("ingreso inicial");

      const tieneFactura = !esSaldoInicial && Boolean(
        (item.numeroFactura && item.numeroFactura.trim().length > 0) ||
        item.tipoComprobante === "factura"
      ) && item.tipoComprobante !== "sin_comprobante" && item.tipoComprobante !== "boleta";

      if (filterRegimen === "factura") {
        if (!tieneFactura) return false;
      } else if (filterRegimen === "proyecto_factura") {
        // Solo gastos de proyecto con factura y deducibles
        const tieneProyecto = Boolean((item.proyectoId && item.proyectoId !== "ninguno") || item.referenciaId);
        if (item.tipo !== "egreso" || !tieneProyecto || !tieneFactura || item.deducibleIva === false) return false;
      } else if (filterRegimen === "sin_factura") {
        if (tieneFactura) return false;
      } else if (filterRegimen === "hitos_proyecto") {
        if (!item.hitoPagoId && !item.isProjectHito) return false;
      }

      // 4. Filtro por Proyecto Específico
      if (filterProyectoId !== "todos") {
        if (item.proyectoId !== filterProyectoId && item.referenciaId !== filterProyectoId) {
          return false;
        }
      }

      // 5. Filtro por Estado (Cobrado / Pagado unificado)
      if (filterEstado !== "todos") {
        if (filterEstado === "cobrado") {
          if (item.estado !== "cobrado" && item.estado !== "pagado") return false;
        } else if (item.estado !== filterEstado) {
          return false;
        }
      }

      // 6. Buscador predictivo por texto
      if (q) {
        const matchConcepto = (item.concepto || "").toLowerCase().includes(q);
        const matchProyecto = (item.proyectoNombre || item.referenciaNombre || "").toLowerCase().includes(q);
        const matchCliente = (item.clienteNombre || item.razonSocialContraparte || "").toLowerCase().includes(q);
        const matchRut = (item.clienteRut || item.rutContraparte || "").toLowerCase().includes(q);
        const matchFactura = (item.numeroFactura || "").toLowerCase().includes(q);
        if (!matchConcepto && !matchProyecto && !matchCliente && !matchRut && !matchFactura) {
          return false;
        }
      }

      return true;
    });
  }, [
    transaccionesUnificadas,
    search,
    filterTipo,
    filterRegimen,
    filterProyectoId,
    filterEstado,
    selectedYear,
    selectedMonth,
    filterAllYear,
  ]);

  // ORDENAMIENTO DE COLUMNAS
  const transaccionesOrdenadas = useMemo(() => {
    return [...transaccionesFiltradas].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      switch (sortField) {
        case "fecha":
          valA = a.fechaVencimiento || "";
          valB = b.fechaVencimiento || "";
          break;
        case "concepto":
          valA = (a.concepto || "").toLowerCase();
          valB = (b.concepto || "").toLowerCase();
          break;
        case "monto":
          valA = a.montoTotal ?? a.monto ?? 0;
          valB = b.montoTotal ?? b.monto ?? 0;
          break;
        case "neto":
          valA = a.montoNeto ?? 0;
          valB = b.montoNeto ?? 0;
          break;
        case "iva":
          valA = a.ivaMonto ?? 0;
          valB = b.ivaMonto ?? 0;
          break;
        case "estado":
          valA = a.estado || "";
          valB = b.estado || "";
          break;
        case "proyecto":
          valA = (a.proyectoNombre || a.referenciaNombre || "").toLowerCase();
          valB = (b.proyectoNombre || b.referenciaNombre || "").toLowerCase();
          break;
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [transaccionesFiltradas, sortField, sortDirection]);

  // PAGINACIÓN
  const totalPages = Math.ceil(transaccionesOrdenadas.length / pageSize) || 1;
  const transaccionesPaginadas = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return transaccionesOrdenadas.slice(start, start + pageSize);
  }, [transaccionesOrdenadas, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // CÁLCULOS TRIBUTARIOS Y FINANCIEROS ÚTILES
  // REGLA CLAVE SOLICITADA POR EL USUARIO:
  // "solo cuente para la facturacion los gastos asociados a proyectos, que tengan factura asociado"
  const metricas = useMemo(() => {
    // 1. Ingresos Cobrados vs Egresos Reales (Flujo Real de Caja)
    const ingresosCobrados = transaccionesUnificadas
      .filter((t) => t.tipo === "ingreso" && t.estado === "cobrado")
      .reduce((sum, t) => sum + (t.montoTotal ?? t.monto ?? 0), 0);

    const egresosPagados = transaccionesUnificadas
      .filter((t) => t.tipo === "egreso" && (t.estado === "pagado" || t.estado === "cobrado"))
      .reduce((sum, t) => sum + (t.montoTotal ?? t.monto ?? 0), 0);

    const saldoOperativoReal = ingresosCobrados - egresosPagados;

    // 2. Ventas Facturadas (Débito Fiscal) del período seleccionado
    // REGLA ESTRICTA: Solo ventas que tengan factura física/DTE emitida (NUNCA saldos iniciales ni ingresos sin factura)
    const ventasFacturadasPeriodo = transaccionesFiltradas
      .filter((t) => {
        if (t.tipo !== "ingreso") return false;

        const cLower = (t.concepto || "").toLowerCase();
        const esSaldoInicial = 
          (t.categoria as string) === "saldo_inicial" ||
          cLower.includes("saldo inicial") ||
          cLower.includes("caja inicial") ||
          cLower.includes("aporte de capital") ||
          cLower.includes("ingreso inicial") ||
          t.tipoComprobante === "sin_comprobante" ||
          t.aplicaFactura === false;

        if (esSaldoInicial) return false;

        // Debe tener factura real
        const tieneFactura = Boolean(
          (t.numeroFactura && t.numeroFactura.trim().length > 0) ||
          t.tipoComprobante === "factura" ||
          (t.aplicaFactura === true && t.tipoComprobante !== "sin_comprobante" && t.tipoComprobante !== "boleta")
        );

        return tieneFactura;
      })
      .reduce((acc, t) => {
        const total = t.montoTotal ?? t.monto ?? 0;
        const neto = t.montoNeto ?? Math.round(total / (1 + IVA_TASA_CHILE));
        const iva = t.ivaMonto ?? total - neto;
        return {
          total: acc.total + total,
          neto: acc.neto + neto,
          iva: acc.iva + iva,
          count: acc.count + 1,
        };
      }, { total: 0, neto: 0, iva: 0, count: 0 });

    // 3. Gastos de Proyectos con Factura (Crédito Fiscal) del período seleccionado
    // REGLA ESTRICTA: Solo egresos asociados a proyectos con factura real asociada y deducibles de IVA
    const gastosProyectoConFacturaPeriodo = transaccionesFiltradas
      .filter((t) => {
        if (t.tipo !== "egreso") return false;
        const tieneProyecto = Boolean((t.proyectoId && t.proyectoId !== "ninguno") || t.referenciaId);
        const tieneFactura = Boolean(
          (t.numeroFactura && t.numeroFactura.trim().length > 0) ||
          t.tipoComprobante === "factura"
        ) && t.tipoComprobante !== "sin_comprobante" && t.tipoComprobante !== "boleta";
        const esDeducible = t.deducibleIva !== false;
        return tieneProyecto && tieneFactura && esDeducible;
      })
      .reduce((acc, t) => {
        const total = t.montoTotal ?? t.monto ?? 0;
        const neto = t.montoNeto ?? Math.round(total / (1 + IVA_TASA_CHILE));
        const iva = t.ivaMonto ?? total - neto;
        return {
          total: acc.total + total,
          neto: acc.neto + neto,
          iva: acc.iva + iva,
          count: acc.count + 1,
        };
      }, { total: 0, neto: 0, iva: 0, count: 0 });

    // 4. Liquidación Estimada F29 (SII)
    const ivaDiferencia = ventasFacturadasPeriodo.iva - gastosProyectoConFacturaPeriodo.iva;
    const ivaAPagar = Math.max(0, ivaDiferencia);
    const remanenteAFavor = ivaDiferencia < 0 ? Math.abs(ivaDiferencia) : 0;
    const ppm = Math.round(ventasFacturadasPeriodo.neto * PPM_TASA_REFERENCIAL);
    const f29Neto = ivaAPagar + ppm;

    // 5. Hitos de Proyectos Pendientes de Cobro / Facturación
    const hitosPendientes = transaccionesUnificadas
      .filter((t) => t.tipo === "ingreso" && t.estado === "pendiente")
      .reduce((acc, t) => {
        return {
          total: acc.total + (t.montoTotal ?? t.monto ?? 0),
          count: acc.count + 1,
        };
      }, { total: 0, count: 0 });

    return {
      saldoOperativoReal,
      ingresosCobrados,
      egresosPagados,
      ventasFacturadasPeriodo,
      gastosProyectoConFacturaPeriodo,
      ivaAPagar,
      remanenteAFavor,
      ppm,
      f29Neto,
      hitosPendientes,
    };
  }, [transaccionesUnificadas, transaccionesFiltradas]);

  // Alerta de calendario SII (días 10 al 20 a mes vencido)
  const alertaCalendarioSII = useMemo(() => {
    return obtenerAlertaCalendarioSII(transaccionesUnificadas, today, declaracionesF29);
  }, [transaccionesUnificadas, today, declaracionesF29]);

  // Acciones de declaración F29 (Solo permitida para meses ya vencidos)
  const handleOpenDeclareF29 = (
    periodo: string,
    periodoNombre: string,
    montoEstimado: number = 0,
    esSinMovimiento: boolean = false
  ) => {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const [pYear, pMonth] = periodo.split("-").map(Number);
    const isPastPeriod = pYear < currentYear || (pYear === currentYear && pMonth < currentMonth);

    if (!isPastPeriod) {
      toast.error(
        `Solo se puede emitir y declarar el F29 de meses ya vencidos. El mes en curso (${periodoNombre}) acumula facturación hasta el último día y vence el mes siguiente.`
      );
      return;
    }

    setF29DeclarePeriodo(periodo);
    setF29DeclarePeriodoNombre(periodoNombre);
    setF29DeclareMonto(esSinMovimiento ? 0 : montoEstimado);
    setF29DeclareSinMovimiento(esSinMovimiento || montoEstimado === 0);
    setF29DeclareFolio("");
    setF29DeclareNotas("");
    setIsDeclareF29Open(true);
  };

  const handleConfirmDeclareF29 = async () => {
    if (!f29DeclarePeriodo) return;
    setSubmittingDeclareF29(true);
    try {
      const res = await marcarF29Declarado({
        periodo: f29DeclarePeriodo,
        montoPagado: f29DeclareSinMovimiento ? 0 : Number(f29DeclareMonto || 0),
        sinMovimiento: f29DeclareSinMovimiento,
        folioSII: f29DeclareFolio,
        notas: f29DeclareNotas,
      });

      if (res && res.declaracion) {
        setDeclaracionesF29((prev) => {
          const filtered = prev.filter((d) => d.periodo !== f29DeclarePeriodo);
          return [...filtered, res.declaracion];
        });
        toast.success(`F29 de ${f29DeclarePeriodoNombre} marcado como declarado con éxito. Alerta resuelta.`);
        setIsDeclareF29Open(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar la declaración F29";
      toast.error(msg);
    } finally {
      setSubmittingDeclareF29(false);
    }
  };

  const handleUnmarkDeclareF29 = async (periodo: string, periodoNombre: string) => {
    try {
      await desmarcarF29Declarado(periodo);
      setDeclaracionesF29((prev) => prev.filter((d) => d.periodo !== periodo));
      toast.success(`Declaración del período ${periodoNombre} desmarcada.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al desmarcar declaración";
      toast.error(msg);
    }
  };

  // Manejo de Períodos
  const handlePrevMonth = () => {
    setFilterAllYear(false);
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
    setCurrentPage(1);
  };

  const handleNextMonth = () => {
    setFilterAllYear(false);
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
    setCurrentPage(1);
  };

  const handleCurrentMonth = () => {
    setFilterAllYear(false);
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
    setCurrentPage(1);
  };

  // Cálculo reactivo de Neto, IVA y Total en el modal de creación
  const handleNetoInput = (val: number) => {
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

  const handleTotalInput = (val: number) => {
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

  // Guardar nuevo movimiento financiero
  const handleCreateMovement = async () => {
    const valorFinal = montoTotal > 0 ? montoTotal : nuevoMonto;
    if (!nuevoConcepto.trim() || valorFinal <= 0) {
      toast.warning("Ingresa un concepto descriptivo y un monto válido");
      return;
    }

    try {
      setIsSavingMovement(true);
      const cLower = nuevoConcepto.trim().toLowerCase();
      const esSaldoInicial = 
        nuevaCategoria === "saldo_inicial" ||
        cLower.includes("saldo inicial") ||
        cLower.includes("caja inicial") ||
        cLower.includes("aporte de capital") ||
        cLower.includes("ingreso inicial") ||
        nuevoTipoComprobante === "sin_comprobante";

      const finalAplicaFactura = !esSaldoInicial && Boolean(aplicaFactura || nuevoTipoComprobante === "factura");
      const finalNeto = finalAplicaFactura ? (montoNeto > 0 ? montoNeto : Math.round(valorFinal / 1.19)) : valorFinal;
      const finalIva = finalAplicaFactura ? (ivaMonto > 0 ? ivaMonto : valorFinal - finalNeto) : 0;

      // Buscar si seleccionó un proyecto
      const proy = proyectos.find((p) => p.id === nuevoProyectoId);

      // Regla de negocio: En egresos/gastos, solo es deducible de IVA si tiene proyecto y factura
      const esGastoProyectoConFactura =
        nuevoTipo === "egreso" &&
        !esSaldoInicial &&
        Boolean(nuevoProyectoId && nuevoProyectoId !== "ninguno") &&
        Boolean(nuevoNumeroFactura.trim() || nuevoTipoComprobante === "factura");

      const estadoFinal: "pendiente" | "cobrado" | "pagado" =
        nuevoEstado === "pendiente"
          ? "pendiente"
          : nuevoTipo === "egreso"
          ? "pagado"
          : "cobrado";

      const categoriaFinal: EventoFinancieroCategoria =
        nuevaCategoria || (nuevoTipo === "egreso" ? "gasto_operativo" : "cobro_proyecto");

      const nuevo: Partial<EventoFinanciero> = {
        tipo: nuevoTipo,
        categoria: categoriaFinal,
        concepto: nuevoConcepto.trim(),
        monto: valorFinal,
        montoNeto: finalNeto,
        ivaMonto: finalIva,
        montoTotal: valorFinal,
        aplicaFactura: finalAplicaFactura,
        deducibleIva: esGastoProyectoConFactura,
        tipoComprobante: esSaldoInicial ? "sin_comprobante" : nuevoTipoComprobante,
        numeroFactura: esSaldoInicial ? undefined : (nuevoNumeroFactura.trim() || undefined),
        fechaFactura: (!esSaldoInicial && nuevoNumeroFactura.trim()) ? nuevaFecha : undefined,
        rutContraparte: nuevoRutContraparte.trim() || proy?.clienteRut || undefined,
        razonSocialContraparte: nuevaRazonSocial.trim() || proy?.clienteNombre || undefined,
        proyectoId: proy?.id || undefined,
        proyectoNombre: proy?.nombre || undefined,
        clienteId: proy?.clienteId || undefined,
        clienteNombre: proy?.clienteNombre || undefined,
        fechaVencimiento: nuevaFecha,
        fechaPago: estadoFinal !== "pendiente" ? nuevaFecha : undefined,
        estado: estadoFinal,
        notas: nuevasNotas.trim() || undefined,
      };

      await saveEventoFinanciero(nuevo);
      toast.success(
        nuevoTipo === "ingreso"
          ? "Ingreso registrado y catalogado para facturación"
          : esGastoProyectoConFactura
            ? "Gasto de proyecto con factura registrado (Crédito Fiscal IVA activado)"
            : "Gasto registrado en flujo de caja (Egreso operacional)"
      );

      setIsCreateOpen(false);
      setNuevoConcepto("");
      setNuevoMonto(0);
      setMontoNeto(0);
      setIvaMonto(0);
      setMontoTotal(0);
      setNuevoNumeroFactura("");
      setNuevoRutContraparte("");
      setNuevaRazonSocial("");
      setNuevasNotas("");
      setNuevoProyectoId("ninguno");
      loadData();
    } catch (err: unknown) {
      console.error("Error al registrar movimiento:", err);
      const msg = err instanceof Error ? err.message : "Error al registrar el movimiento financiero";
      toast.error(msg);
    } finally {
      setIsSavingMovement(false);
    }
  };

  // Abrir modal para asignar/editar factura
  const handleOpenInvoiceModal = (item: EventoFinanciero) => {
    setSelectedItem(item);
    setInvNumero(item.numeroFactura || "");
    setInvFecha(item.fechaFactura || item.fechaVencimiento || new Date().toISOString().split("T")[0]);
    setInvRut(item.rutContraparte || item.clienteRut || "");
    setInvRazonSocial(item.razonSocialContraparte || item.clienteNombre || "");
    setInvMarcarCobrado(item.estado === "cobrado");
    setIsInvoiceModalOpen(true);
  };

  // Guardar asignación de factura (Cruza con el proyecto y con flujo_caja)
  const handleSaveInvoiceAssignment = async () => {
    if (!selectedItem) return;
    const num = invNumero.trim();
    if (!num) {
      toast.warning("Ingresa el número de factura emitida o recibida");
      return;
    }

    try {
      setIsSavingInvoice(true);

      // 1. Si es un hito de proyecto, actualizar el hito en la colección 'proyectos'
      if (selectedItem.proyectoId && selectedItem.hitoPagoId) {
        const proy = proyectos.find((p) => p.id === selectedItem.proyectoId);
        if (proy && Array.isArray(proy.hitosPago)) {
          const hitosActualizados = proy.hitosPago.map((h) => {
            if (h.id === selectedItem.hitoPagoId) {
              return {
                ...h,
                numeroFactura: num,
                fechaFactura: invFecha,
                rutFactura: invRut.trim() || undefined,
                tieneFactura: true,
                estado: invMarcarCobrado ? ("cobrado" as const) : h.estado,
                fechaCobroReal: invMarcarCobrado ? (h.fechaCobroReal || invFecha) : h.fechaCobroReal,
              };
            }
            return h;
          });
          await updateProyecto(proy.id!, { hitosPago: hitosActualizados });
        }
      }

      // 2. Si es un registro directo en 'flujo_caja', actualizar el doc
      if (selectedItem.id && !selectedItem.id.startsWith("hito-")) {
        await updateEventoFinanciero(selectedItem.id, {
          numeroFactura: num,
          fechaFactura: invFecha,
          rutContraparte: invRut.trim() || undefined,
          razonSocialContraparte: invRazonSocial.trim() || undefined,
          tipoComprobante: "factura",
          aplicaFactura: true,
          deducibleIva: selectedItem.tipo === "egreso" && Boolean(selectedItem.proyectoId),
          estado: invMarcarCobrado ? (selectedItem.tipo === "ingreso" ? "cobrado" : "pagado") : selectedItem.estado,
          fechaPago: invMarcarCobrado ? invFecha : selectedItem.fechaPago,
        });
      } else if (selectedItem.isProjectHito) {
        // Si el hito aún no existía como evento en Firestore, crearlo sincronizado
        const total = selectedItem.montoTotal ?? selectedItem.monto;
        const neto = Math.round(total / 1.19);
        const iva = total - neto;

        await saveEventoFinanciero({
          tipo: "ingreso",
          categoria: "cobro_proyecto",
          concepto: selectedItem.concepto,
          monto: total,
          montoNeto: neto,
          ivaMonto: iva,
          montoTotal: total,
          aplicaFactura: true,
          numeroFactura: num,
          fechaFactura: invFecha,
          rutContraparte: invRut.trim() || undefined,
          razonSocialContraparte: invRazonSocial.trim() || undefined,
          tipoComprobante: "factura",
          proyectoId: selectedItem.proyectoId,
          proyectoNombre: selectedItem.proyectoNombre,
          clienteId: selectedItem.clienteId,
          clienteNombre: selectedItem.clienteNombre,
          hitoPagoId: selectedItem.hitoPagoId,
          fechaVencimiento: invFecha,
          fechaPago: invMarcarCobrado ? invFecha : undefined,
          estado: invMarcarCobrado ? "cobrado" : "pendiente",
        });
      }

      toast.success(`Factura N° ${num} asignada con éxito. Se computa para el cálculo de IVA y F29.`);
      setIsInvoiceModalOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al asignar la factura");
    } finally {
      setIsSavingInvoice(false);
    }
  };

  // Abrir modal de detalles
  const handleOpenDetail = (item: EventoFinanciero) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  // Toggle rápido de estado (Cobrado / Pagado / Pendiente)
  const handleToggleEstado = async (evento: EventoFinanciero) => {
    const nextEstado = evento.estado === "pendiente" 
      ? (evento.tipo === "ingreso" ? "cobrado" : "pagado") 
      : "pendiente";

    try {
      if (evento.id?.startsWith("sub-")) {
        toast.info("Este servicio recurrente se administra desde el módulo de Suscripciones");
        return;
      }

      if (evento.id && !evento.id.startsWith("hito-")) {
        await updateEventoFinanciero(evento.id, { 
          estado: nextEstado,
          fechaPago: nextEstado !== "pendiente" ? new Date().toISOString().split("T")[0] : undefined
        });
      } else if (evento.proyectoId && evento.hitoPagoId) {
        const proy = proyectos.find((p) => p.id === evento.proyectoId);
        if (proy && Array.isArray(proy.hitosPago)) {
          const hitos = proy.hitosPago.map((h) => 
            h.id === evento.hitoPagoId 
              ? { ...h, estado: nextEstado as any, fechaCobroReal: nextEstado === "cobrado" ? new Date().toISOString().split("T")[0] : undefined } 
              : h
          );
          await updateProyecto(proy.id!, { hitosPago: hitos });
        }
      }

      toast.success(`Movimiento marcado como ${nextEstado}`);
      loadData();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error al actualizar estado";
      toast.error(msg);
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    try {
      setIsDeleting(true);
      if (deleteItem.id?.startsWith("sub-")) {
        toast.info("Los servicios recurrentes se gestionan y retiran desde el módulo de Suscripciones");
        setDeleteItem(null);
        return;
      }

      if (deleteItem.id && !deleteItem.id.startsWith("hito-")) {
        await deleteEventoFinanciero(deleteItem.id);
        toast.success("Movimiento eliminado del flujo de caja");
      } else if (deleteItem.proyectoId && deleteItem.hitoPagoId) {
        toast.info("Para eliminar este hito contractual, retíralo directamente desde la sección del Proyecto");
      }
      setDeleteItem(null);
      loadData();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error al eliminar movimiento";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. ENCABEZADO PRINCIPAL (IDENTIDAD HOJA SPA) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-lg bg-card border border-white/10 shadow-xl relative overflow-hidden">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Inicio
            </button>
            <span>/</span>
            <span className="text-indigo-400">Flujo de Caja & Tributario</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Landmark className="w-6 h-6 text-indigo-400" />
            Flujo de Caja Real & Control Tributario
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Conciliación de facturación, cruce automático con proyectos e imputación estricta de gastos con factura para IVA F29.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={() => router.push("/suscripciones")}
            className="h-9 px-3.5 rounded-md bg-white/5 border-white/15 hover:bg-white/10 text-white font-bold text-xs gap-1.5"
            title="Gestionar hosting reseller, servidores cloud, licencias y dominios en el módulo especializado"
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
            Servicios Recurrentes ({suscripciones.filter((s) => s.estado === "activo" || s.estado === "por_vencer").length})
          </Button>

          <Button
            onClick={openCreateIngreso}
            className="h-9 px-4 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar Movimiento
          </Button>
        </div>
      </div>

      {/* 2. BANNER DE CALENDARIO TRIBUTARIO SII Y PROYECCIÓN */}
      {alertaCalendarioSII && (
        alertaCalendarioSII.yaDeclarado ? (
          // CASO A: Ya declarado ante el SII (Alerta resuelta + Proyección de mes en curso)
          <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-950/20 shadow-md shadow-emerald-950/15 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                    F29 Período {alertaCalendarioSII.periodoDeclarado} Declarado ante el SII
                  </span>
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold">
                    ✓ Al Día — Alerta Resuelta
                  </Badge>
                  {alertaCalendarioSII.declaracionRegistrada?.folioSII && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Folio #{alertaCalendarioSII.declaracionRegistrada.folioSII}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300">
                  El F29 del mes vencido ({alertaCalendarioSII.periodoDeclarado}) fue emitido y declarado ante el SII{" "}
                  {alertaCalendarioSII.declaracionRegistrada?.fechaDeclaracion && `el ${alertaCalendarioSII.declaracionRegistrada.fechaDeclaracion}`}
                  . Monto:{" "}
                  <strong className="text-emerald-400 font-mono">
                    {alertaCalendarioSII.declaracionRegistrada?.sinMovimiento
                      ? "$0 (Sin Movimiento)"
                      : formatCLP(alertaCalendarioSII.declaracionRegistrada?.montoPagado ?? alertaCalendarioSII.f29Estimado)}
                  </strong>
                  .
                </p>

                {/* Sub-bloque: Proyección siguiente período con facturación del mes en curso */}
                <div className="mt-2 pt-2 border-t border-emerald-500/20 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="text-slate-400 flex items-center gap-1 font-medium">
                    <Scale className="w-3.5 h-3.5 text-sky-400" />
                    Proyección Próximo F29 ({alertaCalendarioSII.proyeccionMesEnCurso.nombreMes}):
                  </span>
                  <span className="text-slate-300">
                    Facturación acumulada: <strong className="text-white font-mono">{formatCLP(alertaCalendarioSII.proyeccionMesEnCurso.totalFacturadoVentas)}</strong>
                  </span>
                  <span className="text-slate-300">
                    F29 Proyectado a pagar: <strong className="text-amber-400 font-mono">{formatCLP(alertaCalendarioSII.proyeccionMesEnCurso.f29Estimado)}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (Vence: {alertaCalendarioSII.proyeccionMesEnCurso.fechaVence})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const [pYear, pMonth] = alertaCalendarioSII.proyeccionMesEnCurso.periodo.split("-").map(Number);
                  setSelectedYear(pYear);
                  setSelectedMonth(pMonth);
                  setFilterAllYear(false);
                  setActiveTab("tributario");
                }}
                className="h-8 px-3 rounded-md bg-white/5 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300 text-xs font-bold gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Ver Proyección {alertaCalendarioSII.proyeccionMesEnCurso.nombreMes}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleUnmarkDeclareF29(alertaCalendarioSII.periodoFiscalVencido, alertaCalendarioSII.periodoDeclarado)}
                className="h-8 px-2 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-[11px]"
                title="Desmarcar declaración si fue un error"
              >
                Desmarcar
              </Button>
            </div>
          </div>
        ) : (
          // CASO B: Pendiente de declaración (Alerta activa + Proyección del mes en curso)
          <div className={`p-4 rounded-lg border transition-all ${
            alertaCalendarioSII.esCritica
              ? "bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-950/20"
              : "bg-amber-950/30 border-amber-500/40 shadow-md shadow-amber-950/15"
          } flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                alertaCalendarioSII.esCritica 
                  ? "bg-rose-500/20 border border-rose-500/40 text-rose-400" 
                  : "bg-amber-500/20 border border-amber-500/40 text-amber-300"
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${
                    alertaCalendarioSII.esCritica ? "text-rose-400" : "text-amber-300"
                  }`}>
                    {alertaCalendarioSII.esCritica ? "Vencimiento Crítico SII (Menos de 3 días)" : "Calendario Tributario F29 (Día 20)"}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                    alertaCalendarioSII.esCritica ? "bg-rose-600 text-white" : "bg-amber-500 text-slate-950"
                  }`}>
                    {alertaCalendarioSII.diasRestantes === 0 ? "¡Vence Hoy!" : `Faltan ${alertaCalendarioSII.diasRestantes} días (Vence ${alertaCalendarioSII.fechaVence})`}
                  </span>
                </div>
                <p className="text-xs font-bold text-white mt-0.5">
                  {alertaCalendarioSII.mensaje}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                  <span>
                    Período a declarar: <strong className="text-white">{alertaCalendarioSII.periodoDeclarado}</strong> (mes ya cerrado)
                  </span>
                  <span>•</span>
                  <span>
                    Siguiente período ({alertaCalendarioSII.proyeccionMesEnCurso.nombreMes}): Acumulando facturación hasta el último día para pagar el {alertaCalendarioSII.proyeccionMesEnCurso.fechaVence} (Provisión actual: {formatCLP(alertaCalendarioSII.proyeccionMesEnCurso.f29Estimado)})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
              <Button
                size="sm"
                onClick={() =>
                  handleOpenDeclareF29(
                    alertaCalendarioSII.periodoFiscalVencido,
                    alertaCalendarioSII.periodoDeclarado,
                    alertaCalendarioSII.f29Estimado,
                    alertaCalendarioSII.sinMovimiento
                  )
                }
                className="h-8.5 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/30"
              >
                <Check className="w-3.5 h-3.5" />
                Marcar F29 {alertaCalendarioSII.periodoDeclarado} como Declarado
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const [pYear, pMonth] = alertaCalendarioSII.periodoFiscalVencido.split("-").map(Number);
                  setSelectedYear(pYear);
                  setSelectedMonth(pMonth);
                  setFilterAllYear(false);
                  setActiveTab("tributario");
                }}
                className="h-8.5 px-3 rounded-md bg-white/10 hover:bg-white/15 text-white text-xs font-bold shrink-0"
              >
                Ver Conciliación F29
              </Button>
            </div>
          </div>
        )
      )}

      {/* 3. ESTADÍSTICAS ARRIBA (SOLO LAS ÚTILES, COMPACTAS, SUBTLE BORDERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Saldo Operativo Real */}
        <Card className="bg-card border-white/10 rounded-lg p-4 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Saldo Operativo Real</span>
            <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-lg font-mono font-black ${metricas.saldoOperativoReal >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {formatCLP(metricas.saldoOperativoReal)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-white/5">
            <span>Cobrado: {formatCLP(metricas.ingresosCobrados)}</span>
            <span>Egresos: {formatCLP(metricas.egresosPagados)}</span>
          </div>
        </Card>

        {/* Card 2: Ventas Facturadas (Débito Fiscal) */}
        <Card className="bg-card border-white/10 rounded-lg p-4 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-sky-400">Ventas Facturadas</span>
            <div className="w-6 h-6 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-mono font-black text-sky-400">
            {formatCLP(metricas.ventasFacturadasPeriodo.total)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-white/5">
            <span>Neto: {formatCLP(metricas.ventasFacturadasPeriodo.neto)}</span>
            <span className="font-bold text-sky-300">IVA Débito: +{formatCLP(metricas.ventasFacturadasPeriodo.iva)}</span>
          </div>
        </Card>

        {/* Card 3: Gastos Facturados Proyecto (Crédito Fiscal) */}
        <Card className="bg-card border-white/10 rounded-lg p-4 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Gastos Factura Proy.</span>
            <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-mono font-black text-emerald-400">
            {formatCLP(metricas.gastosProyectoConFacturaPeriodo.total)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-white/5">
            <span>Neto: {formatCLP(metricas.gastosProyectoConFacturaPeriodo.neto)}</span>
            <span className="font-bold text-emerald-300">IVA Crédito: -{formatCLP(metricas.gastosProyectoConFacturaPeriodo.iva)}</span>
          </div>
        </Card>

        {/* Card 4: Liquidación F29 (SII) */}
        <Card className="bg-card border-white/10 rounded-lg p-4 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-400">Liquidación F29</span>
            <div className="w-6 h-6 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-mono font-black text-amber-400">
            {formatCLP(metricas.f29Neto)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-white/5">
            <span>IVA Neto: {formatCLP(metricas.ivaAPagar)}</span>
            <span>PPM (0.25%): {formatCLP(metricas.ppm)}</span>
          </div>
        </Card>

        {/* Card 5: Por Cobrar / Pendiente de Facturar */}
        <Card className="bg-card border-white/10 rounded-lg p-4 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Por Cobrar / Hitos</span>
            <div className="w-6 h-6 rounded bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg font-mono font-black text-slate-200">
            {formatCLP(metricas.hitosPendientes.total)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-white/5">
            <span>{metricas.hitosPendientes.count} hitos en proyectos</span>
            <span className="text-amber-400 font-bold">Por Facturar</span>
          </div>
        </Card>
      </div>

      {/* 4. BARRA DE CONTROL DE PERÍODO & SUB-NAVEGACIÓN DE PESTAÑAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
        {/* Pestañas de la vista */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("movimientos")}
            className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "movimientos"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-500"
                : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Transacciones & Facturación ({transaccionesFiltradas.length})
          </button>

          <button
            onClick={() => setActiveTab("tributario")}
            className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "tributario"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 border border-amber-400 font-black"
                : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Liquidación F29 (SII)
          </button>

          <button
            onClick={() => setActiveTab("costos")}
            className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "costos"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-500"
                : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            Servicios Recurrentes ({suscripciones.length})
          </button>
        </div>

        {/* Selector de Período / Mes */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-7 w-7 text-slate-400 hover:text-white rounded"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            <span className="text-xs font-bold text-white px-2 min-w-[120px] text-center">
              {filterAllYear ? `Año Completo ${selectedYear}` : `${NOMBRES_MESES[selectedMonth - 1]} ${selectedYear}`}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-7 w-7 text-slate-400 hover:text-white rounded"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCurrentMonth}
            className="h-8 px-2.5 text-[11px] font-bold text-indigo-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-md"
          >
            Mes Actual
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterAllYear(!filterAllYear)}
            className={`h-8 px-2.5 text-[11px] font-bold rounded-md transition-all ${
              filterAllYear
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10"
            }`}
          >
            {filterAllYear ? "Viendo Todo el Año" : "Ver Todo el Año"}
          </Button>
        </div>
      </div>

      {/* 5. CONTENIDO: PESTAÑA 1 - TRANSACCIONES & FACTURACIÓN */}
      {activeTab === "movimientos" && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS DINÁMICOS */}
          <div className="p-3.5 rounded-lg bg-card border border-white/10 space-y-3 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Buscador predictivo */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Buscar por concepto, N° de factura, cliente, proveedor, RUT, proyecto..."
                  className="pl-9 h-9 rounded-md bg-slate-900 border-white/15 text-white text-xs placeholder:text-slate-500"
                />
              </div>

              {/* Selector de Proyecto */}
              <div className="flex items-center gap-2">
                <Select
                  value={filterProyectoId}
                  onValueChange={(val) => {
                    setFilterProyectoId(val || "todos");
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-slate-900 border-white/15 text-white rounded-md min-w-[180px] font-medium">
                    <SelectValue placeholder="Filtrar por Proyecto" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    <SelectItem value="todos" className="text-xs font-bold">Todos los Proyectos</SelectItem>
                    {proyectos.map((p) => (
                      <SelectItem key={p.id} value={p.id!} className="text-xs">
                        {p.nombre} ({p.clienteNombre})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selector de Estado */}
                <Select
                  value={filterEstado}
                  onValueChange={(val) => {
                    setFilterEstado(val || "todos");
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-slate-900 border-white/15 text-white rounded-md min-w-[130px] font-medium">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    <SelectItem value="todos" className="text-xs font-bold">Todos los Estados</SelectItem>
                    <SelectItem value="cobrado" className="text-xs text-emerald-400">Cobrado / Pagado</SelectItem>
                    <SelectItem value="pendiente" className="text-xs text-amber-300">Pendiente</SelectItem>
                    <SelectItem value="vencido" className="text-xs text-rose-400">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chips de filtro rápido */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {/* Tipo */}
                <button
                  onClick={() => { setFilterTipo("todos"); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    filterTipo === "todos"
                      ? "bg-primary text-primary-foreground font-black shadow-xs"
                      : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  Todos ({transaccionesUnificadas.length})
                </button>
                <button
                  onClick={() => { setFilterTipo("ingreso"); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    filterTipo === "ingreso"
                      ? "bg-emerald-600 text-white font-black shadow-xs"
                      : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                  }`}
                >
                  + Ingresos / Cobros
                </button>
                <button
                  onClick={() => { setFilterTipo("egreso"); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    filterTipo === "egreso"
                      ? "bg-rose-600 text-white font-black shadow-xs"
                      : "bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                  }`}
                >
                  - Egresos / Gastos
                </button>

                <span className="text-slate-600">|</span>

                {/* Régimen de Facturación */}
                <button
                  onClick={() => { setFilterRegimen("factura"); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    filterRegimen === "factura"
                      ? "bg-sky-600 text-white font-black"
                      : "bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20"
                  }`}
                >
                  📄 Solo con Factura (F29)
                </button>
                <button
                  onClick={() => { setFilterRegimen("proyecto_factura"); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    filterRegimen === "proyecto_factura"
                      ? "bg-emerald-600 text-white font-black"
                      : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                  }`}
                  title="Gastos asociados a proyectos con factura (Crédito Fiscal IVA)"
                >
                  🛡️ Gastos Proy. con Factura
                </button>
                <button
                  onClick={() => { setFilterRegimen("hitos_proyecto"); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    filterRegimen === "hitos_proyecto"
                      ? "bg-indigo-600 text-white font-black"
                      : "bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                  }`}
                >
                  💼 Hitos de Proyectos
                </button>
                <button
                  onClick={() => { setFilterRegimen("sin_factura"); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    filterRegimen === "sin_factura"
                      ? "bg-slate-700 text-white font-black"
                      : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  Sin Factura / Boletas
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                Mostrando {transaccionesFiltradas.length} transacciones
              </span>
            </div>
          </div>

          {/* TABLA DE MOVIMIENTOS & FACTURACIÓN */}
          <div className="rounded-lg border border-white/10 bg-card overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 select-none">
                    <th 
                      onClick={() => handleSort("fecha")} 
                      className="py-3 px-3.5 font-bold cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Fecha</span>
                        {sortField === "fecha" ? (
                          sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort("concepto")} 
                      className="py-3 px-3.5 font-bold cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Concepto / Transacción</span>
                        {sortField === "concepto" ? (
                          sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort("proyecto")} 
                      className="py-3 px-3.5 font-bold cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Proyecto / Cliente</span>
                        {sortField === "proyecto" ? (
                          sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>

                    <th className="py-3 px-3.5 font-bold">Comprobante / DTE</th>

                    <th 
                      onClick={() => handleSort("neto")} 
                      className="py-3 px-3.5 font-bold text-right cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Neto</span>
                        {sortField === "neto" ? (
                          sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort("iva")} 
                      className="py-3 px-3.5 font-bold text-right cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>IVA 19%</span>
                        {sortField === "iva" ? (
                          sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort("monto")} 
                      className="py-3 px-3.5 font-bold text-right cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Total Bruto</span>
                        {sortField === "monto" ? (
                          sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort("estado")} 
                      className="py-3 px-3.5 font-bold text-center cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Estado</span>
                        {sortField === "estado" ? (
                          sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />
                        ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>

                    <th className="py-3 px-3.5 font-bold text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Cargando transacciones y sincronizando hitos de proyectos...
                      </td>
                    </tr>
                  ) : transaccionesPaginadas.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No se encontraron movimientos financieros con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    transaccionesPaginadas.map((item) => {
                      const isIngreso = item.tipo === "ingreso";
                      const total = item.montoTotal ?? item.monto ?? 0;

                      const cLower = (item.concepto || "").toLowerCase();
                      const esSaldoInicial = 
                        (item.categoria as string) === "saldo_inicial" ||
                        cLower.includes("saldo inicial") ||
                        cLower.includes("caja inicial") ||
                        cLower.includes("aporte de capital") ||
                        cLower.includes("ingreso inicial") ||
                        item.tipoComprobante === "sin_comprobante" ||
                        item.aplicaFactura === false;

                      const tieneFactura = !esSaldoInicial && Boolean(
                        (item.numeroFactura && item.numeroFactura.trim().length > 0) ||
                        item.tipoComprobante === "factura" ||
                        (item.aplicaFactura === true && item.tipoComprobante !== "sin_comprobante" && item.tipoComprobante !== "boleta")
                      );

                      const tieneProyecto = Boolean((item.proyectoId && item.proyectoId !== "ninguno") || item.referenciaId);
                      const esGastoDeducible = !isIngreso && tieneProyecto && tieneFactura && item.deducibleIva !== false;

                      // Si no tiene factura (o es saldo inicial), no hay débito ni crédito fiscal: neto = total e iva = 0
                      const neto = (tieneFactura || esGastoDeducible)
                        ? (item.montoNeto ?? Math.round(total / (1 + IVA_TASA_CHILE)))
                        : total;
                      const iva = (tieneFactura || esGastoDeducible)
                        ? (item.ivaMonto ?? (total - neto))
                        : 0;

                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Fecha */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                              <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{item.fechaVencimiento || item.fechaPago || "—"}</span>
                            </div>
                          </td>

                          {/* Concepto & Tipo */}
                          <td className="py-3 px-3.5 max-w-[240px]">
                            <div className="space-y-0.5">
                              <span className="font-bold text-white block truncate" title={item.concepto}>
                                {item.concepto}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                                  isIngreso ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                }`}>
                                  {isIngreso ? "Ingreso" : "Egreso"}
                                </span>
                                {item.isProjectHito && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold">
                                    Hito Proyecto
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Proyecto / Cliente */}
                          <td className="py-3 px-3.5 max-w-[180px] truncate">
                            {item.proyectoNombre ? (
                              <div className="space-y-0.5">
                                <span className="text-indigo-300 font-bold block truncate" title={item.proyectoNombre}>
                                  {item.proyectoNombre}
                                </span>
                                <span className="text-slate-400 text-[10px] block truncate">
                                  {item.clienteNombre || item.razonSocialContraparte || "Cliente"}
                                </span>
                              </div>
                            ) : item.referenciaNombre ? (
                              <span className="text-slate-300 font-medium truncate block">
                                {item.referenciaNombre}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">Gasto General</span>
                            )}
                          </td>

                          {/* Comprobante / N° Factura */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {item.numeroFactura ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                                  <Receipt className="w-3 h-3 text-sky-400" />
                                  Factura #{item.numeroFactura}
                                </span>
                                {esGastoDeducible && (
                                  <span className="text-[9px] text-emerald-400 font-bold block">
                                    ✓ Deducible IVA F29
                                  </span>
                                )}
                              </div>
                            ) : esSaldoInicial ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                💰 Saldo Inicial (No Gravado)
                              </span>
                            ) : item.tipoComprobante === "boleta" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-white/10">
                                Boleta
                              </span>
                            ) : item.tipoComprobante === "sin_comprobante" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-white/5 text-slate-400 border border-white/10">
                                Sin Factura
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenInvoiceModal(item)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                              >
                                + Asignar Factura
                              </button>
                            )}
                          </td>

                          {/* Neto */}
                          <td className="py-3 px-3.5 text-right font-mono text-slate-300 font-medium whitespace-nowrap">
                            {formatCLP(neto)}
                          </td>

                          {/* IVA 19% */}
                          <td className="py-3 px-3.5 text-right font-mono whitespace-nowrap">
                            {iva > 0 ? (
                              <span className={isIngreso ? "text-sky-400 font-bold" : "text-emerald-400 font-bold"}>
                                {isIngreso ? "+" : "-"}{formatCLP(iva)}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Total Bruto */}
                          <td className="py-3 px-3.5 text-right font-mono font-black whitespace-nowrap">
                            <span className={isIngreso ? "text-emerald-400" : "text-rose-400"}>
                              {isIngreso ? "+" : "-"}{formatCLP(total)}
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleEstado(item)}
                              className="cursor-pointer"
                              title="Clic para cambiar estado"
                            >
                              {item.estado === "cobrado" || item.estado === "pagado" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  {isIngreso ? "Cobrado" : "Pagado"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  Pendiente
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {/* Ver Detalles */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDetail(item)}
                                className="h-7 w-7 p-0 text-slate-300 hover:text-white hover:bg-white/10 rounded"
                                title="Ver detalles completos"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>

                              {/* Asignar / Editar Factura */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenInvoiceModal(item)}
                                className="h-7 w-7 p-0 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded"
                                title="Asignar o editar factura"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </Button>

                              {/* Eliminar (solo si es registro manual de caja, no hitos ni suscripciones virtuales) */}
                              {!item.isProjectHito && !item.id?.startsWith("sub-") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteItem(item)}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                                  title="Eliminar movimiento"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* BARRA DE PAGINACIÓN */}
            <div className="p-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <span>Registros por página:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-white/15 text-white rounded px-2 py-1 text-xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>
                  Página {currentPage} de {totalPages} ({transaccionesFiltradas.length} resultados)
                </span>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2.5 text-xs bg-white/5 border-white/15 text-white rounded disabled:opacity-40"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2.5 text-xs bg-white/5 border-white/15 text-white rounded disabled:opacity-40"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. CONTENIDO: PESTAÑA 2 - LIQUIDACIÓN TRIBUTARIA F29 (SII) */}
      {activeTab === "tributario" && (() => {
        const periodoSeleccionado = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
        const mesActualNum = today.getMonth() + 1;
        const anioActualNum = today.getFullYear();
        const esMesActual = selectedYear === anioActualNum && selectedMonth === mesActualNum;
        const esMesPasado = selectedYear < anioActualNum || (selectedYear === anioActualNum && selectedMonth < mesActualNum);
        const declaracionPeriodo = declaracionesF29.find((d) => d.periodo === periodoSeleccionado);
        const nombreMesActual = NOMBRES_MESES[selectedMonth - 1];
        const nombreMesSiguiente = NOMBRES_MESES[selectedMonth % 12];

        // Detección del mes vencido inmediatamente anterior para contexto cruzado
        let mesPrevNum = mesActualNum - 1;
        let anioPrevNum = anioActualNum;
        if (mesPrevNum === 0) {
          mesPrevNum = 12;
          anioPrevNum -= 1;
        }
        const periodoMesPrev = `${anioPrevNum}-${String(mesPrevNum).padStart(2, "0")}`;
        const nombreMesPrev = NOMBRES_MESES[mesPrevNum - 1];
        const declaracionMesPrev = declaracionesF29.find((d) => d.periodo === periodoMesPrev);

        return (
          <div className="space-y-6">
            <div className="p-5 rounded-lg bg-card border border-white/10 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-400" />
                    Liquidación Estimada Formulario 29 (F29 SII Chile)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Período consultado: <strong className="text-white">{nombreMesActual} {selectedYear}</strong>. 
                    {esMesActual && " (Mes en curso — Proyección en tiempo real)"}
                  </p>
                </div>

                <Button
                  onClick={() => openCreateEgreso(true)}
                  className="h-8.5 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Registrar Gasto Proyecto con Factura
                </Button>
              </div>

              {/* PANEL DE ESTADO TRIBUTARIO DEL PERÍODO */}
              <div className={`p-4 rounded-lg border transition-all ${
                esMesPasado
                  ? declaracionPeriodo
                    ? "bg-emerald-950/20 border-emerald-500/40"
                    : "bg-amber-950/25 border-amber-500/40"
                  : esMesActual
                  ? "bg-sky-950/20 border-sky-500/40"
                  : "bg-slate-950/40 border-white/10"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {esMesPasado ? (
                      declaracionPeriodo ? (
                        <div className="w-8 h-8 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4.5 h-4.5" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                          <AlertTriangle className="w-4.5 h-4.5" />
                        </div>
                      )
                    ) : esMesActual ? (
                      <div className="w-8 h-8 rounded-md bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
                        <Clock className="w-4.5 h-4.5" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                        <Calendar className="w-4.5 h-4.5" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          Estado F29 Período {nombreMesActual} {selectedYear}
                        </span>

                        {esMesPasado ? (
                          declaracionPeriodo ? (
                            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold">
                              ✓ Declarado ante el SII
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px] font-bold">
                              ⚠️ Pendiente de Declaración
                            </Badge>
                          )
                        ) : esMesActual ? (
                          <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-300 text-[10px] font-bold">
                            ⏳ Período en Curso (Proyección Activa)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-white/20 text-slate-400 text-[10px]">
                            Período Futuro
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-slate-300">
                        {esMesPasado ? (
                          declaracionPeriodo ? (
                            <span>
                              Declarado formalmente el <strong className="text-white">{declaracionPeriodo.fechaDeclaracion}</strong>
                              {declaracionPeriodo.folioSII && ` • Folio SII #${declaracionPeriodo.folioSII}`}
                              {declaracionPeriodo.sinMovimiento ? " • Sin Movimiento ($0)" : ` • Monto pagado: ${formatCLP(declaracionPeriodo.montoPagado)}`}
                              {declaracionPeriodo.notas && ` • "${declaracionPeriodo.notas}"`}
                            </span>
                          ) : (
                            <span>
                              Período fiscal cerrado. Plazo de presentación: hasta el 20 de {nombreMesSiguiente}. 
                              {metricas.ventasFacturadasPeriodo.total === 0 
                                ? " Sin ventas: recuerda declarar sin movimiento ($0) para evitar multas." 
                                : ` Provisión estimada: ${formatCLP(metricas.f29Neto)}.`}
                            </span>
                          )
                        ) : esMesActual ? (
                          <span>
                            El IVA opera estrictamente a <strong>mes vencido</strong>. Todo lo facturado y comprado en {nombreMesActual} se acumula hasta el último día del mes y se declarará entre el 10 y el 20 de {nombreMesSiguiente}. <strong className="text-sky-300">No puede marcarse como emitido de manera anticipada.</strong>
                          </span>
                        ) : (
                          <span>Período fiscal posterior no iniciado.</span>
                        )}
                      </p>

                      {/* Notificación de contexto si estamos en el mes en curso (ej. Octubre) respecto al mes vencido (ej. Septiembre) */}
                      {esMesActual && (
                        <div className="pt-2 mt-1 border-t border-sky-500/20 text-[11px] flex flex-wrap items-center gap-2">
                          <span className="text-slate-400">Estado del mes vencido ({nombreMesPrev}):</span>
                          {declaracionMesPrev ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> F29 de {nombreMesPrev} declarado al día ante el SII.
                            </span>
                          ) : (
                            <span className="text-amber-300 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> F29 de {nombreMesPrev} pendiente de emitir (vence el 20 de {nombreMesActual}).
                            </span>
                          )}
                          {!declaracionMesPrev && (
                            <Button
                              size="sm"
                              variant="link"
                              onClick={() => {
                                setSelectedYear(anioPrevNum);
                                setSelectedMonth(mesPrevNum);
                              }}
                              className="h-auto p-0 text-amber-300 hover:text-amber-200 underline text-[11px]"
                            >
                              Ir a declarar {nombreMesPrev} →
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Botón 1: Si es mes pasado no declarado, permite marcar como emitido */}
                    {esMesPasado && !declaracionPeriodo && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleOpenDeclareF29(
                            periodoSeleccionado,
                            `${nombreMesActual} ${selectedYear}`,
                            metricas.f29Neto,
                            metricas.ventasFacturadasPeriodo.total === 0
                          )
                        }
                        className="h-8.5 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/30"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Marcar F29 {nombreMesActual} como Declarado
                      </Button>
                    )}

                    {/* Botón 2: Si es mes pasado ya declarado, permite desmarcar */}
                    {esMesPasado && declaracionPeriodo && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUnmarkDeclareF29(periodoSeleccionado, `${nombreMesActual} ${selectedYear}`)}
                        className="h-8 px-2.5 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-xs"
                      >
                        Desmarcar Declaración
                      </Button>
                    )}

                    {/* Botón 3: Si es mes actual, botón bloqueado para impedir emitir anticipadamente */}
                    {esMesActual && (
                      <Button
                        disabled
                        variant="outline"
                        className="h-8.5 px-3 rounded-md bg-white/5 border-white/10 text-slate-400 text-xs font-semibold gap-1.5 cursor-not-allowed opacity-60"
                        title="Solo se puede declarar el F29 de meses ya vencidos una vez que concluye su facturación"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        Marcar Emitido (Bloqueado: Mes en curso)
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Desglose en 2 Columnas: Ventas vs Compras Deducibles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bloque A: Ventas Afectas a IVA (Débito Fiscal) */}
                <div className="p-4 rounded-lg bg-slate-950/70 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="text-xs font-black uppercase text-sky-400 flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4" /> 1. Ventas & Facturas Emitidas
                    </span>
                    <Badge variant="outline" className="border-sky-500/40 text-sky-300 text-[10px]">
                      IVA Débito Fiscal
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Ventas Netas Afectas:</span>
                      <span className="font-mono font-bold text-white">{formatCLP(metricas.ventasFacturadasPeriodo.neto)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Tasa IVA Débito (19%):</span>
                      <span className="font-mono font-bold text-sky-400">+{formatCLP(metricas.ventasFacturadasPeriodo.iva)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 font-bold pt-1.5">
                      <span className="text-slate-300">Total Facturado Bruto:</span>
                      <span className="font-mono text-white text-sm">{formatCLP(metricas.ventasFacturadasPeriodo.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Bloque B: Gastos de Proyecto con Factura (Crédito Fiscal) */}
                <div className="p-4 rounded-lg bg-slate-950/70 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                      <ArrowDownRight className="w-4 h-4" /> 2. Gastos de Proyectos con Factura
                    </span>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[10px]">
                      IVA Crédito Fiscal
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Compras Netas Deducibles:</span>
                      <span className="font-mono font-bold text-white">{formatCLP(metricas.gastosProyectoConFacturaPeriodo.neto)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Crédito Fiscal IVA (19%):</span>
                      <span className="font-mono font-bold text-emerald-400">-{formatCLP(metricas.gastosProyectoConFacturaPeriodo.iva)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 font-bold pt-1.5">
                      <span className="text-slate-300">Crédito para rebajar impuesto:</span>
                      <span className="font-mono text-emerald-300 text-sm">{formatCLP(metricas.gastosProyectoConFacturaPeriodo.iva)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen Final de Conciliación F29 */}
              <div className="p-5 rounded-lg bg-gradient-to-r from-slate-900 to-slate-950 border border-amber-500/30 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                    3. Resultado Neto Liquidación F29 {esMesActual ? "(Proyección Activa)" : ""}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {esMesActual 
                      ? `Facturación de ${nombreMesActual} vence el 20 de ${nombreMesSiguiente}` 
                      : `IVA a mes vencido: período ${nombreMesActual} vence el 20 de ${nombreMesSiguiente}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block">IVA a Pagar (Débito - Crédito):</span>
                    <p className="text-base font-mono font-bold text-white">{formatCLP(metricas.ivaAPagar)}</p>
                    {metricas.remanenteAFavor > 0 && (
                      <span className="text-[10px] text-emerald-400 font-bold block">
                        Remanente a favor: {formatCLP(metricas.remanenteAFavor)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block">PPM (0.25% sobre ventas netas):</span>
                    <p className="text-base font-mono font-bold text-white">{formatCLP(metricas.ppm)}</p>
                    <span className="text-[10px] text-slate-500 block">Pago Provisional Mensual obligatorio</span>
                  </div>

                  <div className="space-y-1 sm:text-right">
                    <span className="text-[11px] uppercase font-bold text-amber-400 block">
                      {esMesActual ? "F29 Proyectado a Pagar:" : "Total Estimado F29:"}
                    </span>
                    <p className="text-xl font-mono font-black text-amber-400">{formatCLP(metricas.f29Neto)}</p>
                    <span className="text-[10px] text-slate-400 block">
                      Vencimiento electrónico: 20 de {nombreMesSiguiente}
                    </span>
                  </div>
                </div>

                {/* Recordatorio o Proyección */}
                {esMesActual ? (
                  <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-200 text-xs flex items-start gap-2.5 mt-2">
                    <Scale className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
                    <div>
                      <strong className="block text-sky-300 font-bold">Proyección activa del mes en curso (Pago en {nombreMesSiguiente}):</strong>
                      <span>
                        Las ventas de {nombreMesActual} continúan acumulándose hasta el fin de mes. El monto estimado a pagar de F29 ({formatCLP(metricas.f29Neto)}) se liquidará del 10 al 20 de {nombreMesSiguiente}. Se actualiza en tiempo real con cada factura y gasto deducible registrado.
                      </span>
                    </div>
                  </div>
                ) : metricas.ventasFacturadasPeriodo.total === 0 ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 mt-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <strong className="block text-amber-300 font-bold">Sin facturación en este período:</strong>
                      <span>
                        El pago de IVA opera estrictamente a mes vencido. Aunque no hayas emitido facturas en {nombreMesActual}, 
                        es <strong>obligatorio completar y declarar el F29 sin movimiento</strong> ante el SII antes del 20 de {nombreMesSiguiente} para evitar multas e infracciones tributarias.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-200 text-xs flex items-start gap-2.5 mt-2">
                    <Scale className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
                    <div>
                      <strong className="block text-sky-300 font-bold">Pago a mes vencido:</strong>
                      <span>
                        Todo lo facturado durante {nombreMesActual} (hasta el último día del mes) se liquida y paga en el SII entre el 10 y el 20 de {nombreMesSiguiente}. Monto provisión: <strong>{formatCLP(metricas.f29Neto)}</strong>.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 7. CONTENIDO: PESTAÑA 3 - SERVICIOS RECURRENTES & INFRAESTRUCTURA (CONECTADO AL MÓDULO SUSCRIPCIONES) */}
      {activeTab === "costos" && (() => {
        let ingresosRecurrentesCLP = 0;
        let egresosRecurrentesCLP = 0;

        suscripciones.forEach((s) => {
          if (s.estado === "pausado" || s.estado === "suspendido") return;
          const monto = s.montoEstimadoMensualCLP || (s.moneda === "CLP" ? s.monto : 0) || 0;
          const esCliente = s.tipoRecurrencia === "cliente_ingreso" || Boolean(s.clienteId);
          if (esCliente) {
            ingresosRecurrentesCLP += monto;
          } else {
            egresosRecurrentesCLP += monto;
          }
        });

        const mrrNetoCLP = ingresosRecurrentesCLP - egresosRecurrentesCLP;
        const activasCount = suscripciones.filter((s) => s.estado === "activo" || s.estado === "por_vencer" || !s.estado).length;

        return (
          <div className="space-y-5">
            {/* Cabecera & Conexión al módulo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-lg bg-card border border-white/10 shadow-lg">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-indigo-400" />
                  Servicios Recurrentes, Mantenciones & Infraestructura
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cruce automático de ingresos por mantención a clientes (+MRR) y egresos de servidores/dominios/SaaS en tiempo real.
                </p>
              </div>
              <Button
                onClick={() => router.push("/suscripciones")}
                className="h-8.5 px-3.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5 shrink-0 shadow-md shadow-indigo-600/30"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Gestionar en Módulo de Suscripciones
              </Button>
            </div>

            {/* Resumen Métrico de Suscripciones Conectadas */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-lg bg-slate-950/70 border border-emerald-500/30 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400">Ingresos Recurrentes (Clientes)</span>
                <p className="text-xl font-mono font-black text-emerald-400">+{formatCLP(ingresosRecurrentesCLP)} <span className="text-xs font-sans text-slate-400">CLP/m</span></p>
                <span className="text-[10px] text-slate-400">Mantenciones web & soporte contratado</span>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/70 border border-rose-500/30 space-y-1">
                <span className="text-[10px] uppercase font-bold text-rose-400">Costos Fijos Infraestructura</span>
                <p className="text-xl font-mono font-black text-rose-300">-{formatCLP(egresosRecurrentesCLP)} <span className="text-xs font-sans text-slate-400">CLP/m</span></p>
                <span className="text-[10px] text-slate-400">Hosting, servidores cloud, dominios & SaaS</span>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/70 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-indigo-400">Margen Recurrente Neto (MRR)</span>
                <p className={`text-xl font-mono font-black ${mrrNetoCLP >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatCLP(mrrNetoCLP)} <span className="text-xs font-sans text-slate-400">CLP/m</span>
                </p>
                <span className="text-[10px] text-indigo-300">Balance operativo neto mensual</span>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/70 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Servicios Activos & En Monitoreo</span>
                <p className="text-xl font-mono font-black text-slate-200">{activasCount} de {suscripciones.length}</p>
                <span className="text-[10px] text-slate-400">Clientes + Infraestructura propia</span>
              </div>
            </div>

            {/* Grilla de Suscripciones Reales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {suscripciones.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 bg-card rounded-lg border border-white/10 space-y-3">
                  <p className="text-sm">No hay servicios recurrentes registrados en el sistema.</p>
                  <Button
                    onClick={() => router.push("/suscripciones")}
                    variant="outline"
                    className="h-8 px-3 rounded-md bg-white/5 border-white/15 text-white text-xs font-bold gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar Primer Servicio en /suscripciones
                  </Button>
                </div>
              ) : (
                suscripciones.map((sub) => {
                  const montoMensual = sub.montoEstimadoMensualCLP || (sub.moneda === "CLP" ? sub.monto : 0);
                  const esCliente = sub.tipoRecurrencia === "cliente_ingreso" || Boolean(sub.clienteId);

                  return (
                    <Card key={sub.id || sub.nombre} className="bg-card border-white/10 rounded-lg p-4 space-y-3 shadow-md flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-black text-white truncate" title={sub.nombre}>
                            {sub.nombre}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-bold shrink-0 ${
                              esCliente 
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" 
                                : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                            }`}
                          >
                            {esCliente ? (sub.clienteNombre || "Cliente") : (sub.proveedor || "Infraestructura")}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                          <span className="capitalize">{sub.categoria?.replace(/_/g, " ") || "Recurrente"}</span>
                          <span>&bull;</span>
                          <span className="capitalize">{sub.cicloFacturacion || "Mensual"}</span>
                          {sub.tarjetaOCuenta && (
                            <>
                              <span>&bull;</span>
                              <span className="text-slate-300 truncate max-w-[120px]">{sub.tarjetaOCuenta}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">
                            {esCliente ? "Cobro Mensual" : "Costo Mensual"}
                          </span>
                          <p className={`text-sm font-mono font-bold ${esCliente ? "text-emerald-400" : "text-white"}`}>
                            {esCliente ? "+" : "-"}{formatCLP(sub.monto)} {sub.moneda || "CLP"}
                          </p>
                          {sub.moneda !== "CLP" && montoMensual > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ≈ {formatCLP(montoMensual)} CLP/mes
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {sub.enlaceGestion && (
                            <a
                              href={sub.enlaceGestion}
                              target="_blank"
                              rel="noreferrer"
                              className="h-7 w-7 rounded bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white"
                              title="Abrir panel"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/suscripciones")}
                            className="h-7 px-2 text-[11px] text-indigo-300 hover:text-indigo-200"
                            title="Ver en módulo de suscripciones"
                          >
                            Ver detalle →
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL 1: ASIGNAR / EDITAR FACTURA A UN HITO O MOVIMIENTO */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[460px] max-h-[92vh] overflow-y-auto bg-slate-950 border border-white/15 text-slate-100 rounded-lg shadow-2xl p-4 sm:p-6">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-white">Asignar Factura (DTE)</DialogTitle>
                <p className="text-xs text-slate-400">Imputación oficial para IVA Débito o Crédito Fiscal F29</p>
              </div>
            </div>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 pt-1">
              {/* Resumen del movimiento */}
              <div className="p-3 rounded-md bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-xs font-bold text-white block truncate">{selectedItem.concepto}</span>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Monto: <strong className="text-white">{formatCLP(selectedItem.montoTotal ?? selectedItem.monto)} CLP</strong></span>
                  <span>Neto: {formatCLP(selectedItem.montoNeto ?? Math.round((selectedItem.montoTotal ?? selectedItem.monto) / 1.19))}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">N° de Factura DTE *</Label>
                  <Input
                    value={invNumero}
                    onChange={(e) => setInvNumero(e.target.value)}
                    placeholder="Ej: 1045"
                    className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Fecha de Emisión *</Label>
                  <Input
                    type="date"
                    value={invFecha}
                    onChange={(e) => setInvFecha(e.target.value)}
                    className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">RUT Contraparte</Label>
                  <Input
                    value={invRut}
                    onChange={(e) => setInvRut(e.target.value)}
                    placeholder="76.123.456-7"
                    className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Razón Social</Label>
                  <Input
                    value={invRazonSocial}
                    onChange={(e) => setInvRazonSocial(e.target.value)}
                    placeholder="Empresa Mandante / Proveedor"
                    className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="marcarCobradoCheck"
                  checked={invMarcarCobrado}
                  onChange={(e) => setInvMarcarCobrado(e.target.checked)}
                  className="rounded border-white/20 bg-slate-900 h-4 w-4 text-emerald-600 focus:ring-0"
                />
                <label htmlFor="marcarCobradoCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Marcar movimiento como {selectedItem.tipo === "ingreso" ? "Cobrado / Pagado conforme" : "Pagado"}
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-white/10 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="bg-white/5 border-white/15 text-slate-300 text-xs h-9 rounded-md"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveInvoiceAssignment}
              disabled={isSavingInvoice || !invNumero.trim()}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs h-9 rounded-md px-4 gap-1.5"
            >
              {isSavingInvoice ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Guardar Factura & Sincronizar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: REGISTRAR NUEVO MOVIMIENTO FINANCIERO */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[92vh] overflow-y-auto bg-slate-950 border border-white/15 text-slate-100 rounded-lg shadow-2xl p-4 sm:p-6">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-white">Registrar Movimiento Financiero</DialogTitle>
                <p className="text-xs text-slate-400">Ingreso de venta o egreso con desglose tributario</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Toggle Tipo: Ingreso vs Egreso */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-md border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setNuevoTipo("ingreso");
                  setNuevaCategoria("cobro_proyecto");
                  setNuevoTipoComprobante("factura");
                  setAplicaFactura(true);
                  if (nuevoEstado === "pagado") setNuevoEstado("cobrado");
                  if (montoTotal > 0) {
                    const n = Math.round(montoTotal / (1 + IVA_TASA_CHILE));
                    setMontoNeto(n);
                    setIvaMonto(montoTotal - n);
                  }
                }}
                className={`py-1.5 text-xs font-black rounded transition-all cursor-pointer ${
                  nuevoTipo === "ingreso"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                + Ingreso / Cobro
              </button>
              <button
                type="button"
                onClick={() => {
                  setNuevoTipo("egreso");
                  setNuevaCategoria("gasto_operativo");
                  setNuevoTipoComprobante("factura");
                  setAplicaFactura(true);
                  if (nuevoEstado === "cobrado") setNuevoEstado("pagado");
                  if (montoTotal > 0) {
                    const n = Math.round(montoTotal / (1 + IVA_TASA_CHILE));
                    setMontoNeto(n);
                    setIvaMonto(montoTotal - n);
                  }
                }}
                className={`py-1.5 text-xs font-black rounded transition-all cursor-pointer ${
                  nuevoTipo === "egreso"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                - Egreso / Gasto
              </button>
            </div>

            {/* Categoría Financiera */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Categoría Financiera *</Label>
              <Select value={nuevaCategoria} onValueChange={(val: any) => setNuevaCategoria(val)}>
                <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/15 text-white">
                  {nuevoTipo === "egreso" ? (
                    <>
                      <SelectItem value="gasto_operativo" className="text-xs">Gasto Operativo General (Insumos, compras, varios)</SelectItem>
                      <SelectItem value="renovacion_infraestructura" className="text-xs">Infraestructura, Servidores & Software (Hosting, SaaS, dominios)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="cobro_proyecto" className="text-xs">Cobro de Proyecto / Hito de Desarrollo</SelectItem>
                      <SelectItem value="recurrente_cliente" className="text-xs">Cobro Recurrente (Mantención mensual, soporte)</SelectItem>
                      <SelectItem value="saldo_inicial" className="text-xs">Saldo Inicial de Caja / Aporte de Capital</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Concepto */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Concepto / Glosa *</Label>
              <Input
                value={nuevoConcepto}
                onChange={(e) => setNuevoConcepto(e.target.value)}
                placeholder={nuevoTipo === "egreso" ? "Ej: Servidores cloud, licencias IDE, insumos oficina..." : "Ej: Desarrollo web hito 1, mantención mensual..."}
                className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md"
              />
            </div>

            {/* Proyecto Asociado */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Proyecto Asociado</span>
                <span className="text-[10px] text-indigo-300 italic">Requerido para deducir IVA en gastos</span>
              </Label>
              <Select value={nuevoProyectoId} onValueChange={(val) => setNuevoProyectoId(val || "ninguno")}>
                <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/15 text-white">
                  <SelectItem value="ninguno" className="text-xs">Sin Proyecto Asociado (Gasto General)</SelectItem>
                  {proyectos.map((p) => (
                    <SelectItem key={p.id} value={p.id!} className="text-xs">
                      {p.nombre} ({p.clienteNombre})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Comprobante & N° Factura */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Tipo de Comprobante</Label>
                <Select
                  value={nuevoTipoComprobante}
                  onValueChange={(val: any) => {
                    setNuevoTipoComprobante(val);
                    const isFactura = val === "factura";
                    setAplicaFactura(isFactura);
                    if (!isFactura) {
                      setIvaMonto(0);
                      setMontoNeto(montoTotal || nuevoMonto);
                    } else if (montoTotal > 0) {
                      const n = Math.round(montoTotal / (1 + IVA_TASA_CHILE));
                      setMontoNeto(n);
                      setIvaMonto(montoTotal - n);
                    }
                  }}
                >
                  <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    <SelectItem value="factura" className="text-xs font-bold text-sky-400">Factura (Afecta a IVA)</SelectItem>
                    <SelectItem value="boleta" className="text-xs">Boleta de Honorarios / Venta</SelectItem>
                    <SelectItem value="honorarios" className="text-xs">Boleta de Honorarios</SelectItem>
                    <SelectItem value="sin_comprobante" className="text-xs text-slate-400">Sin Factura / Saldo Inicial / Traspaso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">N° de Factura (DTE)</Label>
                <Input
                  value={nuevoNumeroFactura}
                  onChange={(e) => setNuevoNumeroFactura(e.target.value)}
                  placeholder="Ej: 1045"
                  className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md font-mono font-bold"
                />
              </div>
            </div>

            {/* Montos y Desglose de IVA */}
            <div className="p-3 rounded-md bg-white/[0.02] border border-white/10 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide block">
                Valores Financieros & Tributarios
              </span>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-400">Monto Neto</Label>
                  <Input
                    type="number"
                    value={montoNeto || ""}
                    onChange={(e) => handleNetoInput(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-slate-900 border-white/15 text-white text-xs h-8 rounded-md font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-400">IVA (19%)</Label>
                  <Input
                    type="number"
                    value={ivaMonto || ""}
                    readOnly
                    className="bg-slate-950 border-white/15 text-sky-400 font-bold text-xs h-8 rounded-md font-mono cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-400">Total Bruto *</Label>
                  <Input
                    type="number"
                    value={montoTotal || ""}
                    onChange={(e) => handleTotalInput(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-slate-900 border-white/15 text-emerald-400 font-bold text-xs h-8 rounded-md font-mono"
                  />
                </div>
              </div>

              {nuevoTipo === "egreso" && (
                <div className="text-[11px] text-slate-400 pt-1">
                  {nuevoProyectoId !== "ninguno" && nuevoTipoComprobante === "factura" ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Generará Crédito Fiscal IVA deducible en F29.
                    </span>
                  ) : (
                    <span className="text-amber-400 italic">
                      ⚠️ No deducible de IVA (Solo los gastos asociados a proyectos con factura computan para el crédito fiscal).
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Fechas & Estado */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Fecha de Vencimiento / Pago</Label>
                <Input
                  type="date"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                  className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Estado Inicial</Label>
                <Select value={nuevoEstado} onValueChange={(val: any) => setNuevoEstado(val)}>
                  <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    {nuevoTipo === "egreso" ? (
                      <>
                        <SelectItem value="pagado" className="text-xs text-emerald-400">Pagado al Proveedor</SelectItem>
                        <SelectItem value="pendiente" className="text-xs text-amber-300">Pendiente de Pago</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="cobrado" className="text-xs text-emerald-400">Cobrado / Recibido</SelectItem>
                        <SelectItem value="pendiente" className="text-xs text-amber-300">Pendiente de Cobro</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="bg-white/5 border-white/15 text-slate-300 text-xs h-9 rounded-md"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateMovement}
              disabled={isSavingMovement || (montoTotal <= 0 && nuevoMonto <= 0) || !nuevoConcepto.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-9 rounded-md px-4 gap-1.5"
            >
              {isSavingMovement ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Registrar Transacción
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: VER DETALLES DE TRANSACCIÓN */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[480px] max-h-[92vh] overflow-y-auto bg-slate-950 border border-white/15 text-slate-100 rounded-lg shadow-2xl p-4 sm:p-6">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-white">Detalle de Transacción</DialogTitle>
                <p className="text-xs text-slate-400">Trazabilidad comercial y contable</p>
              </div>
            </div>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 pt-1 text-xs">
              <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    selectedItem.tipo === "ingreso"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  }`}>
                    {selectedItem.tipo}
                  </span>
                  <span className="font-mono text-slate-400">
                    Fecha: {selectedItem.fechaVencimiento || selectedItem.fechaPago || "—"}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white pt-1">{selectedItem.concepto}</h4>

                {selectedItem.proyectoNombre && (
                  <p className="text-slate-300">
                    Proyecto: <strong className="text-indigo-300">{selectedItem.proyectoNombre}</strong>
                  </p>
                )}

                {(selectedItem.clienteNombre || selectedItem.razonSocialContraparte) && (
                  <p className="text-slate-400">
                    Contraparte: {selectedItem.clienteNombre || selectedItem.razonSocialContraparte}
                    {(selectedItem.clienteRut || selectedItem.rutContraparte) && (
                      <span className="font-mono"> (RUT: {selectedItem.clienteRut || selectedItem.rutContraparte})</span>
                    )}
                  </p>
                )}
              </div>

              {/* Desglose Tributario */}
              <div className="p-3.5 rounded-md bg-slate-900/60 border border-white/10 space-y-2 font-mono">
                <div className="flex justify-between py-1 border-b border-white/5 text-slate-300">
                  <span>Monto Neto:</span>
                  <span>{formatCLP(selectedItem.montoNeto ?? Math.round((selectedItem.montoTotal ?? selectedItem.monto) / 1.19))}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5 text-sky-400 font-bold">
                  <span>IVA 19%:</span>
                  <span>{formatCLP(selectedItem.ivaMonto ?? ((selectedItem.montoTotal ?? selectedItem.monto) - Math.round((selectedItem.montoTotal ?? selectedItem.monto) / 1.19)))}</span>
                </div>
                <div className="flex justify-between py-1.5 font-black text-white text-sm">
                  <span>Total Bruto:</span>
                  <span className={selectedItem.tipo === "ingreso" ? "text-emerald-400" : "text-rose-400"}>
                    {formatCLP(selectedItem.montoTotal ?? selectedItem.monto)} CLP
                  </span>
                </div>
              </div>

              {/* Estado de Facturación */}
              <div className="p-3 rounded-md bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="font-bold text-slate-300">Comprobante Tributario:</span>
                {selectedItem.numeroFactura ? (
                  <span className="font-mono font-bold text-sky-300 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30">
                    Factura #{selectedItem.numeroFactura}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Sin Factura Asociada</span>
                )}
              </div>

              {selectedItem.notas && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-400 text-[11px]">Notas adicionales:</span>
                  <p className="text-slate-300 bg-white/[0.02] p-2.5 rounded border border-white/5">{selectedItem.notas}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-white/10 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDetailOpen(false)}
              className="bg-white/5 border-white/15 text-slate-300 text-xs h-9 rounded-md"
            >
              Cerrar
            </Button>
            {selectedItem && (
              <Button
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenInvoiceModal(selectedItem);
                }}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs h-9 rounded-md px-4 gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                {selectedItem.numeroFactura ? "Editar Factura" : "Asignar Factura"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: MARCAR F29 COMO DECLARADO ANTE EL SII */}
      <Dialog open={isDeclareF29Open} onOpenChange={setIsDeclareF29Open}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto bg-slate-950 border border-white/15 text-slate-100 rounded-lg shadow-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Marcar F29 como Declarado ante el SII
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Registra la presentación oficial del Formulario 29 ante el Servicio de Impuestos Internos. Esta acción resolverá la alerta tributaria del período.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Resumen del Período */}
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Período Fiscal Vencido:</span>
                <span className="font-bold text-white uppercase">{f29DeclarePeriodoNombre} ({f29DeclarePeriodo})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Regla Tributaria SII:</span>
                <span className="text-sky-300 font-medium">Pago a mes vencido (vence el 20)</span>
              </div>
            </div>

            {/* Checkbox: Sin Movimiento */}
            <div className="p-3 rounded-lg bg-slate-900 border border-white/10 flex items-start gap-3">
              <input
                type="checkbox"
                id="f29SinMovimiento"
                checked={f29DeclareSinMovimiento}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setF29DeclareSinMovimiento(checked);
                  if (checked) {
                    setF29DeclareMonto(0);
                  }
                }}
                className="mt-0.5 rounded border-white/30 text-indigo-600 focus:ring-0 focus:outline-none"
              />
              <label htmlFor="f29SinMovimiento" className="cursor-pointer select-none space-y-0.5">
                <span className="font-bold text-white block">Declaración Sin Movimiento ($0)</span>
                <span className="text-[11px] text-slate-400 block">
                  Marca esta opción si no hubo ventas o IVA a pagar en el período. Es obligatorio declararlo ante el SII para evitar infracciones y multas tributarias.
                </span>
              </label>
            </div>

            {/* Input: Monto Pagado */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
                <span>Monto Efectivamente Pagado en el SII (CLP)</span>
                {f29DeclareSinMovimiento && (
                  <span className="text-[10px] text-amber-400 font-normal">Sin movimiento fijado en $0</span>
                )}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  disabled={f29DeclareSinMovimiento}
                  value={f29DeclareMonto}
                  onChange={(e) => setF29DeclareMonto(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="pl-7 bg-white/5 border-white/15 text-white font-mono text-sm h-9 rounded-md disabled:opacity-40"
                />
              </div>
            </div>

            {/* Input: Folio SII */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300 font-semibold">
                Folio SII / Número de Certificado de Declaración (Opcional)
              </Label>
              <Input
                value={f29DeclareFolio}
                onChange={(e) => setF29DeclareFolio(e.target.value)}
                placeholder="Ej: 194820124 (para respaldo contable y trazabilidad)"
                className="bg-white/5 border-white/15 text-white text-xs h-9 rounded-md"
              />
            </div>

            {/* Input: Notas */}
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300 font-semibold">Notas u Observaciones (Opcional)</Label>
              <Input
                value={f29DeclareNotas}
                onChange={(e) => setF29DeclareNotas(e.target.value)}
                placeholder="Ej: Declarado vía portal SII con cargo a cuenta corriente Banco Santander"
                className="bg-white/5 border-white/15 text-white text-xs h-9 rounded-md"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeclareF29Open(false)}
              className="bg-white/5 border-white/15 text-slate-300 text-xs h-9 rounded-md"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDeclareF29}
              disabled={submittingDeclareF29}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 rounded-md px-4 gap-1.5 shadow-md shadow-emerald-600/30"
            >
              <Check className="w-3.5 h-3.5" />
              {submittingDeclareF29 ? "Guardando..." : "Confirmar Declaración F29"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: CONFIRMAR ELIMINACIÓN */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent className="bg-slate-950 border border-white/15 text-slate-100 rounded-lg shadow-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black text-white">
              ¿Eliminar movimiento financiero?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-400">
              Esta acción eliminará el registro de <strong>{deleteItem?.concepto}</strong> ({formatCLP(deleteItem?.montoTotal ?? deleteItem?.monto)} CLP) del flujo de caja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-t border-white/10 pt-4 gap-2">
            <AlertDialogCancel className="bg-white/5 border-white/15 text-slate-300 text-xs h-9 rounded-md">
              Cancelar
            </AlertDialogCancel>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-9 rounded-md px-4"
            >
              {isDeleting ? "Eliminando..." : "Confirmar Eliminación"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
