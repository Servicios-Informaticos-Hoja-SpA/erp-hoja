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
import { Cliente, Servicio, PresupuestoItem } from "@/lib/types";
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
  DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface PresupuestoFormViewProps {
  clientes: Cliente[];
  catalogo: Servicio[];
  selectedCliente: string;
  setSelectedCliente: (id: string) => void;
  proyecto: string;
  setProyecto: (val: string) => void;
  items: PresupuestoItem[];
  addItem: (item?: Partial<PresupuestoItem>) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, field: keyof PresupuestoItem, value: any) => void;
  optionalItems: PresupuestoItem[];
  addOptionalItem: () => void;
  removeOptionalItem: (index: number) => void;
  updateOptionalItem: (index: number, field: keyof PresupuestoItem, value: any) => void;
  params: Record<string, string>;
  addParam: () => void;
  removeParam: (key: string) => void;
  updateParam: (oldKey: string, newKey: string, value: string) => void;
  onPreview: () => void;
  onSave: () => void;
  onAddClient: (cliente: Partial<Cliente>) => Promise<void>;
  isSaving: boolean;
  totales: { neto: number; iva: number; total: number };
}

export const PresupuestoFormView: React.FC<PresupuestoFormViewProps> = ({
  clientes,
  catalogo,
  selectedCliente,
  setSelectedCliente,
  proyecto,
  setProyecto,
  items,
  addItem,
  removeItem,
  updateItem,
  optionalItems,
  addOptionalItem,
  removeOptionalItem,
  updateOptionalItem,
  params,
  addParam,
  removeParam,
  updateParam,
  onPreview,
  onSave,
  onAddClient,
  isSaving,
  totales
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
        <div className="mx-auto w-full max-w-5xl space-y-8 sm:space-y-12 px-6 sm:px-12 py-8 sm:py-16">
          
          {/* Header Seccionado */}
          <div className="flex flex-col gap-10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tighter text-foreground leading-none">Presupuesto</h1>
                <p className="text-muted-foreground font-medium flex items-center gap-2">
                  <BadgePercent className="h-4 w-4 text-[#abaafd]" /> Configuración comercial y tributaria
                </p>
              </div>
              <Button variant="outline" onClick={onPreview} className="gap-2 rounded-xl border-[#abaafd]/30 text-[#abaafd] hover:bg-[#abaafd]/10 px-6 font-bold">
                <Eye className="h-4 w-4" /> Previsualizar
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
                <Select value={selectedCliente} onValueChange={(val) => setSelectedCliente(val || "")}>
                  <SelectTrigger className="bg-muted/30 border-none h-16 text-xl font-bold px-8 rounded-2xl shadow-inner transition-all hover:bg-muted/40">
                    <SelectValue>{currentClienteName || "Selecciona un cliente..."}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id!}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Nombre del Proyecto</Label>
                <Input 
                  placeholder="Ej: Desarrollo de Plataforma E-commerce"
                  value={proyecto}
                  onChange={(e) => setProyecto(e.target.value)}
                  className="bg-muted/30 border-none h-16 text-xl font-bold px-8 rounded-2xl shadow-inner transition-all hover:bg-muted/40"
                />
              </div>
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-4 text-foreground">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#abaafd] text-[#2e3c7e] shadow-lg shadow-[#abaafd]/20 text-sm">01</span>
                Servicios y Conceptos
              </h2>
              <Button onClick={() => addItem()} size="sm" className="rounded-xl gap-2 px-6 shadow-xl shadow-[#abaafd]/10 h-10 bg-[#abaafd] text-[#2e3c7e] font-bold hover:scale-105 transition-all">
                <Plus className="h-4 w-4" /> Añadir Item
              </Button>
            </div>

            <div className="space-y-6">
              {items.map((item, index) => (
                <Card key={index} className="border-none shadow-md bg-card/50 backdrop-blur-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="grid gap-8">
                      <div className="w-full">
                        <Label className="text-[10px] font-black uppercase text-primary/40 mb-2 block">Descripción Detallada</Label>
                        <Textarea 
                          value={item.descripcion}
                          onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                          placeholder="Describe el servicio..."
                          className="bg-transparent border-none p-0 focus-visible:ring-0 min-h-[60px] text-lg font-bold resize-none leading-relaxed text-foreground w-full"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-t border-muted/20 pt-6">
                        <div className="flex gap-4 sm:gap-8">
                          <div className="flex-1 sm:w-40">
                            <Label className="text-[10px] font-black uppercase text-primary/40 mb-2 block">Precio Unitario</Label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                              <Input 
                                type="number"
                                value={item.precio}
                                onChange={(e) => updateItem(index, 'precio', parseFloat(e.target.value))}
                                className="bg-muted/20 border-none h-12 font-black text-lg pl-8 rounded-xl w-full"
                              />
                            </div>
                          </div>
                          <div className="w-20 sm:w-24">
                            <Label className="text-[10px] font-black uppercase text-primary/40 mb-2 block text-center">Cant.</Label>
                            <Input 
                              type="number"
                              value={item.cantidad}
                              onChange={(e) => updateItem(index, 'cantidad', parseInt(e.target.value))}
                              className="bg-muted/20 border-none h-12 font-black text-lg text-center rounded-xl w-full"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t sm:border-none border-muted/10">
                          <div className="text-left sm:text-right">
                            <Label className="text-[10px] font-black uppercase text-[#abaafd]/60 mb-2 block">Total Item</Label>
                            <span className="font-black text-[#abaafd] text-2xl">${item.total.toLocaleString()}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-12 w-12 text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-xl">
                            <Trash2 className="h-5 w-5" />
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
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-4 text-foreground">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#abaafd] text-[#2e3c7e] shadow-lg shadow-[#abaafd]/20 text-sm">02</span>
                Costos Opcionales / Recurrentes
              </h2>
              <Button onClick={addOptionalItem} size="sm" variant="outline" className="rounded-xl gap-2 px-6 border-[#abaafd]/30 text-[#abaafd] hover:bg-[#abaafd]/10 h-10 font-bold">
                <Plus className="h-4 w-4" /> Añadir Opcional
              </Button>
            </div>

            <div className="grid gap-4">
              {optionalItems.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row items-center gap-6 bg-muted/20 p-6 rounded-2xl group transition-all hover:bg-muted/30">
                  <Input 
                    value={item.descripcion}
                    onChange={(e) => updateOptionalItem(index, 'descripcion', e.target.value)}
                    placeholder="Mantenimiento, Hosting, etc..."
                    className="flex-1 bg-transparent border-none font-bold text-xl text-foreground placeholder:text-muted-foreground/30"
                  />
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">$</span>
                      <Input 
                        type="number"
                        value={item.precio}
                        onChange={(e) => updateOptionalItem(index, 'precio', parseFloat(e.target.value))}
                        className="w-36 bg-muted/40 border-none h-12 font-black text-center pl-8 rounded-xl"
                      />
                    </div>
                    <Select value={item.frecuencia} onValueChange={(val) => updateOptionalItem(index, 'frecuencia', val)}>
                      <SelectTrigger className="w-36 bg-muted/40 border-none h-12 font-bold rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mensual">Mensual</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
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
                    <Label className="text-[10px] font-black uppercase text-primary/40 mb-2 block">{key}</Label>
                    <Input 
                      value={value}
                      onChange={(e) => updateParam(key, key, e.target.value)}
                      className="bg-transparent border-none h-10 p-0 text-lg font-black text-primary focus-visible:ring-0"
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
      <div className="shrink-0 h-auto bg-secondary text-secondary-foreground shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10 backdrop-blur-3xl px-6 sm:px-12 py-6 sm:py-8 z-20">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 sm:gap-12 flex-1 w-full">
            <div className="flex flex-col min-w-fit">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40">Neto</span>
              <span className="text-lg sm:text-xl font-bold">${totales.neto.toLocaleString()}</span>
            </div>
            <div className="flex flex-col min-w-fit">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40">IVA (19%)</span>
              <span className="text-lg sm:text-xl font-bold">${totales.iva.toLocaleString()}</span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-6 sm:pl-12 min-w-[150px]">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#abaafd] mb-1">Total Proyecto</span>
              <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-[#abaafd] whitespace-nowrap">${totales.total.toLocaleString()}</span>
            </div>
          </div>
          <Button 
            onClick={onSave} 
            disabled={isSaving} 
            className="w-full sm:w-auto shrink-0 gap-4 rounded-2xl px-12 py-6 text-lg sm:text-xl font-black shadow-2xl shadow-[#abaafd]/20 hover:scale-105 transition-all bg-[#abaafd] text-[#2e3c7e]"
          >
            <Save className="h-5 w-5" /> 
            <span>{isSaving ? "Guardando..." : "Finalizar"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
