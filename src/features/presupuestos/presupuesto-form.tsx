"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PresupuestoFormView } from "./presupuesto-form.view";
import { PresupuestoPreview } from "./presupuesto-preview.view";
import { 
  Cliente, 
  Servicio, 
  PresupuestoItem, 
  Presupuesto, 
  ConfiguracionGlobal 
} from "@/lib/types";
import { generatePDF } from "@/lib/pdf-utils";
import { 
  getClientes, 
  getCatalogo, 
  getConfig, 
  savePresupuesto, 
  getNextPresupuestoNumber,
  getPresupuestoById,
  saveCliente 
} from "@/lib/services";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Save, X } from "lucide-react";
import { toast } from "sonner";

interface PresupuestoFormProps {
  id?: string;
  onSuccess?: () => void;
}

export const PresupuestoForm: React.FC<PresupuestoFormProps> = ({ id, onSuccess }) => {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [catalogo, setCatalogo] = useState<Servicio[]>([]);
  const [config, setConfig] = useState<ConfiguracionGlobal | null>(null);
  
  // Form State
  const [selectedCliente, setSelectedCliente] = useState("");
  const [proyecto, setProyecto] = useState("");
  const [items, setItems] = useState<PresupuestoItem[]>([]);
  const [optionalItems, setOptionalItems] = useState<PresupuestoItem[]>([]);
  const [params, setParams] = useState<Record<string, string>>({
    "Forma Pago": "70% Anticipo y 30% Contra entrega",
    "Plazo Entrega": "30 días"
  });
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nextNumber, setNextNumber] = useState("XXXX");
  const [currentVersion, setCurrentVersion] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cls, cat, conf] = await Promise.all([
          getClientes(),
          getCatalogo(),
          getConfig()
        ]);
        setClientes(cls);
        setCatalogo(cat);
        setConfig(conf);

        if (id) {
          const pres = await getPresupuestoById(id);
          setSelectedCliente(pres.cliente_id);
          setProyecto(pres.descripcion_proyecto);
          setItems(pres.items);
          setOptionalItems(pres.servicios_opcionales || []);
          setParams(pres.parametros_personalizados);
          setNextNumber(pres.numero);
          setCurrentVersion(pres.version || 1);
        } else {
          const num = await getNextPresupuestoNumber();
          setNextNumber(num);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar datos del formulario");
      }
    };
    loadData();
  }, [id]);

  const neto = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.total, 0);
  }, [items]);

  const iva = useMemo(() => Math.round(neto * 0.19), [neto]);
  const totalFinal = useMemo(() => neto + iva, [neto, iva]);

  const addItem = () => {
    setItems([...items, { descripcion: "", precio: 0, cantidad: 1, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PresupuestoItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    item.total = item.precio * item.cantidad;
    newItems[index] = item;
    setItems(newItems);
  };

  const addOptionalItem = () => {
    setOptionalItems([...optionalItems, { descripcion: "", precio: 0, cantidad: 1, total: 0, frecuencia: "Mensual" }]);
  };

  const removeOptionalItem = (index: number) => {
    setOptionalItems(optionalItems.filter((_, i) => i !== index));
  };

  const updateOptionalItem = (index: number, field: keyof PresupuestoItem, value: any) => {
    const newItems = [...optionalItems];
    const item = { ...newItems[index], [field]: value };
    item.total = item.precio * item.cantidad;
    newItems[index] = item;
    setOptionalItems(newItems);
  };

  const updateParam = (oldKey: string, newKey: string, value: string) => {
    const newParams = { ...params };
    if (oldKey !== newKey) {
      delete newParams[oldKey];
    }
    newParams[newKey] = value;
    setParams(newParams);
  };

  const addParam = () => {
    const key = `Parámetro ${Object.keys(params).length + 1}`;
    setParams({ ...params, [key]: "" });
  };

  const removeParam = (key: string) => {
    const newParams = { ...params };
    delete newParams[key];
    setParams(newParams);
  };

  const handleSave = async (options: { download?: boolean, close?: boolean } = { close: true }) => {
    if (!selectedCliente || items.length === 0) {
      toast.warning("Selecciona un cliente y añade al menos un ítem.");
      return;
    }

    setIsSaving(true);
    const cliente = clientes.find(c => c.id === selectedCliente);

    const presupuesto: any = {
      id,
      numero: nextNumber,
      cliente_id: selectedCliente,
      cliente_nombre: cliente?.nombre || "",
      descripcion_proyecto: proyecto,
      items,
      servicios_opcionales: optionalItems,
      parametros_personalizados: params,
      forma_pago: params["Forma Pago"] || "",
      plazo_entrega: params["Plazo Entrega"] || "",
      totales: { neto, iva, total: totalFinal }
    };

    try {
      await savePresupuesto(presupuesto);
      toast.success(id ? "Presupuesto actualizado (Nueva versión)" : "Presupuesto guardado.");
      
      if (options.download) {
        toast.info("Generando PDF...");
        // Esperamos a que el template oculto esté listo
        await new Promise(resolve => setTimeout(resolve, 500));
        const filename = `COT_${nextNumber}_${presupuesto.cliente_nombre.replace(/\s+/g, '_').toUpperCase()}`;
        await generatePDF("presupuesto-document-print", filename, 'save');
      }

      if (options.close) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/presupuestos");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al procesar la solicitud.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddClient = async (newCliente: Partial<Cliente>) => {
    try {
      const res = await saveCliente(newCliente);
      const cls = await getClientes();
      setClientes(cls);
      if (res && res.id) {
        setSelectedCliente(res.id);
      }
      toast.success("Cliente añadido.");
    } catch (err) {
      console.error(err);
      toast.error("Error al añadir cliente.");
    }
  };

  const currentData: Partial<Presupuesto> = {
    numero: nextNumber,
    cliente_nombre: clientes.find(c => c.id === selectedCliente)?.nombre || "Nombre del Cliente",
    descripcion_proyecto: proyecto,
    items,
    servicios_opcionales: optionalItems,
    parametros_personalizados: params,
    totales: { neto, iva, total: totalFinal },
    version: id ? currentVersion + 1 : 1
  };

  return (
    <div className="h-full">
      <PresupuestoFormView
        clientes={clientes}
        catalogo={catalogo}
        selectedCliente={selectedCliente}
        setSelectedCliente={setSelectedCliente}
        proyecto={proyecto}
        setProyecto={setProyecto}
        items={items}
        addItem={addItem}
        removeItem={removeItem}
        updateItem={updateItem}
        optionalItems={optionalItems}
        addOptionalItem={addOptionalItem}
        removeOptionalItem={removeOptionalItem}
        updateOptionalItem={updateOptionalItem}
        params={params}
        addParam={addParam}
        removeParam={removeParam}
        updateParam={updateParam}
        onPreview={() => setIsPreviewOpen(true)}
        onSave={() => handleSave({ close: true, download: false })}
        onAddClient={handleAddClient}
        isSaving={isSaving}
        totales={{ neto, iva, total: totalFinal }}
      />

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent showCloseButton={false} className="!max-w-[1000px] !w-[90vw] p-0 overflow-hidden bg-muted/20 border-none shadow-2xl">
          {/* Hidden template for PDF generation */}
          <div className="fixed left-[-9999px] top-0 pointer-events-none">
            <PresupuestoPreview data={currentData} config={config} isPrinting={true} />
          </div>
          
          <DialogHeader className="p-4 bg-[#abaafd] text-[#2e3c7e] border-b border-[#2e3c7e]/10 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-full hover:bg-[#2e3c7e]/10 text-[#2e3c7e]"
              >
                <X className="h-5 w-5" />
              </Button>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight uppercase leading-none">Vista Previa</DialogTitle>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Hoja SpA Budget System</p>
              </div>
            </div>
            <Button 
              onClick={() => handleSave({ download: true, close: true })}
              className="rounded-full bg-[#2e3c7e] text-white hover:scale-105 transition-all gap-2"
            >
              <Save className="h-4 w-4" /> <span className="hidden sm:inline">Guardar y Descargar</span>
            </Button>
          </DialogHeader>
          <div className="h-[75vh] overflow-auto">
            <div className="flex justify-center py-4 min-w-max">
              <PresupuestoPreview data={currentData} config={config} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
