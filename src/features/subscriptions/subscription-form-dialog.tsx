"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  TipoRecurrencia,
  CategoriaServicioRecurrente, 
  CicloFacturacion, 
  EstadoSuscripcion,
  EstadoCobroServicio,
  MetodoPagoRecurrente
} from "@/lib/types";
import { 
  CreditCard, 
  Server, 
  Globe, 
  Cpu, 
  Wifi, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  DollarSign,
  Calendar,
  Building,
  FileText,
  UserCheck,
  ShieldCheck,
  Clock,
  Briefcase
} from "lucide-react";

interface SubscriptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription | null;
  clientes?: Cliente[];
  preselectedClienteId?: string;
  onSave: (data: Partial<Subscription>) => Promise<void>;
}

const CATEGORIAS_CLIENTE: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  mantencion_web: { label: "Mantención Web & Actualizaciones", icon: Globe, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  mantencion_software: { label: "Mantención Software / Web App", icon: Cpu, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
  soporte_mensual: { label: "Soporte Mensual & Bolsa de Horas", icon: Clock, color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  hosting_cliente: { label: "Hosting Anual & Dominio Cliente", icon: Server, color: "text-violet-400 bg-violet-500/10 border-violet-500/30" },
  servidor_dedicado: { label: "Servidor Cloud Dedicado", icon: ShieldCheck, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
  otro: { label: "Otro Servicio Recurrente", icon: Package, color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
};

const CATEGORIAS_EMPRESA: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  bancario_tarjetas: { label: "Mantenimiento Tarjetas & Cuentas", icon: CreditCard, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  hosting_propio: { label: "Hosting Propio & Servidores Cloud", icon: Server, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
  software_saas: { label: "Software, SaaS & Licencias / APIs", icon: Cpu, color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  dominios_propios: { label: "Dominios Propios (NIC Chile)", icon: Globe, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  conectividad: { label: "Conectividad & Telefonía", icon: Wifi, color: "text-violet-400 bg-violet-500/10 border-violet-500/30" },
  otro: { label: "Otro Costo Operativo Fijo", icon: Package, color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
};

const PROVEEDORES_SUGERIDOS = [
  "Hoja SpA",
  "Banco Falabella",
  "Banco Santander",
  "Bluehosting",
  "Vercel",
  "Hetzner",
  "NIC Chile",
  "Google Workspace",
  "OpenAI",
  "GitHub",
  "Adobe Creative Cloud"
];

const MEDIOS_PAGO: { id: MetodoPagoRecurrente; label: string }[] = [
  { id: "transferencia", label: "Transferencia Electrónica" },
  { id: "debito_automatico", label: "Débito Automático (PAC)" },
  { id: "tarjeta_credito", label: "Tarjeta de Crédito (PAT)" },
  { id: "paypal", label: "PayPal / Pasarela Externa" },
  { id: "otro", label: "Otro Medio" }
];

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  subscription,
  clientes = [],
  preselectedClienteId,
  onSave,
}: SubscriptionFormDialogProps) {
  // Tipo de recurrencia
  const [tipoRecurrencia, setTipoRecurrencia] = useState<TipoRecurrencia>("cliente_ingreso");

  // Campos principales
  const [nombre, setNombre] = useState("");
  const [proveedor, setProveedor] = useState("Hoja SpA");
  const [categoria, setCategoria] = useState<CategoriaServicioRecurrente>("mantencion_web");
  const [cicloFacturacion, setCicloFacturacion] = useState<CicloFacturacion>("mensual");
  const [monto, setMonto] = useState<number>(0);
  const [moneda, setMoneda] = useState<"CLP" | "USD" | "UF">("CLP");
  const [diaPago, setDiaPago] = useState<number>(5);
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().split("T")[0]);
  const [fechaCorte, setFechaCorte] = useState<string>("");
  const [estado, setEstado] = useState<EstadoSuscripcion>("activo");
  const [estadoCobro, setEstadoCobro] = useState<EstadoCobroServicio>("al_dia");
  const [metodoPago, setMetodoPago] = useState<MetodoPagoRecurrente>("transferencia");
  const [tarjetaOCuenta, setTarjetaOCuenta] = useState("");
  const [aplicaFactura, setAplicaFactura] = useState(true);
  const [deducibleIva, setDeducibleIva] = useState(false);
  const [enlaceGestion, setEnlaceGestion] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  // Campos específicos de cliente
  const [clienteId, setClienteId] = useState<string>("");
  const [clienteNombre, setClienteNombre] = useState<string>("");
  const [clienteRut, setClienteRut] = useState<string>("");
  const [clienteTelefono, setClienteTelefono] = useState<string>("");
  const [clienteEmail, setClienteEmail] = useState<string>("");
  const [slaHorasMensuales, setSlaHorasMensuales] = useState<number>(0);
  const [dominio, setDominio] = useState<string>("");

  useEffect(() => {
    if (subscription) {
      const isCliente = subscription.tipoRecurrencia === "cliente_ingreso" || Boolean(subscription.clienteId) || Boolean(subscription.clienteNombre);
      setTipoRecurrencia(isCliente ? "cliente_ingreso" : "empresa_egreso");
      setNombre(subscription.nombre || subscription.dominio || subscription.tipoServicio || "");
      setProveedor(subscription.proveedor || (isCliente ? "Hoja SpA" : "Bluehosting"));
      setCategoria(subscription.categoria || (isCliente ? "mantencion_web" : "hosting_propio"));
      setCicloFacturacion(subscription.cicloFacturacion || "mensual");
      setMonto(subscription.monto || 0);
      setMoneda(subscription.moneda || "CLP");
      setDiaPago(subscription.diaPago || 5);
      setFechaInicio(subscription.fechaInicio ? subscription.fechaInicio.split("T")[0] : new Date().toISOString().split("T")[0]);
      setFechaCorte(subscription.fechaCorte ? subscription.fechaCorte.split("T")[0] : "");
      setEstado(subscription.estado || "activo");
      setEstadoCobro(subscription.estadoCobro || "al_dia");
      setMetodoPago(subscription.metodoPago || (isCliente ? "transferencia" : "tarjeta_credito"));
      setTarjetaOCuenta(subscription.tarjetaOCuenta || "");
      setAplicaFactura(subscription.aplicaFactura ?? true);
      setDeducibleIva(subscription.deducibleIva ?? false);
      setEnlaceGestion(subscription.enlaceGestion || "");
      setNotas(subscription.notas || "");
      setClienteId(subscription.clienteId || "");
      setClienteNombre(subscription.clienteNombre || "");
      setClienteRut(subscription.clienteRut || "");
      setClienteTelefono(subscription.clienteTelefono || "");
      setClienteEmail(subscription.clienteEmail || "");
      setSlaHorasMensuales(subscription.slaHorasMensuales || 0);
      setDominio(subscription.dominio || "");
    } else {
      const targetClienteId = preselectedClienteId || "";
      const matched = clientes.find((c) => c.id === targetClienteId);

      const isCliente = Boolean(targetClienteId) || true;
      setTipoRecurrencia(isCliente ? "cliente_ingreso" : "empresa_egreso");
      setNombre("");
      setProveedor(isCliente ? "Hoja SpA" : "Bluehosting");
      setCategoria(isCliente ? "mantencion_web" : "hosting_propio");
      setCicloFacturacion("mensual");
      setMonto(0);
      setMoneda("CLP");
      setDiaPago(5);
      const today = new Date();
      setFechaInicio(today.toISOString().split("T")[0]);
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setFechaCorte(nextMonth.toISOString().split("T")[0]);
      setEstado("activo");
      setEstadoCobro("al_dia");
      setMetodoPago(isCliente ? "transferencia" : "tarjeta_credito");
      setTarjetaOCuenta(isCliente ? "Cta Cte Banco Santander Hoja SpA" : "Tarjeta Falabella");
      setAplicaFactura(true);
      setDeducibleIva(false);
      setEnlaceGestion("");
      setNotas("");
      setClienteId(targetClienteId);
      setClienteNombre(matched?.nombre || "");
      setClienteRut(matched?.rut || "");
      setClienteTelefono(matched?.telefono || "");
      setClienteEmail(matched?.email || "");
      setSlaHorasMensuales(0);
      setDominio("");
    }
  }, [subscription, open, preselectedClienteId, clientes]);

  // Selección de cliente en el formulario
  const handleSelectCliente = (id: string | null) => {
    const validId = id || "";
    setClienteId(validId);
    const cli = clientes.find((c) => c.id === validId);
    if (cli) {
      setClienteNombre(cli.nombre);
      setClienteRut(cli.rut || "");
      setClienteTelefono(cli.telefono || "");
      setClienteEmail(cli.email || "");
      if (!nombre) {
        setNombre(`Mantención Web Mensual — ${cli.nombre}`);
      }
    } else {
      setClienteNombre("");
      setClienteRut("");
      setClienteTelefono("");
      setClienteEmail("");
    }
  };

  // Recalcular fecha corte según ciclo
  const handleCicloChange = (nuevoCiclo: CicloFacturacion) => {
    setCicloFacturacion(nuevoCiclo);
    if (!subscription?.id) {
      const base = fechaInicio ? new Date(fechaInicio) : new Date();
      const next = new Date(base);
      if (nuevoCiclo === "mensual") next.setMonth(next.getMonth() + 1);
      else if (nuevoCiclo === "trimestral") next.setMonth(next.getMonth() + 3);
      else if (nuevoCiclo === "semestral") next.setMonth(next.getMonth() + 6);
      else if (nuevoCiclo === "anual") next.setFullYear(next.getFullYear() + 1);
      setFechaCorte(next.toISOString().split("T")[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !fechaCorte || monto < 0) {
      alert("Por favor completa los campos requeridos: Nombre del Servicio, Monto y Próxima Fecha de Cobro/Vencimiento.");
      return;
    }

    if (tipoRecurrencia === "cliente_ingreso" && !clienteNombre.trim()) {
      alert("Debes seleccionar o especificar el cliente para un cobro de mantención.");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        tipoRecurrencia,
        nombre: nombre.trim(),
        proveedor: tipoRecurrencia === "cliente_ingreso" ? "Hoja SpA" : proveedor.trim(),
        categoria,
        cicloFacturacion,
        monto: Number(monto),
        moneda,
        diaPago: Number(diaPago),
        fechaInicio,
        fechaCorte,
        estado,
        estadoCobro,
        metodoPago,
        tarjetaOCuenta: tarjetaOCuenta.trim(),
        aplicaFactura,
        deducibleIva: tipoRecurrencia === "empresa_egreso" ? deducibleIva : false,
        enlaceGestion: enlaceGestion.trim(),
        notas: notas.trim() || undefined,
        // Datos de cliente
        clienteId: tipoRecurrencia === "cliente_ingreso" ? clienteId || undefined : undefined,
        clienteNombre: tipoRecurrencia === "cliente_ingreso" ? clienteNombre.trim() : undefined,
        clienteRut: tipoRecurrencia === "cliente_ingreso" ? clienteRut.trim() : undefined,
        clienteTelefono: tipoRecurrencia === "cliente_ingreso" ? clienteTelefono.trim() : undefined,
        clienteEmail: tipoRecurrencia === "cliente_ingreso" ? clienteEmail.trim() : undefined,
        slaHorasMensuales: tipoRecurrencia === "cliente_ingreso" ? Number(slaHorasMensuales) : undefined,
        dominio: dominio.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      alert("Error al guardar el servicio recurrente.");
    } finally {
      setSaving(false);
    }
  };

  const categoriasActuales = tipoRecurrencia === "cliente_ingreso" ? CATEGORIAS_CLIENTE : CATEGORIAS_EMPRESA;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[720px] bg-slate-950 border border-white/15 text-slate-100 max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl rounded-2xl">
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              tipoRecurrencia === "cliente_ingreso" 
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" 
                : "bg-indigo-500/20 border border-indigo-500/40 text-indigo-400"
            }`}>
              {tipoRecurrencia === "cliente_ingreso" ? <Briefcase className="w-5 h-5" /> : <Building className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-black text-white tracking-tight">
                {subscription 
                  ? (tipoRecurrencia === "cliente_ingreso" ? "Modificar Mantención / Servicio de Cliente" : "Modificar Costo de Infraestructura")
                  : (tipoRecurrencia === "cliente_ingreso" ? "Nuevo Servicio o Mantención a Cliente" : "Nuevo Gasto / Infraestructura de Empresa")}
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {tipoRecurrencia === "cliente_ingreso"
                  ? "Gestión de cobros recurrentes de clientes, mantenciones web, hosting y bolsas de soporte."
                  : "Control de costos fijos, hosting reseller propio, servidores cloud y licencias SaaS."}
              </p>
            </div>
          </div>

          {/* Selector de Tipo de Recurrencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
            <button
              type="button"
              onClick={() => {
                setTipoRecurrencia("cliente_ingreso");
                setProveedor("Hoja SpA");
                setCategoria("mantencion_web");
                setAplicaFactura(true);
                setDeducibleIva(false);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                tipoRecurrencia === "cliente_ingreso"
                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/15"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              💼 Cobro / Mantención a Cliente (Ingreso)
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoRecurrencia("empresa_egreso");
                setProveedor("Bluehosting");
                setCategoria("hosting_propio");
                setAplicaFactura(true);
                setDeducibleIva(true);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                tipoRecurrencia === "empresa_egreso"
                  ? "bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/15"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <Server className="w-4 h-4" />
              🏢 Costo Propio / Infraestructura (Egreso)
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* SECCIÓN 1: Identificación y Cliente / Proveedor */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-400">
              <FileText className="w-3.5 h-3.5" />
              1. Identificación del Servicio {tipoRecurrencia === "cliente_ingreso" ? "& Cliente" : "& Proveedor"}
            </div>

            {/* Si es cliente, selector de cliente */}
            {tipoRecurrencia === "cliente_ingreso" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Cliente Beneficiario <span className="text-rose-400">*</span></span>
                    {clienteRut && <span className="text-[10px] text-slate-400 font-mono">RUT: {clienteRut}</span>}
                  </Label>
                  <Select value={clienteId} onValueChange={handleSelectCliente}>
                    <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl">
                      <SelectValue placeholder="Selecciona un cliente de la lista..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/15 text-white max-h-56">
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id || ""} className="text-xs focus:bg-white/10">
                          {c.nombre} {c.rut ? `(${c.rut})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Nombre de Razón Social / Cliente</Label>
                  <Input
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder="Nombre del cliente o empresa"
                    className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Teléfono / WhatsApp para Cobros</Label>
                  <Input
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-xl font-mono"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-300">
                  Nombre del Servicio <span className="text-rose-400">*</span>
                </Label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={tipoRecurrencia === "cliente_ingreso" 
                    ? "Ej: Mantención Web & WooCommerce Mensual / Hosting Corporativo Anual" 
                    : "Ej: Reseller cPanel Bluehosting / Servidor Hetzner / Google Workspace"}
                  className="bg-slate-900 border-white/15 text-white placeholder:text-slate-500 text-xs h-10 rounded-xl font-medium focus-visible:ring-indigo-500"
                  required
                />
              </div>

              {tipoRecurrencia === "empresa_egreso" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">
                    Proveedor / Entidad <span className="text-rose-400">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      list="proveedores-list"
                      value={proveedor}
                      onChange={(e) => setProveedor(e.target.value)}
                      placeholder="Ej: Bluehosting, Vercel, Hetzner, Falabella"
                      className="bg-slate-900 border-white/15 text-white placeholder:text-slate-500 text-xs h-10 rounded-xl font-medium focus-visible:ring-indigo-500"
                      required
                    />
                    <datalist id="proveedores-list">
                      {PROVEEDORES_SUGERIDOS.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </div>
                </div>
              )}

              <div className={`space-y-1.5 ${tipoRecurrencia === "cliente_ingreso" ? "sm:col-span-2" : ""}`}>
                <Label className="text-xs font-bold text-slate-300">
                  Categoría del Servicio <span className="text-rose-400">*</span>
                </Label>
                <Select value={categoria} onValueChange={(val) => setCategoria(val as CategoriaServicioRecurrente)}>
                  <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    {Object.entries(categoriasActuales).map(([key, config]) => (
                      <SelectItem key={key} value={key} className="text-xs focus:bg-white/10 cursor-pointer">
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tipoRecurrencia === "cliente_ingreso" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Dominio / URL Asociada</Label>
                    <Input
                      value={dominio}
                      onChange={(e) => setDominio(e.target.value)}
                      placeholder="Ej: miempresa.cl"
                      className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Bolsa de Horas SLA Mensual (Opcional)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={slaHorasMensuales}
                      onChange={(e) => setSlaHorasMensuales(parseInt(e.target.value) || 0)}
                      placeholder="Ej: 4 (horas de soporte incluidas)"
                      className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl font-mono"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECCIÓN 2: Costos, Moneda y Ciclo */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
              <DollarSign className="w-3.5 h-3.5" />
              2. {tipoRecurrencia === "cliente_ingreso" ? "Tarifa a Cobrar & Ciclo de Pago" : "Costos & Moneda"}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-300">
                  {tipoRecurrencia === "cliente_ingreso" ? "Monto a Cobrar" : "Monto del Costo"} <span className="text-rose-400">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                    {moneda === "CLP" ? "$" : moneda === "USD" ? "US$" : "UF"}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={moneda === "UF" ? "0.01" : "1"}
                    value={monto}
                    onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="pl-10 bg-slate-900 border-white/15 text-white font-mono text-sm h-10 rounded-xl font-bold focus-visible:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Moneda</Label>
                <Select value={moneda} onValueChange={(val) => setMoneda(val as "CLP" | "USD" | "UF")}>
                  <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    <SelectItem value="CLP" className="text-xs focus:bg-white/10">CLP ($ Peso Chileno)</SelectItem>
                    <SelectItem value="UF" className="text-xs focus:bg-white/10">UF (Unidad de Fomento)</SelectItem>
                    <SelectItem value="USD" className="text-xs focus:bg-white/10">USD (Dólar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Ciclo de Cobro</Label>
                <Select value={cicloFacturacion} onValueChange={(val) => handleCicloChange(val as CicloFacturacion)}>
                  <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    <SelectItem value="mensual" className="text-xs focus:bg-white/10">Mensual</SelectItem>
                    <SelectItem value="trimestral" className="text-xs focus:bg-white/10">Trimestral (3m)</SelectItem>
                    <SelectItem value="semestral" className="text-xs focus:bg-white/10">Semestral (6m)</SelectItem>
                    <SelectItem value="anual" className="text-xs focus:bg-white/10">Anual (12m)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Día del Mes de Cobro (1-31)</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={diaPago}
                  onChange={(e) => setDiaPago(parseInt(e.target.value) || 1)}
                  className="bg-slate-900 border-white/15 text-white font-mono text-xs h-10 rounded-xl focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Fecha de Inicio / Alta</Label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-amber-300">
                  Próxima Fecha de Cobro / Vencimiento <span className="text-rose-400">*</span>
                </Label>
                <Input
                  type="date"
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                  className="bg-slate-900 border-amber-500/40 text-amber-300 font-bold text-xs h-10 rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Medio de Pago & Facturación */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-400">
              <CreditCard className="w-3.5 h-3.5" />
              3. Forma de Pago, Facturación & Flujo de Caja
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Medio de Pago Habitual</Label>
                <Select value={metodoPago} onValueChange={(val) => setMetodoPago(val as MetodoPagoRecurrente)}>
                  <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    {MEDIOS_PAGO.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs focus:bg-white/10">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Cuenta de Destino u Origen</Label>
                <Input
                  value={tarjetaOCuenta}
                  onChange={(e) => setTarjetaOCuenta(e.target.value)}
                  placeholder={tipoRecurrencia === "cliente_ingreso" ? "Cta Cte Santander Hoja SpA" : "Mastercard Falabella #1480"}
                  className="bg-slate-900 border-white/15 text-white placeholder:text-slate-500 text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <input
                  type="checkbox"
                  id="chk-factura"
                  checked={aplicaFactura}
                  onChange={(e) => setAplicaFactura(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-white/20 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="chk-factura" className="text-xs text-slate-300 cursor-pointer select-none">
                  <span className="font-bold text-white block">Emite Factura Oficial (IVA 19%)</span>
                  {tipoRecurrencia === "cliente_ingreso" 
                    ? "Genera factura de venta para el cliente con IVA débito F29" 
                    : "El proveedor entrega factura oficial deducible"}
                </label>
              </div>

              {tipoRecurrencia === "cliente_ingreso" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Estado del Cobro Actual</Label>
                  <Select value={estadoCobro} onValueChange={(val) => setEstadoCobro(val as EstadoCobroServicio)}>
                    <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/15 text-white">
                      <SelectItem value="al_dia" className="text-xs text-emerald-400">✅ Al Día (Cobrado)</SelectItem>
                      <SelectItem value="por_cobrar" className="text-xs text-amber-400">⏳ Por Cobrar</SelectItem>
                      <SelectItem value="vencido" className="text-xs text-rose-400">🛑 Vencido / Cobro Pendiente</SelectItem>
                      <SelectItem value="pausado" className="text-xs text-slate-400">⏸️ Pausado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <input
                    type="checkbox"
                    id="chk-iva"
                    checked={deducibleIva}
                    onChange={(e) => setDeducibleIva(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-white/20 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="chk-iva" className="text-xs text-slate-300 cursor-pointer select-none">
                    <span className="font-bold text-emerald-400 block">IVA Deducible (Crédito Fiscal)</span>
                    Aplica para rebaja tributaria en formulario F29 de Hoja SpA
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Enlace de Administración o Acceso (URL)</span>
                <span className="text-[10px] text-slate-400">Panel del cliente o cPanel / Hosting</span>
              </Label>
              <div className="relative">
                <ExternalLink className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <Input
                  value={enlaceGestion}
                  onChange={(e) => setEnlaceGestion(e.target.value)}
                  placeholder="https://clientes.bluehosting.cl / https://miempresa.cl/wp-admin"
                  className="pl-10 bg-slate-900 border-white/15 text-white placeholder:text-slate-500 text-xs h-10 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: Estado y Notas Operativas */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Estado del Contrato</Label>
                <Select value={estado} onValueChange={(val) => setEstado(val as EstadoSuscripcion)}>
                  <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    <SelectItem value="activo" className="text-xs text-emerald-400">✅ Activo</SelectItem>
                    <SelectItem value="por_vencer" className="text-xs text-amber-400">⚠️ Por Vencer</SelectItem>
                    <SelectItem value="vencido" className="text-xs text-rose-400">🛑 Vencido</SelectItem>
                    <SelectItem value="pausado" className="text-xs text-slate-400">⏸️ Pausado</SelectItem>
                    <SelectItem value="suspendido" className="text-xs text-slate-400">🚫 Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-300">Notas / Términos de la Mantención</Label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Mantención web incluye copias de seguridad semanales, actualización de plugins y 4 horas de soporte técnico..."
                  rows={2}
                  className="bg-slate-900 border-white/15 text-white placeholder:text-slate-500 text-xs rounded-xl resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white/5 border-white/15 text-slate-300 hover:bg-white/10 text-xs h-10 rounded-xl px-5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className={`text-white font-bold text-xs h-10 rounded-xl px-6 shadow-lg ${
                tipoRecurrencia === "cliente_ingreso" 
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30" 
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
              }`}
            >
              {saving ? "Guardando..." : subscription ? "Actualizar Servicio" : (tipoRecurrencia === "cliente_ingreso" ? "Guardar Mantención de Cliente" : "Registrar Gasto de Infraestructura")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
