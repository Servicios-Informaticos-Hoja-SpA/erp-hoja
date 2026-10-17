"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProyectosListView } from "./proyectos-list.view";
import { 
  getProyectos, 
  saveProyecto, 
  deleteProyecto,
  getClientes
} from "@/lib/services";
import { Proyecto, Cliente } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getDefaultChecklist } from "./checklist-templates";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const ProyectosList: React.FC = () => {
  const router = useRouter();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para crear nuevo proyecto manual
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoClienteId, setNuevoClienteId] = useState("");
  const [nuevoTipoServicio, setNuevoTipoServicio] = useState<Proyecto["tipoServicio"]>("desarrollo_web");
  const [nuevoMonto, setNuevoMonto] = useState<number>(500000);
  const [creating, setCreating] = useState(false);

  const loadProyectos = useCallback(async () => {
    try {
      setLoading(true);
      const [projData, cliData] = await Promise.all([
        getProyectos(),
        getClientes().catch(() => []),
      ]);
      setProyectos(projData);
      setClientes(cliData);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar proyectos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProyectos();
  }, [loadProyectos]);

  const handleDeleteProyecto = async (id: string) => {
    try {
      await deleteProyecto(id);
      toast.success("Proyecto eliminado correctamente");
      await loadProyectos();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el proyecto");
      throw err;
    }
  };

  const handleCreateManual = async () => {
    if (!nuevoNombre.trim() || !nuevoClienteId) {
      toast.warning("Ingresa el nombre del proyecto y selecciona un cliente");
      return;
    }

    try {
      setCreating(true);
      const clienteSeleccionado = clientes.find((c) => c.id === nuevoClienteId);
      const neto = Math.round(nuevoMonto / 1.19);
      const iva = nuevoMonto - neto;

      const nuevo: Partial<Proyecto> = {
        nombre: nuevoNombre.trim(),
        clienteId: nuevoClienteId,
        clienteNombre: clienteSeleccionado?.nombre || "Cliente",
        clienteRut: clienteSeleccionado?.rut,
        clienteTelefono: clienteSeleccionado?.telefono,
        clienteEmail: clienteSeleccionado?.email,
        tipoServicio: nuevoTipoServicio,
        fase: "planificacion",
        fechaInicio: new Date().toISOString().split("T")[0],
        fechaEntregaComprometida: "",
        montos: {
          neto,
          iva,
          total: nuevoMonto,
        },
        hitosPago: [
          {
            id: `hito-1-${Date.now()}`,
            titulo: "50% Anticipo de Inicio",
            porcentaje: 50,
            monto: Math.round(nuevoMonto * 0.5),
            fechaEstimada: new Date().toISOString().split("T")[0],
            estado: "pendiente",
          },
          {
            id: `hito-2-${Date.now()}`,
            titulo: "50% Contra Entrega y Conformidad",
            porcentaje: 50,
            monto: Math.round(nuevoMonto * 0.5),
            fechaEstimada: "",
            estado: "pendiente",
          },
        ],
        progresoPorcentaje: 0,
        checklist: getDefaultChecklist(nuevoTipoServicio),
        alcanceItems: [
          `Despliegue operativo y puesta en marcha de ${nuevoNombre.trim()}`,
          "Pruebas de calidad y aseguramiento en ambiente de producción",
          "Entrega de credenciales maestras y acta de garantía"
        ],
        slaDetalle: "Respuesta en < 4 horas para fallas críticas. Cobertura de garantía estándar.",
        garantia: {
          diasGarantia: 60,
          fechaInicio: new Date().toISOString().split("T")[0],
          fechaFin: "",
          alcance: "Corrección prioritaria sin costo de errores de código o servidor.",
          exclusiones: "No cubre cambios de código no autorizados ni fallos ajenos a la infraestructura.",
          contactoEmergencias: "Mesa de Soporte Hoja SpA • contacto@hojaspa.cl",
        },
      };

      const res = await saveProyecto(nuevo);
      toast.success("Proyecto creado con éxito");
      setIsCreateOpen(false);
      setNuevoNombre("");

      // Redirigir a la página dedicada del proyecto recién creado
      if (res?.id) {
        router.push(`/proyectos/${res.id}`);
      } else {
        await loadProyectos();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el proyecto");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <ProyectosListView
        proyectos={proyectos}
        clientes={clientes}
        onNew={() => setIsCreateOpen(true)}
        onDelete={handleDeleteProyecto}
        loading={loading}
      />

      {/* MODAL PARA CREAR NUEVO PROYECTO */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-950 border border-white/15 text-slate-100 rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white">Nuevo Proyecto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Nombre del Proyecto</Label>
              <Input
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej: Desarrollo Web Corporativa & Portal Clientes"
                className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Cliente Mandante</Label>
              <Select value={nuevoClienteId} onValueChange={(val) => setNuevoClienteId(val || "")}>
                <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl">
                  <SelectValue placeholder="Selecciona un cliente registrado..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/15 text-white max-h-56">
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id!} className="text-xs">
                      {c.nombre} {c.rut ? `(${c.rut})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Tipo de Servicio</Label>
                <Select 
                  value={nuevoTipoServicio} 
                  onValueChange={(val) => val && setNuevoTipoServicio(val as Proyecto["tipoServicio"])}
                >
                  <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    <SelectItem value="desarrollo_web" className="text-xs">Desarrollo Web & Software</SelectItem>
                    <SelectItem value="soporte_nube" className="text-xs">Soporte Nube & Hosting</SelectItem>
                    <SelectItem value="ciberseguridad" className="text-xs">Ciberseguridad</SelectItem>
                    <SelectItem value="inventario_hardware" className="text-xs">Hardware</SelectItem>
                    <SelectItem value="consultoria" className="text-xs">Consultoría TI</SelectItem>
                    <SelectItem value="otro" className="text-xs">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Monto Total ($ CLP)</Label>
                <Input
                  type="number"
                  min={0}
                  value={nuevoMonto}
                  onChange={(e) => setNuevoMonto(parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 border-white/15 text-white font-mono text-xs h-10 rounded-xl font-bold"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="bg-white/5 border-white/15 text-slate-300 text-xs h-10 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateManual}
              disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 rounded-xl px-5"
            >
              {creating ? "Creando..." : "Crear Proyecto e Ingresar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
