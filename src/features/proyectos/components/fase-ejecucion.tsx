"use client";

import React, { useState, useMemo } from "react";
import { 
  Proyecto, 
  ChecklistItem, 
  EstadoKanban, 
  HitoPago, 
  SolicitudCambio 
} from "@/lib/types";
import { 
  CheckSquare, 
  Kanban, 
  BarChart2, 
  GitPullRequest, 
  DollarSign, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  User, 
  ArrowRight, 
  Check, 
  ChevronRight,
  Filter,
  Sparkles,
  Receipt,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface FaseEjecucionProps {
  proyecto: Proyecto;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

const KANBAN_COLUMNAS: { id: EstadoKanban; label: string; color: string; border: string; bg: string }[] = [
  { id: "por_hacer", label: "Por Hacer", color: "text-slate-300", border: "border-slate-700", bg: "bg-slate-900/40" },
  { id: "en_desarrollo", label: "En Desarrollo", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-950/20" },
  { id: "bloqueado", label: "Bloqueado / Espera", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-950/20" },
  { id: "pruebas_qa", label: "Pruebas / QA", color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-950/20" },
  { id: "completado", label: "Completado", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-950/20" },
];

export const FaseEjecucion: React.FC<FaseEjecucionProps> = ({
  proyecto,
  setProyecto,
  onSave,
  isSaving,
}) => {
  const [subTab, setSubTab] = useState<"pagos" | "herramientas">("herramientas");
  const [herramientaVista, setHerramientaVista] = useState<"kanban" | "gantt">("kanban");

  // Modal para agregar tarea al checklist / kanban
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitulo, setTaskTitulo] = useState("");
  const [taskCategoria, setTaskCategoria] = useState("General");
  const [taskPrioridad, setTaskPrioridad] = useState<"baja" | "media" | "alta">("media");
  const [taskFechaInicio, setTaskFechaInicio] = useState("");
  const [taskFechaFin, setTaskFechaFin] = useState("");
  const [taskEstadoKanban, setTaskEstadoKanban] = useState<EstadoKanban>("por_hacer");
  const [taskResponsable, setTaskResponsable] = useState("Hoja SpA");

  // Modal para Solicitud de Cambio (CR)
  const [isCrModalOpen, setIsCrModalOpen] = useState(false);
  const [crTitulo, setCrTitulo] = useState("");
  const [crDescripcion, setCrDescripcion] = useState("");
  const [crHoras, setCrHoras] = useState(6);
  const [crCostoNeto, setCrCostoNeto] = useState(80000);
  const [crDiasExtension, setCrDiasExtension] = useState(3);
  const [crTerminos, setCrTerminos] = useState("Entrega e integración en rama de producción");

  // Modal para marcar pago
  const [pagoModalHito, setPagoModalHito] = useState<HitoPago | null>(null);
  const [pagoComprobante, setPagoComprobante] = useState("");
  const [pagoNumeroFactura, setPagoNumeroFactura] = useState("");
  const [pagoFechaReal, setPagoFechaReal] = useState(new Date().toISOString().split("T")[0]);

  const formatCLP = (val: number = 0) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

  // --- 1. GESTIÓN DE HITOS DE PAGO ---
  const handleUpdateHito = (index: number, field: keyof HitoPago, value: any) => {
    const hitos = Array.isArray(proyecto.hitosPago) ? [...proyecto.hitosPago] : [];
    hitos[index] = { ...hitos[index], [field]: value };
    setProyecto((prev) => prev ? { ...prev, hitosPago: hitos } : null);
  };

  const handleAddHito = () => {
    const hitos = Array.isArray(proyecto.hitosPago) ? [...proyecto.hitosPago] : [];
    const nuevoHito: HitoPago = {
      id: `hito-${Date.now()}`,
      titulo: `Pago Hito #${hitos.length + 1}`,
      porcentaje: 25,
      monto: Math.round((proyecto.montos?.total || 0) * 0.25),
      fechaEstimada: new Date().toISOString().split("T")[0],
      estado: "pendiente",
    };
    setProyecto((prev) => prev ? { ...prev, hitosPago: [...hitos, nuevoHito] } : null);
  };

  const handleRemoveHito = (index: number) => {
    const hitos = Array.isArray(proyecto.hitosPago) ? [...proyecto.hitosPago] : [];
    setProyecto((prev) => prev ? {
      ...prev,
      hitosPago: hitos.filter((_, i) => i !== index)
    } : null);
  };

  const handleConfirmarPago = () => {
    if (!pagoModalHito) return;
    const hitos = (proyecto.hitosPago || []).map((h) => {
      if (h.id === pagoModalHito.id) {
        return {
          ...h,
          estado: "cobrado" as const,
          fechaCobroReal: pagoFechaReal,
          comprobanteRef: pagoComprobante.trim() || "Transferencia verificada",
          numeroFactura: pagoNumeroFactura.trim() || undefined,
          fechaFactura: pagoFechaReal,
          tieneFactura: Boolean(pagoNumeroFactura.trim()),
        };
      }
      return h;
    });
    setProyecto((prev) => prev ? { ...prev, hitosPago: hitos } : null);
    setPagoModalHito(null);
    setPagoComprobante("");
    setPagoNumeroFactura("");
    toast.success("Pago registrado como Cobrado exitosamente y vinculado a facturación");
  };

  // --- 2. GESTIÓN DE TAREAS / KANBAN / CHECKLIST ---
  const handleToggleChecklist = (taskId?: string) => {
    if (!taskId) return;
    const checklist = (proyecto.checklist || []).map((t) => {
      if (t.id === taskId) {
        const nuevaCompletada = !t.completada;
        return {
          ...t,
          completada: nuevaCompletada,
          estadoKanban: (nuevaCompletada ? "completado" : "por_hacer") as EstadoKanban,
          completadaEn: nuevaCompletada ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    const completadas = checklist.filter((t) => t.completada).length;
    const progreso = checklist.length > 0 ? Math.round((completadas / checklist.length) * 100) : 0;

    setProyecto((prev) => prev ? {
      ...prev,
      checklist,
      progresoPorcentaje: progreso,
    } : null);
  };

  const handleMoveKanban = (taskId: string, nuevoEstado: EstadoKanban) => {
    const checklist = (proyecto.checklist || []).map((t) => {
      if (t.id === taskId) {
        const esCompletado = nuevoEstado === "completado";
        return {
          ...t,
          estadoKanban: nuevoEstado,
          completada: esCompletado,
          completadaEn: esCompletado ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    const completadas = checklist.filter((t) => t.completada).length;
    const progreso = checklist.length > 0 ? Math.round((completadas / checklist.length) * 100) : 0;

    setProyecto((prev) => prev ? {
      ...prev,
      checklist,
      progresoPorcentaje: progreso,
    } : null);
  };

  const handleCreateTask = () => {
    if (!taskTitulo.trim()) return;
    const checklist = Array.isArray(proyecto.checklist) ? [...proyecto.checklist] : [];
    const esCompletada = taskEstadoKanban === "completado";

    const newTask: ChecklistItem = {
      id: `task-${Date.now()}`,
      orden: checklist.length + 1,
      categoria: taskCategoria.trim() || "General",
      titulo: taskTitulo.trim(),
      completada: esCompletada,
      estadoKanban: taskEstadoKanban,
      prioridad: taskPrioridad,
      fechaInicio: taskFechaInicio || undefined,
      fechaFin: taskFechaFin || undefined,
      responsable: taskResponsable.trim() || "Hoja SpA",
      completadaEn: esCompletada ? new Date().toISOString() : undefined,
    };

    const updatedChecklist = [...checklist, newTask];
    const completadas = updatedChecklist.filter((t) => t.completada).length;
    const progreso = Math.round((completadas / updatedChecklist.length) * 100);

    setProyecto((prev) => prev ? {
      ...prev,
      checklist: updatedChecklist,
      progresoPorcentaje: progreso,
    } : null);

    setIsTaskModalOpen(false);
    setTaskTitulo("");
    setTaskFechaInicio("");
    setTaskFechaFin("");
    toast.success("Tarea agregada al proyecto");
  };

  const handleDeleteTask = (taskId?: string) => {
    if (!taskId) return;
    const checklist = (proyecto.checklist || []).filter((t) => t.id !== taskId);
    const completadas = checklist.filter((t) => t.completada).length;
    const progreso = checklist.length > 0 ? Math.round((completadas / checklist.length) * 100) : 0;

    setProyecto((prev) => prev ? {
      ...prev,
      checklist,
      progresoPorcentaje: progreso,
    } : null);
  };

  // --- 3. SOLICITUD DE CAMBIO (CHANGE REQUEST) ---
  const handleCreateCR = () => {
    if (!crTitulo.trim()) return;
    const crList = Array.isArray(proyecto.solicitudesCambio) ? [...proyecto.solicitudesCambio] : [];
    const numero = crList.length + 1;

    const newCR: SolicitudCambio = {
      id: `cr-${Date.now()}`,
      numero,
      titulo: crTitulo.trim(),
      descripcion: crDescripcion.trim(),
      impactoHoras: Number(crHoras),
      impactoCostoNeto: Number(crCostoNeto),
      diasExtension: Number(crDiasExtension),
      terminosEntrega: crTerminos.trim(),
      estado: "aprobada", // Se asume aprobada para integrarse de inmediato
      fecha: new Date().toISOString().split("T")[0],
    };

    // 1. Agregar tarea en Kanban / Checklist automáticamente
    const checklist = Array.isArray(proyecto.checklist) ? [...proyecto.checklist] : [];
    const crTask: ChecklistItem = {
      id: `task-cr-${newCR.id}`,
      orden: checklist.length + 1,
      categoria: "Solicitud de Cambio",
      titulo: `CR #${numero}: ${newCR.titulo}`,
      descripcion: newCR.descripcion,
      completada: false,
      estadoKanban: "por_hacer",
      prioridad: "alta",
      responsable: "Hoja SpA",
    };

    // 2. Si tiene costo adicional, agregar hito de pago y recalcular total
    let hitos = Array.isArray(proyecto.hitosPago) ? [...proyecto.hitosPago] : [];
    let montos = { ...(proyecto.montos || { neto: 0, iva: 0, total: 0 }) };

    if (newCR.impactoCostoNeto > 0) {
      const costoIva = Math.round(newCR.impactoCostoNeto * 0.19);
      const costoTotal = newCR.impactoCostoNeto + costoIva;

      montos = {
        neto: montos.neto + newCR.impactoCostoNeto,
        iva: montos.iva + costoIva,
        total: montos.total + costoTotal,
      };

      hitos.push({
        id: `hito-cr-${newCR.id}`,
        titulo: `Pago CR #${numero}: ${newCR.titulo}`,
        porcentaje: 100,
        monto: costoTotal,
        fechaEstimada: new Date().toISOString().split("T")[0],
        estado: "pendiente",
      });
    }

    // 3. Extender fecha de entrega comprometida si aplica
    let fechaComprometida = proyecto.fechaEntregaComprometida;
    if (newCR.diasExtension && newCR.diasExtension > 0 && fechaComprometida) {
      const d = new Date(fechaComprometida);
      d.setDate(d.getDate() + newCR.diasExtension);
      fechaComprometida = d.toISOString().split("T")[0];
    }

    setProyecto((prev) => prev ? {
      ...prev,
      solicitudesCambio: [...crList, newCR],
      checklist: [...checklist, crTask],
      hitosPago: hitos,
      montos,
      fechaEntregaComprometida: fechaComprometida,
    } : null);

    setIsCrModalOpen(false);
    setCrTitulo("");
    setCrDescripcion("");
    toast.success(`Solicitud de Cambio #${numero} integrada al alcance, tareas y pagos`);
  };

  // Cálculos de hitos de pago
  const totalCobrado = useMemo(() => {
    return (proyecto.hitosPago || [])
      .filter((h) => h.estado === "cobrado")
      .reduce((acc, h) => acc + (h.monto || 0), 0);
  }, [proyecto.hitosPago]);

  const saldoPendiente = Math.max(0, (proyecto.montos?.total || 0) - totalCobrado);

  // Tareas para Gantt
  const tareasGantt = useMemo(() => {
    return (proyecto.checklist || []).filter((t) => t.fechaInicio && t.fechaFin);
  }, [proyecto.checklist]);

  const tareasSinFecha = useMemo(() => {
    return (proyecto.checklist || []).filter((t) => !t.fechaInicio || !t.fechaFin);
  }, [proyecto.checklist]);

  return (
    <div className="space-y-6">
      {/* Sub-Navegación de Fase 2 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setSubTab("herramientas")}
          className={`px-4 py-2 rounded-md text-xs font-black transition-all flex items-center gap-2 ${
            subTab === "herramientas"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          <Kanban className="w-4 h-4" />
          Planificación, Tareas & Cambios
        </button>

        <button
          onClick={() => setSubTab("pagos")}
          className={`px-4 py-2 rounded-md text-xs font-black transition-all flex items-center gap-2 ${
            subTab === "pagos"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Pagos Pactados & Facturación
        </button>
      </div>

      {/* SUB-PESTAÑA 1: PAGOS PACTADOS */}
      {subTab === "pagos" && (
        <div className="space-y-6">
          {/* Tarjetas Resumen de Pagos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-card border-white/10 p-5 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Proyecto Pactado</span>
              <div className="text-xl font-mono font-black text-white mt-1">
                {formatCLP(proyecto.montos?.total)} CLP
              </div>
              <p className="text-xs text-slate-400">Neto: {formatCLP(proyecto.montos?.neto)} + IVA</p>
            </Card>

            <Card className="bg-card border-emerald-500/20 bg-emerald-500/5 p-5 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Total Cobrado / Pagado</span>
              <div className="text-xl font-mono font-black text-emerald-400 mt-1">
                {formatCLP(totalCobrado)} CLP
              </div>
              <p className="text-xs text-slate-400">
                {proyecto.montos?.total ? Math.round((totalCobrado / proyecto.montos.total) * 100) : 0}% recaudado
              </p>
            </Card>

            <Card className="bg-card border-amber-500/20 bg-amber-500/5 p-5 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-amber-400">Saldo Pendiente por Cobrar</span>
              <div className="text-xl font-mono font-black text-amber-300 mt-1">
                {formatCLP(saldoPendiente)} CLP
              </div>
              <p className="text-xs text-slate-400">Hitos en espera de entrega</p>
            </Card>
          </div>

          {/* Tabla de Hitos de Pago con Inputs Directos */}
          <Card className="bg-card border-white/10 rounded-lg shadow-xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Configuración de Hitos de Pago</h3>
                  <p className="text-xs text-slate-400">Define porcentajes, montos directos y fechas estimadas</p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddHito}
                className="h-9 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Hito
              </Button>
            </div>

            <div className="p-5 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2.5 px-3 font-bold">Concepto / Hito</th>
                    <th className="py-2.5 px-3 font-bold w-24">Porcentaje</th>
                    <th className="py-2.5 px-3 font-bold w-36">Monto ($ CLP)</th>
                    <th className="py-2.5 px-3 font-bold w-36">Fecha Estimada</th>
                    <th className="py-2.5 px-3 font-bold">Estado</th>
                    <th className="py-2.5 px-3 font-bold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(proyecto.hitosPago || []).map((hito, idx) => (
                    <tr key={hito.id || idx} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3">
                        <Input
                          value={hito.titulo}
                          onChange={(e) => handleUpdateHito(idx, "titulo", e.target.value)}
                          className="bg-slate-900 border-white/10 text-white text-xs h-9 rounded-lg font-bold"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={hito.porcentaje}
                            onChange={(e) => {
                              const pct = parseFloat(e.target.value) || 0;
                              const calculatedMonto = Math.round((proyecto.montos?.total || 0) * (pct / 100));
                              handleUpdateHito(idx, "porcentaje", pct);
                              handleUpdateHito(idx, "monto", calculatedMonto);
                            }}
                            className="bg-slate-900 border-white/10 text-white font-mono text-xs h-9 rounded-lg pr-6"
                          />
                          <span className="absolute right-2 top-2 text-xs text-slate-500">%</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <Input
                          type="number"
                          value={hito.monto}
                          onChange={(e) => handleUpdateHito(idx, "monto", parseFloat(e.target.value) || 0)}
                          className="bg-slate-900 border-white/10 text-white font-mono text-xs h-9 rounded-lg font-bold"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <Input
                          type="date"
                          value={hito.fechaEstimada || ""}
                          onChange={(e) => handleUpdateHito(idx, "fechaEstimada", e.target.value)}
                          className="bg-slate-900 border-white/10 text-white text-xs h-9 rounded-lg"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1">
                          {hito.estado === "cobrado" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Cobrado {hito.fechaCobroReal && `(${hito.fechaCobroReal})`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 w-fit">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Pendiente
                            </span>
                          )}
                          {hito.numeroFactura ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-sky-400">
                              📄 Factura #{hito.numeroFactura}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">
                              Sin Factura DTE
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hito.estado !== "cobrado" && (
                            <Button
                              size="sm"
                              onClick={() => setPagoModalHito(hito)}
                              className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Marcar Pagado
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveHito(idx)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* SUB-PESTAÑA 2: HERRAMIENTAS DE PLANIFICACIÓN (CHECKLIST + KANBAN + GANTT + CR) */}
      {subTab === "herramientas" && (
        <div className="space-y-6">
          {/* 1. CHECKLIST TO-DO PRINCIPAL CON INDICADOR SUTIL DE ESTADO */}
          <Card className="bg-card border-white/10 rounded-lg shadow-xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Lista de Tareas & Checklist Operativo</h3>
                  <p className="text-xs text-slate-400">
                    Marca completado o revisa el estado del flujo Kanban sincronizado
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="h-9 px-3.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva Tarea
                </Button>

                <Button
                  type="button"
                  onClick={() => setIsCrModalOpen(true)}
                  className="h-9 px-3.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold gap-1.5"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  Solicitud de Cambio
                </Button>
              </div>
            </div>

            <div className="p-5 space-y-2">
              {(proyecto.checklist || []).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-md">
                  No hay tareas registradas aún. Presiona &quot;Nueva Tarea&quot; para agregar elementos al flujo.
                </div>
              ) : (
                (proyecto.checklist || []).map((tarea, idx) => {
                  const kanbanCfg = KANBAN_COLUMNAS.find((k) => k.id === tarea.estadoKanban) || KANBAN_COLUMNAS[0];

                  return (
                    <div
                      key={tarea.id || idx}
                      className={`flex items-center justify-between gap-3 p-3 rounded-md border transition-all ${
                        tarea.completada
                          ? "bg-white/[0.01] border-white/5 opacity-60"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={tarea.completada}
                          onChange={() => handleToggleChecklist(tarea.id)}
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-white/20 focus:ring-0 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${tarea.completada ? "line-through text-slate-400" : "text-white"}`}>
                            {tarea.titulo}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="text-slate-400">{tarea.categoria}</span>
                            {tarea.fechaInicio && tarea.fechaFin && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-300">{tarea.fechaInicio} al {tarea.fechaFin}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Indicador sutil de etapa Kanban */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${kanbanCfg.bg} ${kanbanCfg.border} ${kanbanCfg.color}`}>
                          {kanbanCfg.label}
                        </span>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(tarea.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* SELECTOR ENTRE KANBAN Y CARTA GANTT */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={herramientaVista === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setHerramientaVista("kanban")}
                className={`h-9 rounded-md text-xs font-bold gap-1.5 ${
                  herramientaVista === "kanban"
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                    : "border-white/15 text-slate-300"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                Tablero Kanban (5 Columnas)
              </Button>

              <Button
                variant={herramientaVista === "gantt" ? "default" : "outline"}
                size="sm"
                onClick={() => setHerramientaVista("gantt")}
                className={`h-9 rounded-md text-xs font-bold gap-1.5 ${
                  herramientaVista === "gantt"
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                    : "border-white/15 text-slate-300"
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Carta Gantt Interactiva
              </Button>
            </div>
          </div>

          {/* TABLERO KANBAN DE 5 COLUMNAS */}
          {herramientaVista === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
              {KANBAN_COLUMNAS.map((col) => {
                const tareasEnColumna = (proyecto.checklist || []).filter((t) => {
                  if (col.id === "por_hacer") {
                    return !t.estadoKanban || t.estadoKanban === "por_hacer";
                  }
                  return t.estadoKanban === col.id;
                });

                return (
                  <div
                    key={col.id}
                    className={`rounded-lg border ${col.border} ${col.bg} p-3 flex flex-col min-h-[380px] shadow-lg`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                      <span className={`text-xs font-black uppercase tracking-wider ${col.color}`}>
                        {col.label}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 font-bold text-white">
                        {tareasEnColumna.length}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto">
                      {tareasEnColumna.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-md bg-slate-900 border border-white/10 text-white space-y-2 shadow-md hover:border-white/20 transition-all"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-xs font-bold leading-tight">{t.titulo}</span>
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              t.prioridad === "alta" ? "bg-rose-500/20 text-rose-300" : "bg-white/5 text-slate-400"
                            }`}>
                              {t.prioridad || "media"}
                            </span>
                          </div>

                          {t.descripcion && (
                            <p className="text-[11px] text-slate-400 line-clamp-2">{t.descripcion}</p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                            <span>{t.responsable || "Hoja SpA"}</span>
                            {/* Selector para mover entre columnas */}
                            <Select
                              value={t.estadoKanban || "por_hacer"}
                              onValueChange={(val) => handleMoveKanban(t.id!, val as EstadoKanban)}
                            >
                              <SelectTrigger className="h-6 text-[9px] bg-white/5 border-white/10 rounded px-1.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-white/15 text-white">
                                {KANBAN_COLUMNAS.map((c) => (
                                  <SelectItem key={c.id} value={c.id} className="text-[10px]">
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CARTA GANTT INTERACTIVA + PANEL DE NO PROGRAMADAS */}
          {herramientaVista === "gantt" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline Horizontal */}
              <Card className="lg:col-span-2 bg-card border-white/10 rounded-lg shadow-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                      Cronograma Visual de Tareas
                    </h4>
                    <p className="text-xs text-slate-400">Pasa el cursor por las barras para ver detalles</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {tareasGantt.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-md">
                      No hay tareas con fechas asignadas. Asígnales fecha inicio y fin para verlas en la Carta Gantt.
                    </div>
                  ) : (
                    tareasGantt.map((t) => (
                      <div key={t.id} className="space-y-1 group relative">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200 truncate max-w-[240px]">{t.titulo}</span>
                          <span className="text-[10px] font-mono text-slate-400">{t.fechaInicio} — {t.fechaFin}</span>
                        </div>

                        {/* Barra Gantt interactiva */}
                        <div className="h-4 bg-white/5 rounded-full overflow-hidden relative cursor-pointer">
                          <div
                            className={`h-full rounded-full transition-all ${
                              t.completada
                                ? "bg-emerald-500"
                                : t.estadoKanban === "en_desarrollo"
                                ? "bg-blue-500"
                                : t.estadoKanban === "pruebas_qa"
                                ? "bg-purple-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: t.completada ? "100%" : "65%" }}
                          />
                        </div>

                        {/* Tooltip Dinámico con Hover */}
                        <div className="hidden group-hover:block absolute z-20 left-12 -top-12 bg-slate-900 border border-white/20 p-2.5 rounded-md text-xs shadow-2xl text-slate-100 min-w-[200px] pointer-events-none">
                          <p className="font-bold text-white">{t.titulo}</p>
                          <p className="text-[10px] text-slate-400">{t.categoria} • Responsable: {t.responsable || "Hoja SpA"}</p>
                          <p className="text-[10px] text-indigo-400 font-mono mt-1">Plazo: {t.fechaInicio} al {t.fechaFin}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Panel de Tareas No Programadas */}
              <Card className="bg-card border-white/10 rounded-lg shadow-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Tareas No Programadas ({tareasSinFecha.length})
                  </h4>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {tareasSinFecha.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Todas las tareas tienen fecha asignada.</p>
                  ) : (
                    tareasSinFecha.map((t) => (
                      <div key={t.id} className="p-2.5 rounded-md bg-white/5 border border-white/10 text-xs text-slate-200 space-y-1">
                        <span className="font-bold text-white block">{t.titulo}</span>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{t.categoria}</span>
                          <span className="text-amber-400 font-bold">Sin fecha</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* HISTORIAL DE SOLICITUDES DE CAMBIO APROBADAS */}
          {Array.isArray(proyecto.solicitudesCambio) && proyecto.solicitudesCambio.length > 0 && (
            <Card className="bg-card border-white/10 rounded-lg shadow-xl p-5 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                Historial de Solicitudes de Cambio (Change Requests)
              </h4>
              <div className="space-y-2">
                {proyecto.solicitudesCambio.map((cr) => (
                  <div
                    key={cr.id}
                    className="p-3.5 rounded-md bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">CR #{cr.numero}</span>
                        <span className="font-bold text-white">{cr.titulo}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{cr.descripcion}</p>
                    </div>

                    <div className="flex items-center gap-3 text-slate-300 font-mono text-[11px] shrink-0">
                      <span>+{cr.diasExtension || 0} días</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">+{formatCLP(cr.impactoCostoNeto)} CLP</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* MODAL: NUEVA TAREA / TO-DO */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-slate-950 border border-white/15 text-slate-100 rounded-lg shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white">Nueva Tarea del Proyecto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Título de la Tarea</Label>
              <Input
                value={taskTitulo}
                onChange={(e) => setTaskTitulo(e.target.value)}
                placeholder="Ej: Maquetación de panel responsive..."
                className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Categoría</Label>
                <Input
                  value={taskCategoria}
                  onChange={(e) => setTaskCategoria(e.target.value)}
                  placeholder="Frontend / Backend / QA"
                  className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Prioridad</Label>
                <Select value={taskPrioridad} onValueChange={(val) => setTaskPrioridad(val as "baja" | "media" | "alta")}>
                  <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    <SelectItem value="baja" className="text-xs">Baja</SelectItem>
                    <SelectItem value="media" className="text-xs">Media</SelectItem>
                    <SelectItem value="alta" className="text-xs text-rose-400">Alta (Urgente)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Fecha Inicio (Gantt)</Label>
                <Input
                  type="date"
                  value={taskFechaInicio}
                  onChange={(e) => setTaskFechaInicio(e.target.value)}
                  className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Fecha Fin (Gantt)</Label>
                <Input
                  type="date"
                  value={taskFechaFin}
                  onChange={(e) => setTaskFechaFin(e.target.value)}
                  className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Columna Inicial Kanban</Label>
              <Select value={taskEstadoKanban} onValueChange={(val) => setTaskEstadoKanban(val as EstadoKanban)}>
                <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/15 text-white">
                  {KANBAN_COLUMNAS.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsTaskModalOpen(false)}
              className="bg-white/5 border-white/15 text-slate-300 text-xs h-10 rounded-md"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTask}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 rounded-md px-5"
            >
              Guardar Tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: SOLICITUD DE CAMBIO (CHANGE REQUEST) */}
      <Dialog open={isCrModalOpen} onOpenChange={setIsCrModalOpen}>
        <DialogContent className="sm:max-w-[520px] bg-slate-950 border border-white/15 text-slate-100 rounded-lg shadow-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-white">Nueva Solicitud de Cambio (CR)</DialogTitle>
                <p className="text-xs text-slate-400">Se integrará a las tareas, cronograma y pagos del proyecto</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Título del Cambio</Label>
              <Input
                value={crTitulo}
                onChange={(e) => setCrTitulo(e.target.value)}
                placeholder="Ej: Integración pasarela Webpay Plus adicional..."
                className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Descripción & Justificación Técnica</Label>
              <Textarea
                value={crDescripcion}
                onChange={(e) => setCrDescripcion(e.target.value)}
                placeholder="Explicación del requerimiento adicional solicitado por el cliente..."
                rows={2}
                className="bg-slate-900 border-white/15 text-white text-xs rounded-md resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Extensión (Días)</Label>
                <Input
                  type="number"
                  min={0}
                  value={crDiasExtension}
                  onChange={(e) => setCrDiasExtension(parseInt(e.target.value) || 0)}
                  className="bg-slate-900 border-white/15 text-white font-mono text-xs h-10 rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Horas Estimadas</Label>
                <Input
                  type="number"
                  min={1}
                  value={crHoras}
                  onChange={(e) => setCrHoras(parseInt(e.target.value) || 1)}
                  className="bg-slate-900 border-white/15 text-white font-mono text-xs h-10 rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Costo Neto ($ CLP)</Label>
                <Input
                  type="number"
                  min={0}
                  value={crCostoNeto}
                  onChange={(e) => setCrCostoNeto(parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 border-white/15 text-white font-mono text-xs h-10 rounded-md font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Términos de Entrega del Cambio</Label>
              <Input
                value={crTerminos}
                onChange={(e) => setCrTerminos(e.target.value)}
                placeholder="Ej: Entrega e integración en rama de producción sin corte"
                className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCrModalOpen(false)}
              className="bg-white/5 border-white/15 text-slate-300 text-xs h-10 rounded-md"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCR}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-10 rounded-md px-5 shadow-lg shadow-amber-500/25"
            >
              Aprobar & Sumar al Proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: MARCAR PAGO COMO COBRADO */}
      {pagoModalHito && (
        <Dialog open={!!pagoModalHito} onOpenChange={(open) => !open && setPagoModalHito(null)}>
          <DialogContent className="sm:max-w-[420px] bg-slate-950 border border-white/15 text-slate-100 rounded-lg shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white">Registrar Cobro de Hito</DialogTitle>
              <p className="text-xs text-slate-400">{pagoModalHito.titulo} — {formatCLP(pagoModalHito.monto)} CLP</p>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Fecha de Cobro Real</Label>
                <Input
                  type="date"
                  value={pagoFechaReal}
                  onChange={(e) => setPagoFechaReal(e.target.value)}
                  className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">N° de Factura Emitida (DTE) — Opcional</Label>
                <Input
                  value={pagoNumeroFactura}
                  onChange={(e) => setPagoNumeroFactura(e.target.value)}
                  placeholder="Ej: 1045 (Para cómputo en Flujo de Caja e IVA F29)"
                  className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">N° de Comprobante / Ref. Transferencia</Label>
                <Input
                  value={pagoComprobante}
                  onChange={(e) => setPagoComprobante(e.target.value)}
                  placeholder="Ej: TEF #98124, Banco Estado"
                  className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-white/10 pt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setPagoModalHito(null)}
                className="bg-white/5 border-white/15 text-slate-300 text-xs h-10 rounded-md"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarPago}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 rounded-md px-5"
              >
                Confirmar Cobro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
