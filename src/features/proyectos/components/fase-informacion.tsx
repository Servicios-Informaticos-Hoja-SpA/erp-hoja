"use client";

import React, { useState } from "react";
import { 
  Proyecto, 
  ProyectoTipoServicio, 
  ProyectoFase 
} from "@/lib/types";
import { 
  Building2, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  Download, 
  Upload, 
  Edit3, 
  Check, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  CreditCard,
  ExternalLink,
  Layers,
  Sparkles
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
import { descargarPlantillaAlcanceSLA } from "../utils/documento-word";
import { subirArchivoProyectoStorage } from "../utils/storage-upload";
import { toast } from "sonner";

interface FaseInformacionProps {
  proyecto: Proyecto;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

const TIPO_SERVICIO_LABELS: Record<ProyectoTipoServicio, string> = {
  desarrollo_web: "Desarrollo Web & Software",
  soporte_nube: "Soporte Nube & Hosting",
  ciberseguridad: "Ciberseguridad & Auditoría",
  inventario_hardware: "Inventario de Hardware",
  consultoria: "Consultoría TI",
  otro: "Servicio Especializado",
};

const FASE_LABELS: Record<ProyectoFase, { label: string; color: string }> = {
  planificacion: { label: "Planificación", color: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
  desarrollo: { label: "En Desarrollo", color: "bg-blue-500/10 text-blue-300 border-blue-500/30" },
  revision_qa: { label: "Revisión / QA", color: "bg-purple-500/10 text-purple-300 border-purple-500/30" },
  entregado: { label: "Entregado", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" },
  pausado: { label: "Pausado", color: "bg-slate-700/50 text-slate-300 border-slate-600" },
  cancelado: { label: "Cancelado", color: "bg-rose-500/10 text-rose-300 border-rose-500/30" },
};

export const FaseInformacion: React.FC<FaseInformacionProps> = ({
  proyecto,
  setProyecto,
  onSave,
  isSaving,
}) => {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [nuevoItemAlcance, setNuevoItemAlcance] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const formatCLP = (val: number = 0) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

  // Agregar ítem de alcance
  const handleAddAlcance = () => {
    if (!nuevoItemAlcance.trim()) return;
    const currentAlcance = Array.isArray(proyecto.alcanceItems) ? proyecto.alcanceItems : [];
    setProyecto((prev) => prev ? {
      ...prev,
      alcanceItems: [...currentAlcance, nuevoItemAlcance.trim()]
    } : null);
    setNuevoItemAlcance("");
  };

  const handleRemoveAlcance = (idx: number) => {
    const currentAlcance = Array.isArray(proyecto.alcanceItems) ? proyecto.alcanceItems : [];
    setProyecto((prev) => prev ? {
      ...prev,
      alcanceItems: currentAlcance.filter((_, i) => i !== idx)
    } : null);
  };

  // Subida de documento modificado a Firebase Storage
  const handleUploadDocumento = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !proyecto.id) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext || "")) {
      toast.error("Formato no permitido. Solo se aceptan archivos PDF o Word (.pdf, .doc, .docx)");
      e.target.value = "";
      return;
    }

    try {
      setUploadingDoc(true);
      const res = await subirArchivoProyectoStorage(proyecto.id, file);

      const nuevoDoc = {
        id: `doc-${Date.now()}`,
        nombre: file.name,
        tipoDoc: "alcance" as const,
        codigoIso: `SGC-PRY-ALC-${proyecto.presupuestoNumero || "001"}`,
        fileUrl: res.fileUrl,
        storagePath: res.storagePath,
        fileType: res.fileType,
        tamanoBytes: res.tamanoBytes,
        fechaSubida: new Date().toISOString(),
        estado: "emitido" as const,
        notas: "Documento de Alcance y SLA subido por el usuario",
      };

      const adjuntosPrevios = Array.isArray(proyecto.archivosAdjuntos) ? proyecto.archivosAdjuntos : [];
      setProyecto((prev) => prev ? {
        ...prev,
        archivosAdjuntos: [nuevoDoc, ...adjuntosPrevios],
        propuestaFormalizada: true,
      } : null);

      toast.success("Documento subido a Firebase Storage y registrado en el proyecto");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir el archivo");
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. INFORMACIÓN GENERAL: MODO LECTURA POR DEFECTO + BOTÓN MODIFICAR */}
      <Card className="bg-card border-white/10 rounded-lg shadow-xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">Información General del Proyecto</h2>
              <p className="text-xs text-slate-400">Datos corporativos, cliente y fechas comprometidas</p>
            </div>
          </div>

          <Button
            type="button"
            variant={isEditingInfo ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditingInfo(!isEditingInfo)}
            className={`h-9 px-3.5 rounded-md text-xs font-bold gap-1.5 transition-all ${
              isEditingInfo 
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30" 
                : "border-white/15 text-slate-300 hover:bg-white/5"
            }`}
          >
            {isEditingInfo ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Listo (Volver a Vista)
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                Modificar Información
              </>
            )}
          </Button>
        </div>

        <CardContent className="p-6">
          {!isEditingInfo ? (
            /* VISTA DE SOLO LECTURA COMPACTA Y ELEGANTE */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Proyecto</span>
                <p className="text-sm font-black text-white">{proyecto.nombre}</p>
                <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{proyecto.descripcion || "Sin descripción adicional"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cliente Mandante</span>
                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                  {proyecto.clienteNombre}
                  {proyecto.clienteRut && (
                    <span className="text-[11px] font-mono font-normal text-slate-400">({proyecto.clienteRut})</span>
                  )}
                </p>
                <p className="text-xs text-slate-400">{proyecto.clienteEmail || proyecto.clienteTelefono || "Sin datos de contacto"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Servicio & Estado</span>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <Badge variant="outline" className="text-[11px] border-white/15 text-slate-300">
                    {TIPO_SERVICIO_LABELS[proyecto.tipoServicio] || proyecto.tipoServicio}
                  </Badge>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${FASE_LABELS[proyecto.fase]?.color}`}>
                    {FASE_LABELS[proyecto.fase]?.label || proyecto.fase}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Fecha de Inicio</span>
                <p className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {proyecto.fechaInicio || "No definida"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Entrega Comprometida</span>
                <p className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {proyecto.fechaEntregaComprometida || "No especificada"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Presupuesto Asociado</span>
                <p className="text-xs font-mono font-bold text-emerald-400">
                  {proyecto.presupuestoNumero ? `COT-${proyecto.presupuestoNumero}` : "Presupuesto Directo"}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {formatCLP(proyecto.montos?.total)} CLP
                </p>
              </div>
            </div>
          ) : (
            /* FORMULARIO DE EDICIÓN RÁPIDA */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Nombre del Proyecto</Label>
                  <Input
                    value={proyecto.nombre}
                    onChange={(e) => setProyecto((prev) => prev ? { ...prev, nombre: e.target.value } : null)}
                    className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Tipo de Servicio</Label>
                  <Select
                    value={proyecto.tipoServicio}
                    onValueChange={(val) => setProyecto((prev) => prev ? { ...prev, tipoServicio: val as ProyectoTipoServicio } : null)}
                  >
                    <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/15 text-white">
                      {Object.entries(TIPO_SERVICIO_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-xs focus:bg-white/10">{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Fase del Proyecto</Label>
                  <Select
                    value={proyecto.fase}
                    onValueChange={(val) => setProyecto((prev) => prev ? { ...prev, fase: val as ProyectoFase } : null)}
                  >
                    <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/15 text-white">
                      {Object.entries(FASE_LABELS).map(([key, cfg]) => (
                        <SelectItem key={key} value={key} className="text-xs focus:bg-white/10">{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Fecha Inicio</Label>
                    <Input
                      type="date"
                      value={proyecto.fechaInicio ? proyecto.fechaInicio.split("T")[0] : ""}
                      onChange={(e) => setProyecto((prev) => prev ? { ...prev, fechaInicio: e.target.value } : null)}
                      className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Entrega Comprometida</Label>
                    <Input
                      type="date"
                      value={proyecto.fechaEntregaComprometida ? proyecto.fechaEntregaComprometida.split("T")[0] : ""}
                      onChange={(e) => setProyecto((prev) => prev ? { ...prev, fechaEntregaComprometida: e.target.value } : null)}
                      className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Descripción General</Label>
                <Textarea
                  value={proyecto.descripcion || ""}
                  onChange={(e) => setProyecto((prev) => prev ? { ...prev, descripcion: e.target.value } : null)}
                  rows={2}
                  className="bg-slate-900 border-white/15 text-white text-xs rounded-md resize-none"
                  placeholder="Detalles y contexto técnico del proyecto..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. DEFINICIÓN DE ALCANCE & SLA */}
      <Card className="bg-card border-white/10 rounded-lg shadow-xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">Definición de Alcance & SLA</h2>
              <p className="text-xs text-slate-400">Módulos contratados, entregables específicos y nivel de servicio</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* Listado de Ítems de Alcance */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-300">Ítems del Alcance Técnico</Label>
            <div className="space-y-2">
              {Array.isArray(proyecto.alcanceItems) && proyecto.alcanceItems.length > 0 ? (
                proyecto.alcanceItems.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between gap-3 p-3 rounded-md bg-white/5 border border-white/10 text-xs text-slate-200"
                  >
                    <span className="font-mono text-indigo-400 font-bold w-6">{idx + 1}.</span>
                    <span className="flex-1 font-medium">{item}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAlcance(idx)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-md bg-white/[0.02] border border-dashed border-white/15 text-center text-xs text-slate-400">
                  No hay ítems de alcance definidos aún. Agrega los módulos o funcionalidades clave a continuación.
                </div>
              )}
            </div>

            {/* Input para agregar ítem */}
            <div className="flex items-center gap-2 pt-1">
              <Input
                value={nuevoItemAlcance}
                onChange={(e) => setNuevoItemAlcance(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAlcance())}
                placeholder="Ej: Módulo de autenticación con Google y panel administrativo con reportes..."
                className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
              />
              <Button
                type="button"
                onClick={handleAddAlcance}
                className="h-10 px-4 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </Button>
            </div>
          </div>

          {/* SLA Detalle */}
          <div className="space-y-2 pt-3 border-t border-white/10">
            <Label className="text-xs font-bold text-slate-300">
              Acuerdo de Nivel de Servicio (SLA) & Tiempos de Respuesta
            </Label>
            <Textarea
              value={proyecto.slaDetalle || ""}
              onChange={(e) => setProyecto((prev) => prev ? { ...prev, slaDetalle: e.target.value } : null)}
              placeholder="Ej: Compromiso de uptime 99.8%. Tiempos de respuesta: Incidencia crítica < 4h hábiles, fallas medias < 12h, soporte general < 24h..."
              rows={3}
              className="bg-slate-900 border-white/15 text-white text-xs rounded-md resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. CONDICIONES COMERCIALES & PRESUPUESTO */}
      <Card className="bg-card border-white/10 rounded-lg shadow-xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">Presupuesto Asociado & Condiciones de Pago</h2>
              <p className="text-xs text-slate-400">Montos convenidos, medios de pago y origen presupuestario</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-3.5 rounded-md bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Monto Neto</span>
              <p className="text-base font-mono font-bold text-white">{formatCLP(proyecto.montos?.neto)}</p>
            </div>
            <div className="p-3.5 rounded-md bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">IVA (19%)</span>
              <p className="text-base font-mono font-bold text-slate-300">{formatCLP(proyecto.montos?.iva)}</p>
            </div>
            <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Total Convenido</span>
              <p className="text-lg font-mono font-black text-emerald-400">{formatCLP(proyecto.montos?.total)} CLP</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Medio de Pago Pactado</Label>
              <Input
                value={proyecto.condicionesComerciales?.medioPago || "Transferencia Electrónica TEF (Banco Falabella)"}
                onChange={(e) => setProyecto((prev) => prev ? {
                  ...prev,
                  condicionesComerciales: {
                    ...prev.condicionesComerciales,
                    medioPago: e.target.value
                  }
                } : null)}
                placeholder="Ej: Transferencia electrónica, 50% anticipo y 50% contra entrega"
                className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Notas Comerciales / Facturación</Label>
              <Input
                value={proyecto.condicionesComerciales?.notasPresupuesto || ""}
                onChange={(e) => setProyecto((prev) => prev ? {
                  ...prev,
                  condicionesComerciales: {
                    ...prev.condicionesComerciales,
                    notasPresupuesto: e.target.value
                  }
                } : null)}
                placeholder="Ej: Emisión de factura con Orden de Compra previa..."
                className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. DESCARGA Y SUBIDA DE PLANTILLA WORD DE ALCANCE & SLA */}
      <Card className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-lg p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              Gestión Documental ISO 9001
            </div>
            <h3 className="text-base font-black text-white">
              Plantilla Formal de Alcance & SLA (.doc / Word)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Descarga la plantilla pre-rellenada con los datos de este proyecto para modificarla en Word o Google Docs. Luego súbela de vuelta para almacenarla de forma segura en Firebase Storage con versión y código ISO.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Descargar Plantilla Word */}
            <Button
              type="button"
              onClick={() => descargarPlantillaAlcanceSLA(proyecto)}
              className="h-10 px-4 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Download className="w-4 h-4" />
              Descargar Plantilla (.doc)
            </Button>

            {/* Subir Documento a Firebase Storage */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".doc,.docx,.pdf"
                onChange={handleUploadDocumento}
                disabled={uploadingDoc}
                className="hidden"
              />
              <span className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition-colors">
                <Upload className="w-4 h-4 text-emerald-400" />
                {uploadingDoc ? "Subiendo a Firebase..." : "Subir Documento Listo"}
              </span>
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
};
