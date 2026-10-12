"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProyectosListView } from "./proyectos-list.view";
import { ProyectoDetailView } from "./proyecto-detail.view";
import { 
  getProyectos, 
  saveProyecto, 
  updateProyecto, 
  deleteProyecto,
  getDocumentosProyecto,
  saveDocumentoOperativo,
  getClientes
} from "@/lib/services";
import { Proyecto, DocumentoOperativo, Cliente } from "@/lib/types";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useSearchParams } from "next/navigation";

export const ProyectosList: React.FC = () => {
  const searchParams = useSearchParams();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Estado para detalle de proyecto seleccionado
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoOperativo[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Estado para crear nuevo proyecto manual
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoClienteId, setNuevoClienteId] = useState("");
  const [nuevoTipoServicio, setNuevoTipoServicio] = useState<Proyecto["tipoServicio"]>("desarrollo_web");
  const [nuevoMonto, setNuevoMonto] = useState<number>(500000);

  const loadProyectos = useCallback(async () => {
    try {
      const data = await getProyectos();
      setProyectos(data);
      return data;
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar proyectos");
      return [];
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const [projData, cliData] = await Promise.all([
          getProyectos(),
          getClientes().catch(() => []),
        ]);
        if (isMounted) {
          setProyectos(projData);
          setClientes(cliData);
          setLoading(false);

          // Si viene ?id=... abrir automáticamente el proyecto
          const urlId = searchParams.get("id");
          if (urlId) {
            const found = projData.find((p) => p.id === urlId);
            if (found) {
              setSelectedProyecto(found);
              getDocumentosProyecto(found.id!).then((docs) => setDocumentos(docs));
            }
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const handleSelectProyecto = async (p: Proyecto) => {
    setSelectedProyecto(p);
    try {
      const docs = await getDocumentosProyecto(p.id!);
      setDocumentos(docs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProyecto = async () => {
    if (!selectedProyecto || !selectedProyecto.id) return;
    setIsSaving(true);
    try {
      await updateProyecto(selectedProyecto.id, selectedProyecto);
      toast.success("Proyecto actualizado correctamente");
      const updatedList = await loadProyectos();
      // Actualizar el seleccionado en memoria
      const fresh = updatedList.find(p => p.id === selectedProyecto.id);
      if (fresh) setSelectedProyecto(fresh);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar cambios del proyecto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDocumento = async (docData: Partial<DocumentoOperativo>) => {
    if (!selectedProyecto || !selectedProyecto.id) return;
    try {
      await saveDocumentoOperativo(selectedProyecto.id, docData);
      const docs = await getDocumentosProyecto(selectedProyecto.id);
      setDocumentos(docs);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteProyecto = async (id: string) => {
    try {
      await deleteProyecto(id);
      toast.success("Proyecto eliminado");
      await loadProyectos();
      if (selectedProyecto?.id === id) {
        setSelectedProyecto(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar proyecto");
    }
  };

  const handleCreateManual = async () => {
    if (!nuevoNombre.trim() || !nuevoClienteId) {
      toast.warning("Ingresa el nombre del proyecto y selecciona un cliente");
      return;
    }

    const clienteSeleccionado = clientes.find((c) => c.id === nuevoClienteId);
    const neto = Math.round(nuevoMonto / 1.19);
    const iva = nuevoMonto - neto;

    const nuevo: Partial<Proyecto> = {
      nombre: nuevoNombre.trim(),
      clienteId: nuevoClienteId,
      clienteNombre: clienteSeleccionado?.nombre || "Cliente",
      clienteRut: clienteSeleccionado?.rut,
      clienteTelefono: clienteSeleccionado?.telefono,
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
    };

    try {
      const res = await saveProyecto(nuevo);
      toast.success("Proyecto creado con éxito");
      setIsCreateOpen(false);
      setNuevoNombre("");
      const list = await loadProyectos();
      const creado = list.find((p) => p.id === res.id);
      if (creado) {
        setSelectedProyecto(creado);
        setDocumentos([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al crear proyecto");
    }
  };

  return (
    <>
      <ProyectosListView
        proyectos={proyectos}
        search={search}
        setSearch={setSearch}
        onNew={() => setIsCreateOpen(true)}
        onSelect={handleSelectProyecto}
        onDelete={handleDeleteProyecto}
        loading={loading}
      />

      {/* Side Panel Sheet para Detalle y Gestión del Proyecto */}
      <Sheet open={!!selectedProyecto} onOpenChange={(open) => !open && setSelectedProyecto(null)}>
        <SheetContent 
          side="right" 
          className="!w-screen sm:!w-[80vw] sm:!max-w-[1200px] p-0 border-none shadow-2xl overflow-hidden flex flex-col [&>button]:hidden"
        >
          {selectedProyecto && (
            <ProyectoDetailView
              proyecto={selectedProyecto}
              setProyecto={setSelectedProyecto}
              documentos={documentos}
              onSave={handleSaveProyecto}
              onSaveDocumento={handleSaveDocumento}
              onClose={() => setSelectedProyecto(null)}
              isSaving={isSaving}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Modal para Crear Proyecto Manual */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] border border-white/10 bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Nuevo Proyecto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Nombre del Proyecto</Label>
              <Input
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej. Rediseño Web & Plataforma SaaS"
                className="bg-muted/40 border-white/10 h-11 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Cliente Asignado</Label>
              <Select 
                value={nuevoClienteId} 
                onValueChange={(val) => { if (val) setNuevoClienteId(val); }}
              >
                <SelectTrigger className="bg-muted/40 border-white/10 h-11 rounded-xl text-xs font-bold">
                  <SelectValue placeholder="Selecciona un cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id!}>
                      {c.nombre} {c.rut ? `(${c.rut})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Tipo de Servicio</Label>
              <Select 
                value={nuevoTipoServicio} 
                onValueChange={(val) => { if (val) setNuevoTipoServicio(val as Proyecto["tipoServicio"]); }}
              >
                <SelectTrigger className="bg-muted/40 border-white/10 h-11 rounded-xl text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desarrollo_web">🌐 Desarrollo Web</SelectItem>
                  <SelectItem value="soporte_nube">☁️ Soporte Nube / DevOps</SelectItem>
                  <SelectItem value="ciberseguridad">🛡️ Ciberseguridad</SelectItem>
                  <SelectItem value="inventario_hardware">🖥️ Hardware e Inventario</SelectItem>
                  <SelectItem value="consultoria">📋 Consultoría</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Monto Total Pactado (CLP con IVA)</Label>
              <Input
                type="number"
                value={nuevoMonto}
                onChange={(e) => setNuevoMonto(Number(e.target.value))}
                className="bg-muted/40 border-white/10 h-11 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateManual}
              className="bg-primary text-primary-foreground font-black text-xs rounded-xl"
            >
              Crear Proyecto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
