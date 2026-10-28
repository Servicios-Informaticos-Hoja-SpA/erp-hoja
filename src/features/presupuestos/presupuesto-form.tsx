"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PresupuestoFormView } from "./presupuesto-form.view";
import { PresupuestoPreview } from "./presupuesto-preview.view";
import { 
  Cliente, 
  Servicio, 
  PresupuestoItem, 
  Presupuesto, 
  ConfiguracionGlobal,
  PresupuestoEstado,
  ModalidadContinuidad
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

interface PresupuestoFormProps {
  id?: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export const PresupuestoForm: React.FC<PresupuestoFormProps> = ({ id, onSuccess, onClose }) => {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [catalogo, setCatalogo] = useState<Servicio[]>([]);
  const [config, setConfig] = useState<ConfiguracionGlobal | null>(null);
  
  // Form State
  const [selectedCliente, setSelectedCliente] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [proyecto, setProyecto] = useState("");
  const [descripcionProyecto, setDescripcionProyecto] = useState("");
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
  const [estado, setEstado] = useState<PresupuestoEstado>("borrador");
  const [moneda, setMoneda] = useState<"CLP" | "UF">("CLP");
  const [valorUF, setValorUF] = useState<number>(38000);
  const [modalidadContinuidad, setModalidadContinuidad] = useState<ModalidadContinuidad>("incluido_ano1");
  const [montoContinuidad, setMontoContinuidad] = useState<number>(0);
  const [detalleContinuidad, setDetalleContinuidad] = useState<string>("Hosting Reseller cPanel, casillas de correo corporativas, SSL y copias de seguridad semanales.");
  const [tokenPublico, setTokenPublico] = useState<string>("");
  const [condicionesComerciales, setCondicionesComerciales] = useState<string>(
    "• Forma de Pago: 50% de anticipo al inicio de los trabajos y 50% contra entrega conforme y paso a producción.\n• Plazo de Entrega: Estimado conforme a cronograma acordado tras validación del anticipo.\n• Validez de la Oferta: 15 días corridos a contar de la fecha de emisión del documento.\n• Continuidad y Garantía: Incluye 12 meses de soporte técnico, hosting administrado y respaldo ante incidencias."
  );
  const [loadingData, setLoadingData] = useState(true);

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
          setSelectedCliente(pres.cliente_id || "");
          setClienteNombre(pres.cliente_nombre || "");
          setProyecto(pres.nombre_proyecto || pres.descripcion_proyecto || "");
          setDescripcionProyecto(pres.nombre_proyecto ? (pres.descripcion_proyecto || "") : "");
          setItems(pres.items || []);
          setOptionalItems(pres.servicios_opcionales || []);
          setParams(pres.parametros_personalizados || {});
          setNextNumber(pres.numero);
          setCurrentVersion(pres.version || 1);
          if (pres.estado) setEstado(pres.estado);
          if (pres.moneda) setMoneda(pres.moneda);
          if (pres.valorUFReferencial) setValorUF(pres.valorUFReferencial);
          if (pres.condiciones_comerciales) setCondicionesComerciales(pres.condiciones_comerciales);
          if (pres.bloqueContinuidad) {
            setModalidadContinuidad(pres.bloqueContinuidad.modalidad);
            if (pres.bloqueContinuidad.montoRecurrente !== undefined) {
              setMontoContinuidad(pres.bloqueContinuidad.montoRecurrente);
            } else if (pres.bloqueContinuidad.monto !== undefined) {
              setMontoContinuidad(pres.bloqueContinuidad.monto);
            }
            if (pres.bloqueContinuidad.detalle) setDetalleContinuidad(pres.bloqueContinuidad.detalle);
          }
          if (pres.tokenPublico) setTokenPublico(pres.tokenPublico);
        } else {
          const num = await getNextPresupuestoNumber();
          setNextNumber(num);
          setTokenPublico(crypto.randomUUID());
        }
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar datos del formulario");
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [id]);

  const neto = useMemo(() => {
    return items.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  }, [items]);

  const iva = useMemo(() => Math.round(neto * 0.19), [neto]);
  const totalFinal = useMemo(() => neto + iva, [neto, iva]);

  const addItem = () => {
    setItems([...items, { descripcion: "", detalle: "", precio: 0, cantidad: 1, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PresupuestoItem, value: string | number) => {
    const newItems = [...items];
    const cleanVal = (field === "precio" || field === "cantidad")
      ? (typeof value === "number" && isNaN(value) ? 0 : Number(value) || 0)
      : value;
    const item = { ...newItems[index], [field]: cleanVal };
    item.total = Number(item.precio || 0) * Number(item.cantidad || 1);
    newItems[index] = item;
    setItems(newItems);
  };

  const addOptionalItem = () => {
    setOptionalItems([...optionalItems, { descripcion: "", detalle: "", precio: 0, cantidad: 1, total: 0, frecuencia: "Mensual" }]);
  };

  const removeOptionalItem = (index: number) => {
    setOptionalItems(optionalItems.filter((_, i) => i !== index));
  };

  const updateOptionalItem = (index: number, field: keyof PresupuestoItem, value: string | number) => {
    const newItems = [...optionalItems];
    const cleanVal = (field === "precio" || field === "cantidad")
      ? (typeof value === "number" && isNaN(value) ? 0 : Number(value) || 0)
      : value;
    const item = { ...newItems[index], [field]: cleanVal };
    item.total = Number(item.precio || 0) * Number(item.cantidad || 1);
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

    const sanitizedItems = items.map(item => ({
      ...item,
      descripcion: item.descripcion || "Item sin descripción",
      detalle: item.detalle?.trim() || "",
      precio: Number(item.precio) || 0,
      cantidad: Number(item.cantidad) || 1,
      total: (Number(item.precio) || 0) * (Number(item.cantidad) || 1),
    }));

    const sanitizedOptionalItems = optionalItems.map(item => ({
      ...item,
      descripcion: item.descripcion || "Opcional",
      detalle: item.detalle?.trim() || "",
      precio: Number(item.precio) || 0,
      cantidad: Number(item.cantidad) || 1,
      total: (Number(item.precio) || 0) * (Number(item.cantidad) || 1),
    }));

    const bloqueDesarrollo = {
      titulo: proyecto || "Desarrollo e Implementación",
      monto: totalFinal,
      anticipoPorcentaje: 50,
      entregaPorcentaje: 50,
      anticipoMonto: Math.round(totalFinal * 0.5),
      entregaMonto: Math.round(totalFinal * 0.5),
      montoAnticipo: Math.round(totalFinal * 0.5),
      montoEntrega: Math.round(totalFinal * 0.5),
    };

    const bloqueContinuidad = {
      modalidad: modalidadContinuidad,
      monto: Number(montoContinuidad) || 0,
      montoRecurrente: Number(montoContinuidad) || 0,
      monedaRecurrente: moneda,
      detalle: detalleContinuidad,
    };

    const finalToken = tokenPublico || crypto.randomUUID();

    const presupuesto: Partial<Presupuesto> = {
      id,
      numero: nextNumber,
      cliente_id: selectedCliente,
      cliente_nombre: cliente?.nombre || clienteNombre || "",
      nombre_proyecto: proyecto,
      descripcion_proyecto: descripcionProyecto,
      items: sanitizedItems,
      servicios_opcionales: sanitizedOptionalItems,
      parametros_personalizados: params,
      forma_pago: params["Forma Pago"] || "50% Anticipo y 50% Contra entrega",
      plazo_entrega: params["Plazo Entrega"] || "30 días",
      condiciones_comerciales: condicionesComerciales,
      totales: { neto, iva, total: totalFinal },
      moneda,
      valorUFReferencial: valorUF,
      bloqueDesarrollo,
      bloqueContinuidad,
      tokenPublico: finalToken,
      estado
    };

    try {
      await savePresupuesto(presupuesto);
      toast.success(id ? "Presupuesto actualizado (Nueva versión)" : "Presupuesto guardado.");
      
      if (options.download) {
        toast.info("Generando PDF...");
        // Esperamos a que el template oculto esté listo
        await new Promise(resolve => setTimeout(resolve, 500));
        const clientSlug = (presupuesto.cliente_nombre || "CLIENTE").replace(/\s+/g, "_").toUpperCase();
        const filename = `COT_${nextNumber}_${clientSlug}`;
        await generatePDF("presupuesto-document-print", filename, 'save');
      }

      if (options.close) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/presupuestos");
        }
      }
    } catch (err: unknown) {
      console.error("Error al guardar presupuesto:", err);
      const msg = err instanceof Error ? err.message : "Error al procesar la solicitud.";
      toast.error(msg);
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
        setClienteNombre(newCliente.nombre || "");
      }
      toast.success("Cliente añadido.");
    } catch (err) {
      console.error(err);
      toast.error("Error al añadir cliente.");
    }
  };

  const currentData: Partial<Presupuesto> = {
    numero: nextNumber,
    cliente_nombre: clientes.find(c => c.id === selectedCliente)?.nombre || clienteNombre || "Nombre del Cliente",
    nombre_proyecto: proyecto,
    descripcion_proyecto: descripcionProyecto,
    items,
    servicios_opcionales: optionalItems,
    parametros_personalizados: params,
    condiciones_comerciales: condicionesComerciales,
    totales: { neto, iva, total: totalFinal },
    moneda,
    valorUFReferencial: valorUF,
    bloqueDesarrollo: {
      titulo: proyecto || "Desarrollo e Implementación",
      monto: totalFinal,
      anticipoPorcentaje: 50,
      entregaPorcentaje: 50,
      anticipoMonto: Math.round(totalFinal * 0.5),
      entregaMonto: Math.round(totalFinal * 0.5),
    },
    bloqueContinuidad: {
      modalidad: modalidadContinuidad,
      montoRecurrente: montoContinuidad,
      monedaRecurrente: moneda,
      detalle: detalleContinuidad,
    },
    tokenPublico: tokenPublico || "preview-token",
    version: id ? currentVersion + 1 : 1
  };

  if (loadingData) {
    return (
      <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-xl bg-slate-800" />
            <Skeleton className="h-4 w-40 rounded bg-slate-800/60" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-28 rounded-xl bg-slate-800" />
            <Skeleton className="h-11 w-32 rounded-xl bg-slate-800" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-24 w-full rounded-2xl bg-slate-800/70" />
          <Skeleton className="h-24 w-full rounded-2xl bg-slate-800/70" />
        </div>
        <Skeleton className="h-56 w-full rounded-2xl bg-slate-800/60" />
        <Skeleton className="h-36 w-full rounded-2xl bg-slate-800/50" />
      </div>
    );
  }

  return (
    <div className="h-full">
      <PresupuestoFormView
        clientes={clientes}
        catalogo={catalogo}
        selectedCliente={selectedCliente}
        setSelectedCliente={setSelectedCliente}
        clienteNombre={clienteNombre}
        setClienteNombre={setClienteNombre}
        proyecto={proyecto}
        setProyecto={setProyecto}
        descripcionProyecto={descripcionProyecto}
        setDescripcionProyecto={setDescripcionProyecto}
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
        numero={nextNumber}
        onClose={onClose}
        condicionesComerciales={condicionesComerciales}
        setCondicionesComerciales={setCondicionesComerciales}
        onPreview={() => setIsPreviewOpen(true)}
        onSave={() => handleSave({ close: true, download: false })}
        onAddClient={handleAddClient}
        isSaving={isSaving}
        totales={{ neto, iva, total: totalFinal }}
        estado={estado}
        setEstado={setEstado}
        moneda={moneda}
        setMoneda={setMoneda}
        valorUF={valorUF}
        setValorUF={setValorUF}
        modalidadContinuidad={modalidadContinuidad}
        setModalidadContinuidad={setModalidadContinuidad}
        montoContinuidad={montoContinuidad}
        setMontoContinuidad={setMontoContinuidad}
        detalleContinuidad={detalleContinuidad}
        setDetalleContinuidad={setDetalleContinuidad}
        tokenPublico={tokenPublico}
        config={config}
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
