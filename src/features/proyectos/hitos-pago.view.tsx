"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HitoPago } from "@/lib/types";
import { toast } from "sonner";

interface HitosPagoViewProps {
  hitosPago: HitoPago[];
  montoTotal: number;
  onChange: (newHitos: HitoPago[]) => void;
}

export const HitosPagoView: React.FC<HitosPagoViewProps> = ({
  hitosPago = [],
  montoTotal = 0,
  onChange,
}) => {
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoPorcentaje, setNuevoPorcentaje] = useState(50);
  const [nuevaFecha, setNuevaFecha] = useState("");

  const formatCLP = (val: number = 0) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

  const totalCobrado = hitosPago
    .filter((h) => h.estado === "cobrado")
    .reduce((acc, curr) => acc + (curr.monto || 0), 0);
  
  const totalPendiente = montoTotal - totalCobrado;
  const porcentajeCobrado = montoTotal > 0 ? Math.min(100, Math.round((totalCobrado / montoTotal) * 100)) : 0;

  const handleToggleEstado = (id: string) => {
    const updated = hitosPago.map((h) => {
      if (h.id === id) {
        const nextEstado = h.estado === "cobrado" ? "pendiente" : "cobrado";
        return {
          ...h,
          estado: nextEstado as "pendiente" | "cobrado",
          fechaCobroReal: nextEstado === "cobrado" ? new Date().toISOString().split("T")[0] : undefined,
        };
      }
      return h;
    });
    onChange(updated);
    toast.success("Estado de hito actualizado");
  };

  const handleAddHito = () => {
    if (!nuevoTitulo.trim()) return;
    const montoCalculado = Math.round((montoTotal * (nuevoPorcentaje || 0)) / 100);
    const newHito: HitoPago = {
      id: `hito-${Date.now()}`,
      titulo: nuevoTitulo.trim(),
      porcentaje: nuevoPorcentaje,
      monto: montoCalculado,
      fechaEstimada: nuevaFecha || new Date().toISOString().split("T")[0],
      estado: "pendiente",
    };
    onChange([...hitosPago, newHito]);
    setNuevoTitulo("");
    toast.success("Hito de pago agregado");
  };

  const handleDeleteHito = (id: string) => {
    onChange(hitosPago.filter((h) => h.id !== id));
  };

  const handleApplyPreset = (preset: "50-50" | "30-30-40" | "100") => {
    let presetHitos: HitoPago[] = [];
    const today = new Date().toISOString().split("T")[0];

    if (preset === "50-50") {
      presetHitos = [
        {
          id: `hito-1-${Date.now()}`,
          titulo: "50% Anticipo de Inicio",
          porcentaje: 50,
          monto: Math.round(montoTotal * 0.5),
          fechaEstimada: today,
          estado: "pendiente",
        },
        {
          id: `hito-2-${Date.now()}`,
          titulo: "50% Contra Entrega y Conformidad",
          porcentaje: 50,
          monto: Math.round(montoTotal * 0.5),
          fechaEstimada: "",
          estado: "pendiente",
        },
      ];
    } else if (preset === "30-30-40") {
      presetHitos = [
        {
          id: `hito-1-${Date.now()}`,
          titulo: "30% Inicio y Planificación",
          porcentaje: 30,
          monto: Math.round(montoTotal * 0.3),
          fechaEstimada: today,
          estado: "pendiente",
        },
        {
          id: `hito-2-${Date.now()}`,
          titulo: "30% Avance y Prototipo Funcional",
          porcentaje: 30,
          monto: Math.round(montoTotal * 0.3),
          fechaEstimada: "",
          estado: "pendiente",
        },
        {
          id: `hito-3-${Date.now()}`,
          titulo: "40% Entrega Final y Puesta en Marcha",
          porcentaje: 40,
          monto: Math.round(montoTotal * 0.4),
          fechaEstimada: "",
          estado: "pendiente",
        },
      ];
    } else if (preset === "100") {
      presetHitos = [
        {
          id: `hito-1-${Date.now()}`,
          titulo: "100% Pago Total Anticipado",
          porcentaje: 100,
          monto: montoTotal,
          fechaEstimada: today,
          estado: "pendiente",
        },
      ];
    }

    onChange(presetHitos);
    toast.success("Plantilla de hitos aplicada");
  };

  return (
    <div className="space-y-6">
      {/* Resumen Financiero del Proyecto */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card/60 border border-white/10 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Presupuestado</span>
          <p className="text-xl font-black text-foreground">{formatCLP(montoTotal)}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Total Cobrado</span>
          <p className="text-xl font-black text-emerald-400">{formatCLP(totalCobrado)}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Saldo por Cobrar</span>
          <p className="text-xl font-black text-amber-400">{formatCLP(totalPendiente)}</p>
        </div>
      </div>

      {/* Barra de Recaudación y Presets */}
      <div className="p-4 rounded-2xl bg-card/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-muted-foreground">Progreso de Cobranza</span>
            <span className="text-primary">{porcentajeCobrado}% liquidado</span>
          </div>
          <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all duration-500"
              style={{ width: `${porcentajeCobrado}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-muted-foreground">Presets:</span>
          <Button variant="outline" size="sm" onClick={() => handleApplyPreset("50-50")} className="h-8 text-xs font-bold rounded-lg border-white/10">
            50% / 50%
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleApplyPreset("30-30-40")} className="h-8 text-xs font-bold rounded-lg border-white/10">
            30/30/40
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleApplyPreset("100")} className="h-8 text-xs font-bold rounded-lg border-white/10">
            100%
          </Button>
        </div>
      </div>

      {/* Agregar Hito Manual */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <Input 
          value={nuevoTitulo}
          onChange={(e) => setNuevoTitulo(e.target.value)}
          placeholder="Concepto del hito (ej. 2da Cuota)"
          className="bg-card/50 border-white/10 h-10 rounded-xl text-xs font-medium sm:col-span-2"
        />
        <div className="flex items-center gap-2">
          <Input 
            type="number"
            min={1}
            max={100}
            value={nuevoPorcentaje}
            onChange={(e) => setNuevoPorcentaje(Number(e.target.value))}
            placeholder="%"
            className="w-20 bg-card/50 border-white/10 h-10 rounded-xl text-xs font-bold"
          />
          <Input 
            type="date"
            value={nuevaFecha}
            onChange={(e) => setNuevaFecha(e.target.value)}
            className="bg-card/50 border-white/10 h-10 rounded-xl text-xs font-bold flex-1"
          />
        </div>
        <Button
          onClick={handleAddHito}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-black text-xs gap-1.5"
        >
          <Plus className="h-4 w-4" /> Agregar Hito
        </Button>
      </div>

      {/* Lista de Hitos */}
      <div className="space-y-2.5">
        {hitosPago.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs font-medium border border-dashed border-white/10 rounded-2xl">
            No se han definido hitos de pago para este proyecto. Aplica un preset o agrega uno manualmente.
          </div>
        ) : (
          hitosPago.map((hito) => (
            <div
              key={hito.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                hito.estado === "cobrado"
                  ? "bg-emerald-500/5 border-emerald-500/20 text-muted-foreground"
                  : "bg-card/50 border-white/10 text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleEstado(hito.id)}
                  className="shrink-0 transition-transform active:scale-95"
                >
                  {hito.estado === "cobrado" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-400" />
                  )}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-foreground">{hito.titulo}</span>
                    <Badge variant={hito.estado === "cobrado" ? "default" : "outline"} className={`text-[10px] ${
                      hito.estado === "cobrado" ? "bg-emerald-500 text-white" : "border-amber-400/50 text-amber-400"
                    }`}>
                      {hito.estado === "cobrado" ? "Cobrado" : "Pendiente"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 font-medium">
                    <span>{hito.porcentaje}% del total</span>
                    <span>&bull;</span>
                    <span>Fecha límite: {hito.fechaEstimada || "Por coordinar"}</span>
                    {hito.fechaCobroReal && (
                      <>
                        <span>&bull;</span>
                        <span className="text-emerald-400">Cobrado el: {hito.fechaCobroReal}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-none border-white/5">
                <span className="text-base sm:text-lg font-black text-foreground">
                  {formatCLP(hito.monto)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteHito(hito.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                  title="Eliminar hito"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
