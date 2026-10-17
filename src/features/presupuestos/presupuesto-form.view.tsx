"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Trash2, 
  Eye, 
  Save, 
  FileText, 
  Building2, 
  Layers, 
  CreditCard, 
  RotateCcw,
  Loader2,
  X,
  PlusCircle,
  Briefcase
} from "lucide-react";
import { Cliente, Servicio, PresupuestoItem, PresupuestoEstado, ConfiguracionGlobal } from "@/lib/types";
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
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PresupuestoFormViewProps {
  numero?: string;
  onClose?: () => void;
  config?: ConfiguracionGlobal | null;
  clientes?: Cliente[];
  catalogo?: Servicio[];
  selectedCliente: string;
  setSelectedCliente: (id: string) => void;
  clienteNombre?: string;
  setClienteNombre?: (val: string) => void;
  proyecto: string;
  setProyecto: (val: string) => void;
  descripcionProyecto: string;
  setDescripcionProyecto: (val: string) => void;
  items?: PresupuestoItem[];
  addItem: (item?: Partial<PresupuestoItem>) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, field: keyof PresupuestoItem, value: string | number) => void;
  optionalItems?: PresupuestoItem[];
  addOptionalItem: () => void;
  removeOptionalItem: (index: number) => void;
  updateOptionalItem: (index: number, field: keyof PresupuestoItem, value: string | number) => void;
  condicionesComerciales?: string;
  setCondicionesComerciales?: (val: string) => void;
  onPreview: () => void;
  onSave: () => void;
  onAddClient: (cliente: Partial<Cliente>) => Promise<void>;
  isSaving: boolean;
  totales: { neto: number; iva: number; total: number };
  estado?: PresupuestoEstado;
  setEstado?: (val: PresupuestoEstado) => void;
  moneda?: "CLP" | "UF";
  setMoneda?: (val: "CLP" | "UF") => void;
  valorUF?: number;
  setValorUF?: (val: number) => void;
  params?: Record<string, string>;
  addParam?: () => void;
  removeParam?: (key: string) => void;
  updateParam?: (oldKey: string, newKey: string, value: string) => void;
  modalidadContinuidad?: string;
  setModalidadContinuidad?: (val: any) => void;
  montoContinuidad?: number;
  setMontoContinuidad?: (val: number) => void;
  detalleContinuidad?: string;
  setDetalleContinuidad?: (val: string) => void;
  tokenPublico?: string;
}

export const PresupuestoFormView: React.FC<PresupuestoFormViewProps> = ({
  numero = "0001",
  onClose,
  config,
  clientes = [],
  catalogo = [],
  selectedCliente,
  setSelectedCliente,
  clienteNombre,
  setClienteNombre,
  proyecto,
  setProyecto,
  descripcionProyecto,
  setDescripcionProyecto,
  items = [],
  addItem,
  removeItem,
  updateItem,
  optionalItems = [],
  addOptionalItem,
  removeOptionalItem,
  updateOptionalItem,
  condicionesComerciales,
  setCondicionesComerciales,
  onPreview,
  onSave,
  onAddClient,
  isSaving,
  totales = { neto: 0, iva: 0, total: 0 },
  estado = "borrador",
  setEstado,
  moneda = "CLP",
  setMoneda,
  valorUF = 38000,
  setValorUF,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "items" | "condiciones">("general");

  // Modal para creación rápida de nuevo cliente
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState({ 
    nombre: "", 
    contacto: "",
    telefono: "", 
    email: "",
    rut: "",
    social_web: "" 
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.nombre.trim() || isCreatingClient) return;
    setIsCreatingClient(true);
    try {
      await onAddClient({
        nombre: newClient.nombre.trim(),
        contacto: newClient.contacto.trim(),
        telefono: newClient.telefono.trim(),
        email: newClient.email.trim(),
        rut: newClient.rut.trim(),
        social_web: newClient.social_web.trim(),
        tipo_registro: "prospecto",
        estado: "prospecto"
      });
      setNewClient({ 
        nombre: "", 
        contacto: "",
        telefono: "", 
        email: "",
        rut: "",
        social_web: "" 
      });
      setIsClientDialogOpen(false);
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleSelectFromCatalogo = (servicioId: string | null) => {
    if (!servicioId) return;
    const s = catalogo.find(item => item.id === servicioId);
    if (s) {
      addItem({
        descripcion: s.descripcion,
        precio: s.precio_base || 0,
        cantidad: 1,
        total: s.precio_base || 0
      });
    }
  };

  const resetDefaultCondiciones = () => {
    if (setCondicionesComerciales) {
      setCondicionesComerciales(
        "• Forma de Pago: 50% de anticipo al inicio de los trabajos y 50% contra entrega conforme y paso a producción.\n• Plazo de Entrega: Estimado conforme a cronograma acordado tras validación del anticipo.\n• Validez de la Oferta: 15 días corridos a contar de la fecha de emisión del documento.\n• Continuidad y Garantía: Incluye 12 meses de soporte técnico, hosting administrado y respaldo ante incidencias."
      );
    }
  };

  const currentCliente = clientes.find(c => c.id === selectedCliente || c.nombre === selectedCliente);
  const clientDisplayName = currentCliente?.nombre || (clienteNombre && clienteNombre !== "Cliente" ? clienteNombre : "");

  const getEstadoBadgeStyle = (est: PresupuestoEstado) => {
    switch (est) {
      case "enviado":
      case "emitido":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "en_negociacion":
        return "bg-sky-500/20 text-sky-300 border-sky-500/30";
      case "aprobado":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "rechazado":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "vencido":
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
      case "borrador":
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground overflow-hidden">
      
      {/* 1. Header Único y Ejecutivo (Estilo ClienteTabsDetail) */}
      <div className="p-4 sm:px-6 sm:py-4 border-b border-white/10 bg-card/70 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-tr from-[#2e3c7e] to-[#abaafd] text-white flex items-center justify-center font-black text-sm sm:text-base shadow-md shrink-0">
            COT
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
                Cotización N° {numero}
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getEstadoBadgeStyle(estado)}`}>
                {estado.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
              {clientDisplayName ? `${clientDisplayName} • ` : ""}
              Hoja SpA Propuesta Comercial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPreview}
            className="h-9 px-3 text-xs font-bold rounded-xl gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Previsualizar</span>
          </Button>

          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground"
              title="Cerrar formulario"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 2. Barra de Navegación por Pestañas */}
      <div className="px-4 sm:px-6 border-b border-white/10 bg-card/40 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b-2 text-xs font-black transition-all whitespace-nowrap ${
            activeTab === "general"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>1. Cliente & Proyecto</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("items")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b-2 text-xs font-black transition-all whitespace-nowrap ${
            activeTab === "items"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>2. Servicios & Valores ({items.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("condiciones")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b-2 text-xs font-black transition-all whitespace-nowrap ${
            activeTab === "condiciones"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>3. Condiciones Pág. 2</span>
        </button>
      </div>

      {/* 3. Área de Contenido Compacto con Scroll Fluido */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-muted">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">

          {/* ======================================================== */}
          {/* PESTAÑA 1: CLIENTE Y PROYECTO (COMPACTO) */}
          {/* ======================================================== */}
          {activeTab === "general" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* Tarjeta 1: Cliente & Configuración Comercial */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Asignación del Cliente & Moneda
                  </span>

                  {/* Diálogo Rápido de Cliente */}
                  <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                    <DialogTrigger render={
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg gap-1"
                      >
                        <Plus className="h-3 w-3" /> Nuevo Cliente
                      </Button>
                    } />
                    <DialogContent className="max-w-md bg-card border-border shadow-2xl rounded-2xl p-5">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-black text-foreground">Crear Cliente Rápido</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                          Se guardará en la base de datos y se asignará automáticamente a esta cotización.
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleCreateClient} className="space-y-3 py-1">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-foreground">Nombre o Empresa *</Label>
                          <Input
                            placeholder="Ej: Constructora Andes SpA"
                            value={newClient.nombre}
                            onChange={(e) => setNewClient({ ...newClient, nombre: e.target.value })}
                            className="h-9 rounded-xl bg-muted/30 border border-white/10 text-xs sm:text-sm"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-foreground">Teléfono</Label>
                            <Input
                              placeholder="+56 9 1234 5678"
                              value={newClient.telefono}
                              onChange={(e) => setNewClient({ ...newClient, telefono: e.target.value })}
                              className="h-9 rounded-xl bg-muted/30 border border-white/10 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-foreground">Email</Label>
                            <Input
                              type="email"
                              placeholder="contacto@empresa.cl"
                              value={newClient.email}
                              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                              className="h-9 rounded-xl bg-muted/30 border border-white/10 text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-foreground">RUT</Label>
                            <Input
                              placeholder="76.123.456-7"
                              value={newClient.rut}
                              onChange={(e) => setNewClient({ ...newClient, rut: e.target.value })}
                              className="h-9 rounded-xl bg-muted/30 border border-white/10 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-foreground">Sitio Web</Label>
                            <Input
                              placeholder="https://empresa.cl"
                              value={newClient.social_web}
                              onChange={(e) => setNewClient({ ...newClient, social_web: e.target.value })}
                              className="h-9 rounded-xl bg-muted/30 border border-white/10 text-xs"
                            />
                          </div>
                        </div>

                        <DialogFooter className="pt-2">
                          <Button
                            type="submit"
                            disabled={isCreatingClient || !newClient.nombre.trim()}
                            className="w-full h-9 rounded-xl font-black bg-primary text-primary-foreground gap-1.5 text-xs"
                          >
                            {isCreatingClient ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            <span>Guardar y Asignar</span>
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Cliente Asignado *</Label>
                    <Select 
                      value={selectedCliente} 
                      onValueChange={(val) => {
                        setSelectedCliente(val || "");
                        const found = clientes.find(c => c.id === val);
                        if (found && setClienteNombre) {
                          setClienteNombre(found.nombre);
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 sm:h-10 rounded-xl bg-muted/30 border border-white/10 text-xs sm:text-sm font-semibold">
                        <SelectValue placeholder="Selecciona un cliente...">
                          {clientDisplayName ? (
                            <span className="font-semibold text-foreground">
                              {clientDisplayName} {currentCliente?.rut ? `(${currentCliente.rut})` : ""}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-normal">Selecciona un cliente...</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/15 text-foreground max-h-56">
                        {selectedCliente && !clientes.some(c => c.id === selectedCliente) && (
                          <SelectItem key={selectedCliente} value={selectedCliente} className="text-xs font-medium">
                            {clientDisplayName || selectedCliente}
                          </SelectItem>
                        )}
                        {clientes.map(c => (
                          <SelectItem key={c.id} value={c.id!} className="text-xs font-medium">
                            {c.nombre} {c.rut ? `(${c.rut})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Estado Comercial</Label>
                    <Select 
                      value={estado} 
                      onValueChange={(val) => {
                        if (val && setEstado) setEstado(val as PresupuestoEstado);
                      }}
                    >
                      <SelectTrigger className="h-9 sm:h-10 rounded-xl bg-muted/30 border border-white/10 text-xs sm:text-sm font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/15 text-foreground text-xs font-medium">
                        <SelectItem value="borrador">📝 Borrador (Interno)</SelectItem>
                        <SelectItem value="enviado">📤 Enviado al Cliente</SelectItem>
                        <SelectItem value="en_negociacion">💬 En Negociación / Feedback</SelectItem>
                        <SelectItem value="aprobado">✅ Aprobado</SelectItem>
                        <SelectItem value="rechazado">❌ Rechazado</SelectItem>
                        <SelectItem value="vencido">⏸️ Vencido / Descartado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-white/5 items-center">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground">Moneda de Emisión</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        type="button"
                        variant={moneda === "CLP" ? "default" : "outline"}
                        onClick={() => setMoneda && setMoneda("CLP")}
                        className={`h-8 sm:h-9 text-xs font-bold rounded-xl transition-all ${
                          moneda === "CLP"
                            ? "bg-primary text-primary-foreground font-black"
                            : "border-white/10 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        🇨🇱 CLP (Pesos)
                      </Button>
                      <Button
                        type="button"
                        variant={moneda === "UF" ? "default" : "outline"}
                        onClick={() => setMoneda && setMoneda("UF")}
                        className={`h-8 sm:h-9 text-xs font-bold rounded-xl transition-all ${
                          moneda === "UF"
                            ? "bg-primary text-primary-foreground font-black"
                            : "border-white/10 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        📈 UF (Referencial)
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-muted-foreground">Valor UF Referencial (CLP)</Label>
                      {moneda === "UF" && (
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">
                          1 UF = ${valorUF.toLocaleString("es-CL")}
                        </span>
                      )}
                    </div>
                    <Input
                      type="number"
                      value={valorUF}
                      onChange={(e) => setValorUF && setValorUF(Number(e.target.value) || 38000)}
                      placeholder="38000"
                      className="h-8 sm:h-9 rounded-xl bg-card border border-white/10 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Proyecto y Alcance Comercial */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 shadow-xs space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">Nombre del Proyecto / Asunto *</Label>
                  <Input
                    placeholder="Ej: Desarrollo de Plataforma Web Corporativa y Sistema de Reservas"
                    value={proyecto}
                    onChange={(e) => setProyecto(e.target.value)}
                    className="h-9 sm:h-10 rounded-xl bg-muted/30 border border-white/10 text-xs sm:text-sm font-bold text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">Alcance y Descripción Comercial</Label>
                  <Textarea
                    rows={3}
                    placeholder="Describe brevemente el alcance comercial, entregables y objetivos..."
                    value={descripcionProyecto}
                    onChange={(e) => setDescripcionProyecto(e.target.value)}
                    className="rounded-xl bg-muted/30 border border-white/10 text-xs font-medium leading-relaxed resize-none p-2.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 2: SERVICIOS & VALORES (TABLA EJECUTIVA COMPACTA) */}
          {/* ======================================================== */}
          {activeTab === "items" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* Barra de acción rápida */}
              <div className="p-3 sm:p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-foreground">Servicios e Ítems Cotizados</h3>
                  <p className="text-[11px] text-muted-foreground">Tabla ejecutiva de ítems y precios de la propuesta.</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {catalogo && catalogo.length > 0 && (
                    <Select onValueChange={handleSelectFromCatalogo}>
                      <SelectTrigger className="h-8 px-2.5 text-xs font-bold rounded-xl border border-white/10 bg-muted/30 w-44">
                        <SelectValue placeholder="Desde catálogo..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/15 text-foreground max-h-56">
                        {catalogo.map(c => (
                          <SelectItem key={c.id} value={c.id!} className="text-xs">
                            {c.descripcion} (${(c.precio_base || 0).toLocaleString("es-CL")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button
                    type="button"
                    onClick={() => addItem()}
                    size="sm"
                    className="h-8 px-3 text-xs font-black rounded-xl bg-primary text-primary-foreground gap-1 shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir Ítem
                  </Button>
                </div>
              </div>

              {/* Tabla Ejecutiva de Alta Densidad */}
              <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl overflow-hidden shadow-xs">
                {items.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      No has añadido ningún servicio a la propuesta aún.
                    </p>
                    <Button
                      type="button"
                      onClick={() => addItem()}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-primary/30 text-primary font-bold text-xs gap-1.5 h-8"
                    >
                      <Plus className="h-3 w-3" /> Añadir Primer Servicio
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10 bg-muted/20 text-muted-foreground font-black uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 pl-4 text-center w-8">#</th>
                          <th className="py-2.5 px-3 text-left">Descripción del Servicio</th>
                          <th className="py-2.5 px-2 text-center w-20">Cant.</th>
                          <th className="py-2.5 px-2 text-right w-32">Precio Unit. ({moneda})</th>
                          <th className="py-2.5 px-3 text-right w-32">Subtotal</th>
                          <th className="py-2.5 pr-4 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {items.map((item, index) => (
                          <tr key={index} className="hover:bg-muted/10 transition-colors align-top">
                            <td className="py-2.5 pl-4 text-center font-mono text-[11px] text-muted-foreground pt-3">
                              {index + 1}
                            </td>

                            <td className="py-2 px-3">
                              <Textarea
                                rows={2}
                                placeholder="Describe el servicio entregable..."
                                value={item.descripcion}
                                onChange={(e) => updateItem(index, "descripcion", e.target.value)}
                                className="min-h-[46px] rounded-lg bg-muted/20 border border-white/10 text-xs font-semibold leading-relaxed resize-none p-2 w-full"
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              <Input
                                type="number"
                                min="1"
                                value={Number.isNaN(item.cantidad) ? "" : item.cantidad}
                                onChange={(e) => updateItem(index, "cantidad", parseInt(e.target.value, 10))}
                                className="h-9 rounded-lg bg-muted/20 border border-white/10 text-xs font-bold font-mono text-center w-20"
                              />
                            </td>

                            <td className="py-2 px-2 text-right">
                              <Input
                                type="number"
                                value={Number.isNaN(item.precio) ? "" : item.precio}
                                onChange={(e) => updateItem(index, "precio", parseFloat(e.target.value))}
                                className="h-9 rounded-lg bg-muted/20 border border-white/10 text-xs font-bold font-mono text-right w-32"
                              />
                            </td>

                            <td className="py-2 px-3 text-right pt-3 font-mono font-black text-xs sm:text-sm text-primary whitespace-nowrap">
                              {moneda === "UF"
                                ? `${(item.total || 0).toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} UF`
                                : `$${Math.round(item.total || 0).toLocaleString("es-CL")}`}
                            </td>

                            <td className="py-2 pr-4 text-center pt-2.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(index)}
                                className="h-7 w-7 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                title="Eliminar ítem"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Servicios Opcionales / Extras Compactos */}
              <div className="p-3.5 rounded-2xl bg-card/40 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                      Servicios Opcionales / Recurrentes
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      No alteran el subtotal inicial. Se presentan como adicionales para decisión del cliente.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOptionalItem}
                    className="h-7 px-2 text-xs font-bold rounded-lg border-border gap-1"
                  >
                    <Plus className="h-3 w-3" /> Añadir Extra
                  </Button>
                </div>

                {optionalItems.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {optionalItems.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-muted/20 border border-white/5">
                        <Input
                          placeholder="Descripción del adicional (ej: Hosting cPanel mensual)..."
                          value={opt.descripcion}
                          onChange={(e) => updateOptionalItem(idx, "descripcion", e.target.value)}
                          className="h-8 rounded-lg bg-card border border-white/10 text-xs font-medium flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Monto"
                          value={Number.isNaN(opt.precio) ? "" : opt.precio}
                          onChange={(e) => updateOptionalItem(idx, "precio", parseFloat(e.target.value))}
                          className="h-8 rounded-lg bg-card border border-white/10 text-xs font-bold font-mono w-24 text-right"
                        />
                        <Select 
                          value={opt.frecuencia || "Mensual"} 
                          onValueChange={(val) => { if (val) updateOptionalItem(idx, "frecuencia", val); }}
                        >
                          <SelectTrigger className="h-8 w-24 text-xs font-bold rounded-lg border border-white/10 bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/15 text-foreground text-xs">
                            <SelectItem value="Mensual">Mensual</SelectItem>
                            <SelectItem value="Anual">Anual</SelectItem>
                            <SelectItem value="Pago Único">Único</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOptionalItem(idx)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-400 rounded-lg shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 3: CONDICIONES COMERCIALES (PÁGINA 2) */}
          {/* ======================================================== */}
          {activeTab === "condiciones" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="p-4 sm:p-5 rounded-2xl bg-card/60 backdrop-blur-xl border border-white/10 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-foreground">Condiciones Comerciales y Operativas</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Se imprimen directamente en la <span className="font-bold text-foreground">Página 2</span> del formato Carta junto a las cuentas.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetDefaultCondiciones}
                    className="h-7 px-2 text-xs font-bold rounded-lg text-muted-foreground hover:text-primary gap-1"
                    title="Restablecer condiciones oficiales de Hoja SpA"
                  >
                    <RotateCcw className="h-3 w-3" /> Restablecer Plantilla
                  </Button>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">
                    Condiciones del Presupuesto (Un punto o viñeta por línea)
                  </Label>
                  <Textarea
                    rows={6}
                    value={condicionesComerciales || ""}
                    onChange={(e) => setCondicionesComerciales && setCondicionesComerciales(e.target.value)}
                    placeholder="• Forma de Pago: 50% de anticipo..."
                    className="rounded-xl bg-muted/30 border border-white/10 text-xs font-medium leading-relaxed resize-none p-3 font-sans"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Cada línea se renderiza con un icono de verificación en la página 2.
                  </p>
                </div>
              </div>

              {/* Vista informativa de datos bancarios */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-white/10 space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Cuentas Oficiales de Transferencia (Pie de Página 2)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs p-3.5 rounded-xl bg-card/60 border border-white/5">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold block">Razón Social</span>
                    <span className="font-semibold text-foreground">{config?.nombre_titular || "SERVICIOS INFORMATICOS HOJA SPA"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold block">RUT</span>
                    <span className="font-mono font-semibold text-foreground">{config?.rut || "78.364.078-3"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold block">Banco Oficial</span>
                    <span className="font-semibold text-foreground">{config?.banco || "Banco Falabella"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold block">Tipo de Cuenta</span>
                    <span className="font-semibold text-foreground">{config?.tipo_cuenta || "Cuenta Corriente"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold block">N° de Cuenta</span>
                    <span className="font-mono font-semibold text-foreground">{config?.numero_cuenta || "1-983-101480-2"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold block">Email Comprobantes</span>
                    <span className="font-semibold text-primary">{config?.email_pago || "devhoja@gmail.com"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 4. Footer Fijo Integrado al Tema Oscuro (Ultra Compacto y Coherente) */}
      <div className="shrink-0 bg-slate-950/95 border-t border-white/10 backdrop-blur-xl px-4 sm:px-6 py-2.5 z-20 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Desglose de Totales */}
          <div className="flex items-center gap-5 sm:gap-8 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Neto</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-foreground">
                {moneda === "UF"
                  ? `${totales.neto.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} UF`
                  : `$${totales.neto.toLocaleString("es-CL")}`}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">IVA (19%)</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-foreground">
                {moneda === "UF"
                  ? `${totales.iva.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} UF`
                  : `$${totales.iva.toLocaleString("es-CL")}`}
              </span>
            </div>

            <div className="border-l border-white/10 pl-5 sm:pl-6">
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary block">
                Total
              </span>
              <span className="text-lg sm:text-xl font-black font-mono text-primary whitespace-nowrap">
                {moneda === "UF"
                  ? `${totales.total.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} UF`
                  : `$${totales.total.toLocaleString("es-CL")}`}
              </span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onPreview}
              className="h-9 px-3 text-xs font-bold rounded-xl border-white/15 bg-card/60 hover:bg-white/10 gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" /> Previsualizar
            </Button>

            <Button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="h-9 px-5 text-xs font-black rounded-xl bg-primary text-primary-foreground hover:scale-[1.02] transition-all gap-1.5 shadow-md shadow-primary/20"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>{isSaving ? "Guardando..." : "Guardar Presupuesto"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
