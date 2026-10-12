"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  Eye, 
  Save, 
  BadgePercent
} from "lucide-react";
import { Cliente, Servicio, PresupuestoItem, PresupuestoEstado, ModalidadContinuidad } from "@/lib/types";
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
  DialogTrigger
} from "@/components/ui/dialog";

interface PresupuestoFormViewProps {
  clientes: Cliente[];
  catalogo: Servicio[];
  selectedCliente: string;
  setSelectedCliente: (id: string) => void;
  proyecto: string;
  setProyecto: (val: string) => void;
  descripcionProyecto: string;
  setDescripcionProyecto: (val: string) => void;
  items: PresupuestoItem[];
  addItem: (item?: Partial<PresupuestoItem>) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, field: keyof PresupuestoItem, value: string | number) => void;
  optionalItems: PresupuestoItem[];
  addOptionalItem: () => void;
  removeOptionalItem: (index: number) => void;
  updateOptionalItem: (index: number, field: keyof PresupuestoItem, value: string | number) => void;
  params: Record<string, string>;
  addParam: () => void;
  removeParam: (key: string) => void;
  updateParam: (oldKey: string, newKey: string, value: string) => void;
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
  modalidadContinuidad?: ModalidadContinuidad;
  setModalidadContinuidad?: (val: ModalidadContinuidad) => void;
  montoContinuidad?: number;
  setMontoContinuidad?: (val: number) => void;
  detalleContinuidad?: string;
  setDetalleContinuidad?: (val: string) => void;
  tokenPublico?: string;
}

export const PresupuestoFormView: React.FC<PresupuestoFormViewProps> = ({
  clientes,
  selectedCliente,
  setSelectedCliente,
  proyecto,
  setProyecto,
  descripcionProyecto,
  setDescripcionProyecto,
  items,
  addItem,
  removeItem,
  updateItem,
  optionalItems,
  addOptionalItem,
  removeOptionalItem,
  updateOptionalItem,
  params,
  removeParam,
  updateParam,
  onPreview,
  onSave,
  onAddClient,
  isSaving,
  totales,
  estado = "borrador",
  setEstado,
  moneda = "CLP",
  setMoneda,
  valorUF = 38000,
  setValorUF,
  modalidadContinuidad = "ano_1_incluido",
  setModalidadContinuidad,
  montoContinuidad = 0,
  setMontoContinuidad,
  detalleContinuidad = "Hosting Reseller cPanel, casillas corporativas, SSL y copias de seguridad semanales.",
  setDetalleContinuidad,
  tokenPublico,
}) => {
  const [newClient, setNewClient] = useState({ 
    nombre: "", 
    telefono: "", 
    social_instagram: "", 
    social_linkedin: "", 
    social_web: "" 
  });
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const handleCreateClient = async () => {
    if (!newClient.nombre || isCreatingClient) return;
    setIsCreatingClient(true);
    try {
      await onAddClient(newClient);
      setNewClient({ 
        nombre: "", 
        telefono: "", 
        social_instagram: "", 
        social_linkedin: "", 
        social_web: "" 
      });
      setIsClientDialogOpen(false);
    } finally {
      setIsCreatingClient(false);
    }
  };

  const currentClienteName = clientes.find(c => c.id === selectedCliente)?.nombre;

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden border-t border-white/5">
      
      {/* AREA DE CONTENIDO CON SCROLL NATIVO - MAS FIABLE */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
        <div className="mx-auto w-full max-w-5xl space-y-6 sm:space-y-12 px-4 sm:px-12 py-6 sm:py-16">
          
          {/* Header Seccionado */}
          <div className="flex flex-col gap-6 sm:gap-10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-foreground leading-none">Presupuesto</h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-2">
                  <BadgePercent className="h-3 w-3 sm:h-4 sm:w-4 text-[#abaafd]" /> Configuración comercial
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onPreview} className="gap-2 rounded-xl border-[#abaafd]/30 text-[#abaafd] hover:bg-[#abaafd]/10 px-4 sm:px-6 font-bold h-9 sm:h-11">
                <Eye className="h-4 w-4" /> <span className="hidden sm:inline">Previsualizar</span>
              </Button>
            </div>

            {/* Cliente y Proyecto */}
            <div className="grid gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#abaafd]">Información del Cliente</Label>
                  <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                    <DialogTrigger>
                      <span className="h-auto p-0 text-xs text-[#abaafd] font-bold cursor-pointer hover:underline flex items-center">
                        <Plus className="h-3 w-3 mr-1" /> Nuevo Cliente
                      </span>
                    </DialogTrigger>
                    <DialogContent className="!w-[95vw] sm:!max-w-[500px] border-none shadow-2xl rounded-3xl p-6 sm:p-8">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-[#2e3c7e] tracking-tighter">Registrar Cliente</DialogTitle>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Añadido rápido a base de datos</p>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase text-primary/40">Nombre o Empresa</Label>
                          <Input placeholder="Ej: Juan Perez" value={newClient.nombre} onChange={e => setNewClient({...newClient, nombre: e.target.value})} className="bg-muted/50 border-none h-12 rounded-xl text-base" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase text-primary/40">Teléfono</Label>
                          <Input placeholder="+56 9..." value={newClient.telefono} onChange={e => setNewClient({...newClient, telefono: e.target.value})} className="bg-muted/50 border-none h-12 rounded-xl text-base" />
                        </div>
                        
                        <div className="pt-4 border-t border-muted/20 mt-2">
                          <Label className="text-[10px] font-black uppercase text-[#abaafd] mb-4 block">Redes Sociales / Web</Label>
                          <div className="grid gap-3">
                            <div className="relative">
                              <Input placeholder="Instagram (@usuario)" value={newClient.social_instagram} onChange={e => setNewClient({...newClient, social_instagram: e.target.value})} className="bg-muted/30 border-none h-10 pl-4 rounded-xl text-sm" />
                            </div>
                            <div className="relative">
                              <Input placeholder="LinkedIn (URL)" value={newClient.social_linkedin} onChange={e => setNewClient({...newClient, social_linkedin: e.target.value})} className="bg-muted/30 border-none h-10 pl-4 rounded-xl text-sm" />
                            </div>
                            <div className="relative">
                              <Input placeholder="Sitio Web (https://...)" value={newClient.social_web} onChange={e => setNewClient({...newClient, social_web: e.target.value})} className="bg-muted/30 border-none h-10 pl-4 rounded-xl text-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button onClick={handleCreateClient} disabled={isCreatingClient} className="w-full rounded-2xl h-14 bg-[#abaafd] text-[#2e3c7e] font-black text-lg hover:scale-105 transition-all shadow-xl shadow-[#abaafd]/20">
                        {isCreatingClient ? "Guardando..." : "Guardar Cliente"}
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-300">Cliente Asignado</Label>
                    <Select value={selectedCliente} onValueChange={(val) => setSelectedCliente(val || "")}>
                      <SelectTrigger className="bg-muted/20 border-2 border-white/15 h-12 text-sm font-bold px-4 rounded-xl shadow-inner transition-all hover:bg-muted/30">
                        <SelectValue>{currentClienteName || "Selecciona un cliente..."}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/15 text-foreground">
                        {clientes.map(c => <SelectItem key={c.id} value={c.id!}>{c.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-300">Estado del Presupuesto</Label>
                    <Select 
                      value={estado} 
                      onValueChange={(val) => {
                        if (val && setEstado) setEstado(val as PresupuestoEstado);
                      }}
                    >
                      <SelectTrigger className="bg-muted/20 border-2 border-white/15 h-12 text-sm font-bold px-4 rounded-xl shadow-inner transition-all hover:bg-muted/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/15 text-foreground">
                        <SelectItem value="borrador">📝 Borrador Interno</SelectItem>
                        <SelectItem value="enviado">📤 Enviado al Cliente</SelectItem>
                        <SelectItem value="en_negociacion">💬 En Negociación / Feedback</SelectItem>
                        <SelectItem value="aprobado">✅ Aprobado</SelectItem>
                        <SelectItem value="rechazado">❌ Rechazado</SelectItem>
                        <SelectItem value="vencido">⏸️ Vencido / Descartado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Selección Dual de Moneda: CLP vs UF */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-white/10 bg-slate-950/40">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-300">Moneda de la Propuesta</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={moneda === "CLP" ? "default" : "outline"}
                        onClick={() => setMoneda && setMoneda("CLP")}
                        className={`h-11 text-xs font-black rounded-xl border-2 transition-all ${
                          moneda === "CLP" ? "bg-primary text-primary-foreground border-primary" : "border-white/15 bg-card/60 text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        🇨🇱 CLP (Pesos)
                      </Button>
                      <Button
                        type="button"
                        variant={moneda === "UF" ? "default" : "outline"}
                        onClick={() => setMoneda && setMoneda("UF")}
                        className={`h-11 text-xs font-black rounded-xl border-2 transition-all ${
                          moneda === "UF" ? "bg-primary text-primary-foreground border-primary" : "border-white/15 bg-card/60 text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        📈 UF (Referencial)
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-black uppercase tracking-wider text-slate-300">Valor UF Referencial (CLP)</Label>
                      {moneda === "UF" && (
                        <span className="text-[10px] font-bold text-emerald-400">
                          1 UF = ${valorUF.toLocaleString('es-CL')}
                        </span>
                      )}
                    </div>
                    <Input
                      type="number"
                      value={valorUF}
                      onChange={(e) => setValorUF && setValorUF(Number(e.target.value) || 38000)}
                      placeholder="38000"
                      className="bg-muted/20 border-2 border-white/15 h-11 text-sm font-bold px-4 rounded-xl shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-300">Nombre del Proyecto / Asunto</Label>
                <Input 
                  placeholder="Ej: Desarrollo de Plataforma E-commerce y Sistema POS"
                  value={proyecto}
                  onChange={(e) => setProyecto(e.target.value)}
                  className="bg-muted/20 border-2 border-white/15 h-12 text-sm sm:text-base font-bold px-4 rounded-xl shadow-inner transition-all hover:bg-muted/30"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-300">Descripción del Alcance Comercial</Label>
                <Textarea 
                  placeholder="Ej: El proyecto consiste en el desarrollo e implementación de..."
                  value={descripcionProyecto}
                  onChange={(e) => setDescripcionProyecto(e.target.value)}
                  className="bg-muted/20 border-2 border-white/15 min-h-[90px] text-sm font-medium px-4 py-3 rounded-xl shadow-inner transition-all hover:bg-muted/30 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="space-y-6 sm:space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3 sm:gap-4 text-foreground">
                <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-[#abaafd] text-[#2e3c7e] shadow-lg shadow-[#abaafd]/20 text-xs sm:text-sm">01</span>
                Servicios
              </h2>
              <Button onClick={() => addItem()} size="sm" className="rounded-xl gap-2 px-4 sm:px-6 shadow-xl shadow-[#abaafd]/10 h-9 sm:h-10 bg-[#abaafd] text-[#2e3c7e] font-bold hover:scale-105 transition-all text-xs">
                <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Añadir Item</span><span className="sm:hidden">Añadir</span>
              </Button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {items.map((item, index) => (
                <Card key={index} className="border-none shadow-md bg-card/50 backdrop-blur-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-5 sm:p-8">
                    <div className="grid gap-4 sm:gap-8">
                      <div className="w-full">
                        <Label className="text-[9px] font-black uppercase text-primary/40 mb-2 block">Descripción Detallada</Label>
                        <Textarea 
                          value={item.descripcion}
                          onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                          placeholder="Describe el servicio..."
                          className="bg-transparent border-none p-0 focus-visible:ring-0 min-h-[40px] sm:min-h-[60px] text-sm sm:text-lg font-bold resize-none leading-relaxed text-foreground w-full"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 border-t border-muted/20 pt-4 sm:pt-6">
                        <div className="flex gap-4 sm:gap-8">
                          <div className="flex-1 sm:w-40">
                            <Label className="text-[9px] font-black uppercase text-primary/40 mb-2 block">Precio Unitario</Label>
                            <div className="relative">
                              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs sm:text-sm">$</span>
                              <Input 
                                type="number"
                                value={Number.isNaN(item.precio) ? "" : item.precio}
                                onChange={(e) => updateItem(index, 'precio', parseFloat(e.target.value))}
                                className="bg-muted/20 border-none h-10 sm:h-12 font-black text-sm sm:text-lg pl-6 sm:pl-8 rounded-xl w-full"
                              />
                            </div>
                          </div>
                          <div className="w-16 sm:w-24">
                            <Label className="text-[9px] font-black uppercase text-primary/40 mb-2 block text-center">Cant.</Label>
                            <Input 
                              type="number"
                              value={Number.isNaN(item.cantidad) ? "" : item.cantidad}
                              onChange={(e) => updateItem(index, 'cantidad', parseInt(e.target.value))}
                              className="bg-muted/20 border-none h-10 sm:h-12 font-black text-sm sm:text-lg text-center rounded-xl w-full"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-none border-muted/10">
                          <div className="text-left sm:text-right">
                            <Label className="text-[9px] font-black uppercase text-secondary/40 mb-1 block">Total Item</Label>
                            <span className="font-black text-secondary text-lg sm:text-2xl">${item.total.toLocaleString()}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-10 w-10 sm:h-12 sm:w-12 text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-xl">
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Servicios Opcionales */}
          <div className="space-y-6 sm:space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3 sm:gap-4 text-foreground">
                <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-[#abaafd] text-[#2e3c7e] shadow-lg shadow-[#abaafd]/20 text-xs sm:text-sm">02</span>
                Opcionales
              </h2>
              <Button onClick={addOptionalItem} size="sm" variant="outline" className="rounded-xl gap-2 px-4 sm:px-6 border-[#abaafd]/30 text-[#abaafd] hover:bg-[#abaafd]/10 h-9 sm:h-10 font-bold text-xs">
                <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Añadir Opcional</span><span className="sm:hidden">Añadir</span>
              </Button>
            </div>

            <div className="grid gap-3 sm:gap-4">
              {optionalItems.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 bg-muted/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl group transition-all hover:bg-muted/30">
                  <Input 
                    value={item.descripcion}
                    onChange={(e) => updateOptionalItem(index, 'descripcion', e.target.value)}
                    placeholder="Mantenimiento, Hosting..."
                    className="flex-1 bg-transparent border-none font-bold text-base sm:text-xl text-foreground placeholder:text-muted-foreground/30 h-8 sm:h-auto"
                  />
                  <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-none border-muted/10 pt-3 sm:pt-0">
                    <div className="relative flex-1 sm:flex-none">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">$</span>
                      <Input 
                        type="number"
                        value={Number.isNaN(item.precio) ? "" : item.precio}
                        onChange={(e) => updateOptionalItem(index, 'precio', parseFloat(e.target.value))}
                        className="w-full sm:w-32 bg-muted/40 border-none h-10 sm:h-12 font-black text-center pl-6 rounded-xl text-sm"
                      />
                    </div>
                    <Select value={item.frecuencia} onValueChange={(val) => { if (val) updateOptionalItem(index, 'frecuencia', val); }}>
                      <SelectTrigger className="w-28 sm:w-36 bg-muted/40 border-none h-10 sm:h-12 font-bold rounded-xl text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mensual">Mensual</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                        <SelectItem value="Pago Único">Pago Único</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removeOptionalItem(index)} className="h-10 w-10 text-muted-foreground/20 hover:text-destructive">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloque 1: Desarrollo e Implementación (Cobro único, 50/50) */}
          <div className="space-y-4 p-6 rounded-2xl border-2 border-white/15 bg-slate-900/60 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black">
                  B1
                </span>
                Desarrollo e Implementación (Cobro Único)
              </h3>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                50% Anticipo / 50% Entrega
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-white/10 bg-card/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                  1. Anticipo para Inicio (50%)
                </span>
                <span className="text-xl font-black text-emerald-400">
                  {moneda === "UF" 
                    ? `${(totales.total * 0.5).toLocaleString('es-CL')} UF` 
                    : `$${Math.round(totales.total * 0.5).toLocaleString('es-CL')} CLP`}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1">Requerido para reserva de agenda y despliegue de infraestructura base.</p>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-card/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                  2. Contra Entrega y Conformidad (50%)
                </span>
                <span className="text-xl font-black text-primary">
                  {moneda === "UF" 
                    ? `${(totales.total * 0.5).toLocaleString('es-CL')} UF` 
                    : `$${Math.round(totales.total * 0.5).toLocaleString('es-CL')} CLP`}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1">Contra acta de entrega, capacitación y paso a producción.</p>
              </div>
            </div>
          </div>

          {/* Bloque 2: Continuidad, Hosting y Soporte */}
          <div className="space-y-4 p-6 rounded-2xl border-2 border-white/15 bg-slate-900/60 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 text-xs font-black">
                  B2
                </span>
                Continuidad, Hosting y Soporte Técnico
              </h3>
              <span className="text-xs font-bold text-slate-400">
                Garantía y operación del sistema
              </span>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-300">Modalidad de Continuidad</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={modalidadContinuidad === "incluido_ano1" || modalidadContinuidad === "ano_1_incluido" ? "default" : "outline"}
                    onClick={() => setModalidadContinuidad && setModalidadContinuidad("incluido_ano1")}
                    className={`h-11 text-xs font-bold rounded-xl border-2 transition-all ${
                      modalidadContinuidad === "incluido_ano1" || modalidadContinuidad === "ano_1_incluido" ? "bg-sky-600 text-white border-sky-500" : "border-white/15 bg-card text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    🎁 Año 1 Incluido (Bonificado)
                  </Button>
                  <Button
                    type="button"
                    variant={modalidadContinuidad === "mensual" || modalidadContinuidad === "recurrente_mensual" ? "default" : "outline"}
                    onClick={() => setModalidadContinuidad && setModalidadContinuidad("mensual")}
                    className={`h-11 text-xs font-bold rounded-xl border-2 transition-all ${
                      modalidadContinuidad === "mensual" || modalidadContinuidad === "recurrente_mensual" ? "bg-sky-600 text-white border-sky-500" : "border-white/15 bg-card text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    🔄 Cobro Mensual desde Entrega
                  </Button>
                  <Button
                    type="button"
                    variant={modalidadContinuidad === "anual" || modalidadContinuidad === "recurrente_anual" ? "default" : "outline"}
                    onClick={() => setModalidadContinuidad && setModalidadContinuidad("anual")}
                    className={`h-11 text-xs font-bold rounded-xl border-2 transition-all ${
                      modalidadContinuidad === "anual" || modalidadContinuidad === "recurrente_anual" ? "bg-sky-600 text-white border-sky-500" : "border-white/15 bg-card text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    📅 Cobro Anual desde Entrega
                  </Button>
                </div>
              </div>

              {modalidadContinuidad !== "incluido_ano1" && modalidadContinuidad !== "ano_1_incluido" && (
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Monto Recurrente ({modalidadContinuidad === "mensual" || modalidadContinuidad === "recurrente_mensual" ? "Mensual" : "Anual"}) ({moneda})
                  </Label>
                  <Input
                    type="number"
                    value={montoContinuidad}
                    onChange={(e) => setMontoContinuidad && setMontoContinuidad(Number(e.target.value) || 0)}
                    placeholder="Monto de mantención y hosting..."
                    className="bg-muted/20 border-2 border-white/15 h-11 text-sm font-bold px-4 rounded-xl shadow-inner"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-300">Detalle de Infraestructura y Casillas</Label>
                <Textarea
                  value={detalleContinuidad}
                  onChange={(e) => setDetalleContinuidad && setDetalleContinuidad(e.target.value)}
                  placeholder="Detalla hosting cPanel, casillas corporativas, SSL, copias de seguridad..."
                  className="bg-muted/20 border-2 border-white/15 min-h-[70px] text-xs font-medium px-4 py-3 rounded-xl resize-none shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Enlace Público Comercial */}
          {tokenPublico && (
            <div className="p-4 rounded-2xl border-2 border-primary/30 bg-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                  🌐 Enlace Público para el Cliente (/propuesta/[token])
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  El cliente podrá revisar la propuesta y presionar &quot;Aceptar Propuesta y Coordinar Inicio&quot;.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/propuesta/${tokenPublico}`;
                  navigator.clipboard.writeText(url);
                  alert("¡Enlace público copiado al portapapeles!\n" + url);
                }}
                className="h-10 text-xs font-bold rounded-xl border-primary/40 text-primary bg-primary/20 hover:bg-primary/30 shrink-0"
              >
                Copiar Enlace Público
              </Button>
            </div>
          )}

          {/* Condiciones */}
          <div className="space-y-8">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-sm text-sm">03</span>
              Condiciones de Venta
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(params).map(([key, value]) => (
                <div key={key} className="flex gap-6 items-center bg-card p-6 rounded-2xl shadow-sm border border-muted/10">
                  <div className="flex-1">
                    <Label className="text-[10px] font-black uppercase text-secondary/50 mb-2 block">{key}</Label>
                    <Input 
                      value={value}
                      onChange={(e) => updateParam(key, key, e.target.value)}
                      className="bg-transparent border-none h-10 p-0 text-lg font-black text-secondary focus-visible:ring-0"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeParam(key)} className="h-10 w-10 text-muted-foreground/20 hover:text-destructive">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER FIJO - CON ALTURA DEFINIDA Y SHRANK ZERO */}
      <div className="shrink-0 h-auto bg-secondary text-secondary-foreground shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10 backdrop-blur-3xl px-4 sm:px-12 py-4 sm:py-8 z-20">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
          <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-12 flex-1 w-full">
            <div className="flex flex-col min-w-fit">
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-40">Neto</span>
              <span className="text-sm sm:text-xl font-bold">${totales.neto.toLocaleString()}</span>
            </div>
            <div className="flex flex-col min-w-fit">
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-40">IVA (19%)</span>
              <span className="text-sm sm:text-xl font-bold">${totales.iva.toLocaleString()}</span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-4 sm:pl-12 min-w-[120px] sm:min-w-[150px]">
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[#abaafd] mb-0.5">Total Proyecto</span>
              <span className="text-xl sm:text-3xl md:text-4xl font-black tracking-tighter text-[#abaafd] whitespace-nowrap">${totales.total.toLocaleString()}</span>
            </div>
          </div>
          <Button 
            onClick={onSave} 
            disabled={isSaving} 
            className="w-full sm:w-auto shrink-0 gap-3 sm:gap-4 rounded-xl sm:rounded-2xl h-12 sm:h-16 px-8 sm:px-12 text-base sm:text-xl font-black shadow-2xl shadow-[#abaafd]/20 hover:scale-105 transition-all bg-[#abaafd] text-[#2e3c7e]"
          >
            <Save className="h-4 w-4 sm:h-5 sm:w-5" /> 
            <span>{isSaving ? "Guardando..." : "Finalizar"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
