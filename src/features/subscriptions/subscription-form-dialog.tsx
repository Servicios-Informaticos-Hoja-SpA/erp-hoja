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
  TipoServicioRecurrente, 
  ProveedorInfraestructura, 
  CicloFacturacion, 
  EstadoSuscripcion 
} from "@/lib/types";

interface SubscriptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription | null;
  clientes: Cliente[];
  onSave: (data: Partial<Subscription>) => Promise<void>;
}

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  subscription,
  clientes,
  onSave,
}: SubscriptionFormDialogProps) {
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [dominio, setDominio] = useState("");
  const [tipoServicio, setTipoServicio] = useState<TipoServicioRecurrente>("Web Corporativa");
  const [proveedor, setProveedor] = useState<ProveedorInfraestructura>("Bluehosting cPanel");
  const [cicloFacturacion, setCicloFacturacion] = useState<CicloFacturacion>("anual");
  const [monto, setMonto] = useState<number>(0);
  const [moneda, setMoneda] = useState<"CLP" | "UF">("CLP");
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().split("T")[0]);
  const [fechaCorte, setFechaCorte] = useState<string>("");
  const [estado, setEstado] = useState<EstadoSuscripcion>("activo");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (subscription) {
      setClienteId(subscription.clienteId || "");
      setClienteNombre(subscription.clienteNombre || "");
      setDominio(subscription.dominio || "");
      setTipoServicio(subscription.tipoServicio || "Web Corporativa");
      setProveedor(subscription.proveedor || "Bluehosting cPanel");
      setCicloFacturacion(subscription.cicloFacturacion || "anual");
      setMonto(subscription.monto || 0);
      setMoneda(subscription.moneda || "CLP");
      setFechaInicio(subscription.fechaInicio ? subscription.fechaInicio.split("T")[0] : new Date().toISOString().split("T")[0]);
      setFechaCorte(subscription.fechaCorte ? subscription.fechaCorte.split("T")[0] : "");
      setEstado(subscription.estado || "activo");
      setNotas(subscription.notas || "");
    } else {
      setClienteId("");
      setClienteNombre("");
      setDominio("");
      setTipoServicio("Web Corporativa");
      setProveedor("Bluehosting cPanel");
      setCicloFacturacion("anual");
      setMonto(0);
      setMoneda("CLP");
      const today = new Date();
      setFechaInicio(today.toISOString().split("T")[0]);
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setFechaCorte(nextYear.toISOString().split("T")[0]);
      setEstado("activo");
      setNotas("");
    }
  }, [subscription, open]);

  const handleClienteChange = (selectedId: string) => {
    setClienteId(selectedId);
    const cli = clientes.find((c) => c.id === selectedId);
    if (cli) {
      setClienteNombre(cli.nombre);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre || !dominio || !fechaCorte || monto < 0) {
      alert("Por favor completa los campos obligatorios: Cliente, Dominio, Monto y Fecha de Corte.");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        clienteId: clienteId || undefined,
        clienteNombre,
        dominio: dominio.trim().toLowerCase(),
        tipoServicio,
        proveedor,
        cicloFacturacion,
        monto,
        moneda,
        fechaInicio,
        fechaCorte,
        estado,
        notas: notas.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      alert("Error al guardar el servicio recurrente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] bg-slate-900 border-white/15 text-slate-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-white">
            {subscription ? "Editar Servicio Recurrente" : "Nuevo Servicio Recurrente / Suscripción"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Cliente selector o texto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Cliente Registrado</Label>
              <Select 
                value={clienteId} 
                onValueChange={(val) => {
                  if (val) handleClienteChange(val);
                }}
              >
                <SelectTrigger className="bg-slate-950 border-white/15 text-white">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/15 text-white max-h-56">
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id!}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Nombre / Razón Social *</Label>
              <Input
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej. Comercial Hoja Ltda."
                required
                className="bg-slate-950 border-white/15 text-white"
              />
            </div>
          </div>

          {/* Dominio y Tipo de Servicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Dominio del Servicio *</Label>
              <Input
                value={dominio}
                onChange={(e) => setDominio(e.target.value)}
                placeholder="ejemplo.cl"
                required
                className="bg-slate-950 border-white/15 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Tipo de Servicio *</Label>
              <Select 
                value={tipoServicio} 
                onValueChange={(val) => setTipoServicio(val as TipoServicioRecurrente)}
              >
                <SelectTrigger className="bg-slate-950 border-white/15 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/15 text-white">
                  <SelectItem value="Solo Correos">📧 Solo Correos Corporativos</SelectItem>
                  <SelectItem value="Web Corporativa">🌐 Web Corporativa (WordPress)</SelectItem>
                  <SelectItem value="E-Commerce WooCommerce">🛒 E-Commerce WooCommerce</SelectItem>
                  <SelectItem value="Web App">⚡ Web App Cloud</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Proveedor y Ciclo de Facturación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Proveedor Infraestructura</Label>
              <Select 
                value={proveedor} 
                onValueChange={(val) => setProveedor(val as ProveedorInfraestructura)}
              >
                <SelectTrigger className="bg-slate-950 border-white/15 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/15 text-white">
                  <SelectItem value="Bluehosting cPanel">Bluehosting cPanel (Reseller)</SelectItem>
                  <SelectItem value="Vercel">Vercel</SelectItem>
                  <SelectItem value="Hetzner">Hetzner VPS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Ciclo de Facturación</Label>
              <Select 
                value={cicloFacturacion} 
                onValueChange={(val) => setCicloFacturacion(val as CicloFacturacion)}
              >
                <SelectTrigger className="bg-slate-950 border-white/15 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/15 text-white">
                  <SelectItem value="anual">📅 Anual</SelectItem>
                  <SelectItem value="mensual">🗓️ Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Moneda</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={moneda === "CLP" ? "default" : "outline"}
                  onClick={() => setMoneda("CLP")}
                  className={`h-10 text-xs font-black ${moneda === "CLP" ? "bg-primary text-primary-foreground" : "border-white/15 text-slate-300"}`}
                >
                  Pesos (CLP)
                </Button>
                <Button
                  type="button"
                  variant={moneda === "UF" ? "default" : "outline"}
                  onClick={() => setMoneda("UF")}
                  className={`h-10 text-xs font-black ${moneda === "UF" ? "bg-primary text-primary-foreground" : "border-white/15 text-slate-300"}`}
                >
                  UF (Chile)
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">
                Monto Recurrente ({moneda}) *
              </Label>
              <Input
                type="number"
                step={moneda === "UF" ? "0.01" : "1"}
                value={monto}
                onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                required
                className="bg-slate-950 border-white/15 text-white font-mono text-base font-bold"
              />
            </div>
          </div>

          {/* Fechas de Inicio y Corte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Fecha de Inicio</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="bg-slate-950 border-white/15 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-amber-300">Fecha de Corte / Vencimiento *</Label>
              <Input
                type="date"
                value={fechaCorte}
                onChange={(e) => setFechaCorte(e.target.value)}
                required
                className="bg-slate-950 border-amber-500/40 text-amber-200 font-bold"
              />
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">Estado Inicial</Label>
            <Select 
              value={estado} 
              onValueChange={(val) => setEstado(val as EstadoSuscripcion)}
            >
              <SelectTrigger className="bg-slate-950 border-white/15 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/15 text-white">
                <SelectItem value="activo">🟢 Activo</SelectItem>
                <SelectItem value="por_vencer">🟡 Por Vencer (Alerta preventivo)</SelectItem>
                <SelectItem value="vencido">🔴 Vencido</SelectItem>
                <SelectItem value="suspendido">⏸️ Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">Notas u Observaciones</Label>
            <Input
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Plan cPanel Reseller 5GB, 10 cuentas de correo"
              className="bg-slate-950 border-white/15 text-white"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/15 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-600/30"
            >
              {saving ? "Guardando..." : subscription ? "Guardar Cambios" : "Crear Suscripción"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
