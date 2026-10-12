"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Eye, 
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Proyecto, DocumentoOperativo, TipoDocumentoOperativo } from "@/lib/types";
import { generatePDF } from "@/lib/pdf-utils";
import { toast } from "sonner";

interface DocumentoGeneratorProps {
  proyecto: Proyecto;
  documentos: DocumentoOperativo[];
  onSaveDocumento: (doc: Partial<DocumentoOperativo>) => Promise<void>;
}

export const DocumentoGenerator: React.FC<DocumentoGeneratorProps> = ({
  proyecto,
  documentos = [],
  onSaveDocumento,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentoOperativo | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoDocumentoOperativo>("acta_inicio");
  const [isGenerating, setIsGenerating] = useState(false);

  // Campos para nuevo documento
  const [titulo, setTitulo] = useState("Acta Formal de Inicio");
  const [observaciones, setObservaciones] = useState("");
  const [garantiaDias, setGarantiaDias] = useState("30");

  const handleOpenCreate = (tipo: TipoDocumentoOperativo) => {
    setTipoSeleccionado(tipo);
    if (tipo === "acta_inicio") {
      setTitulo(`Acta de Inicio - ${proyecto.nombre}`);
    } else if (tipo === "acta_entrega_conformidad") {
      setTitulo(`Acta de Entrega y Recepción Conforme - ${proyecto.nombre}`);
    } else {
      setTitulo(`Resumen Técnico de Operaciones - ${proyecto.nombre}`);
    }
    setIsCreateOpen(true);
  };

  const handleCreateDocument = async () => {
    setIsGenerating(true);
    try {
      const versionCalculada = documentos.filter((d) => d.tipo === tipoSeleccionado).length + 1;

      const nuevoDoc: Partial<DocumentoOperativo> = {
        proyectoId: proyecto.id!,
        tipo: tipoSeleccionado,
        version: versionCalculada,
        titulo: titulo.trim(),
        fechaEmision: new Date().toISOString().split("T")[0],
        estado: "emitido",
        datosGenerados: {
          proyectoNombre: proyecto.nombre,
          clienteNombre: proyecto.clienteNombre,
          clienteRut: proyecto.clienteRut,
          alcance: (proyecto.checklist || []).map((c) => `${c.categoria}: ${c.titulo}`),
          acuerdosComerciales: `Monto acordado: $${new Intl.NumberFormat("es-CL").format(proyecto.montos?.total || 0)} CLP`,
          fechasClave: {
            inicio: proyecto.fechaInicio,
            entrega: proyecto.fechaEntregaComprometida || "A convenir",
          },
          clausulasGarantia: `Garantía técnica por fallas o vicios ocultos de software por ${garantiaDias} días corridos posteriores a la entrega.`,
          observaciones: observaciones.trim() || undefined,
        },
        firmanteCliente: {
          nombre: proyecto.clienteNombre,
          rut: proyecto.clienteRut || "",
        },
      };

      await onSaveDocumento(nuevoDoc);
      setIsCreateOpen(false);
      toast.success(`Documento v${versionCalculada} generado con éxito`);
    } catch (err) {
      console.error(err);
      toast.error("Error al generar documento");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async (doc: DocumentoOperativo) => {
    setSelectedDoc(doc);
    setIsGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const filename = `${doc.tipo.toUpperCase()}_v${doc.version}_${proyecto.clienteNombre.replace(/\s+/g, "_")}`;
      await generatePDF("documento-operativo-print", filename, "save");
      toast.success("Documento descargado en PDF");
    } catch (err) {
      console.error(err);
      toast.error("Error al generar PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const getTipoLabel = (tipo: TipoDocumentoOperativo) => {
    switch (tipo) {
      case "acta_inicio":
        return "Acta de Inicio (Kickoff)";
      case "acta_entrega_conformidad":
        return "Acta de Entrega / Conformidad";
      case "resumen_tecnico":
        return "Resumen Técnico";
      default:
        return tipo;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Botones de Emisión Rápida */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-card/60 border border-white/10">
        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground mr-2">
          Emitir Nuevo Documento:
        </span>
        <Button
          size="sm"
          onClick={() => handleOpenCreate("acta_inicio")}
          className="rounded-xl bg-primary text-primary-foreground font-bold text-xs gap-1.5 shadow-md shadow-primary/20"
        >
          <FileText className="h-3.5 w-3.5" /> Acta de Inicio
        </Button>
        <Button
          size="sm"
          onClick={() => handleOpenCreate("acta_entrega_conformidad")}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Acta de Entrega
        </Button>
        <Button
          size="sm"
          onClick={() => handleOpenCreate("resumen_tecnico")}
          className="rounded-xl bg-[#2e3c7e] text-white font-bold text-xs gap-1.5 shadow-md"
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Resumen Técnico
        </Button>
      </div>

      {/* Lista de Documentos Emitidos */}
      <div className="space-y-3">
        {documentos.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs font-medium border border-dashed border-white/10 rounded-2xl">
            No se han emitido actas para este proyecto aún. Haz clic en cualquiera de los botones superiores para generar una formalmente.
          </div>
        ) : (
          documentos.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-white/10 bg-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-black shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-foreground">{doc.titulo}</h4>
                    <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black uppercase">
                      v{doc.version}.0
                    </Badge>
                    <Badge variant="outline" className="text-[9px] font-mono">
                      {getTipoLabel(doc.tipo)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fecha de emisión: {doc.fechaEmision} &bull; Estado: <strong className="text-foreground capitalize">{doc.estado}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setIsPreviewOpen(true);
                  }}
                  className="rounded-xl h-9 text-xs font-bold border-white/10 gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" /> Previsualizar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDownloadPDF(doc)}
                  disabled={isGenerating}
                  className="rounded-xl h-9 text-xs font-bold bg-[#2e3c7e] text-white hover:scale-105 transition-all gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Descargar PDF
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para Crear Documento */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[550px] border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Emitir {getTipoLabel(tipoSeleccionado)}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Se autocompletarán los datos del proyecto <strong className="text-foreground">&ldquo;{proyecto.nombre}&rdquo;</strong> y cliente <strong className="text-foreground">&ldquo;{proyecto.clienteNombre}&rdquo;</strong>.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Título del Documento
              </Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="bg-muted/40 border-white/10 h-11 rounded-xl text-xs font-bold"
              />
            </div>

            {tipoSeleccionado === "acta_entrega_conformidad" && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Días de Garantía Técnica de Soporte
                </Label>
                <Input
                  type="number"
                  value={garantiaDias}
                  onChange={(e) => setGarantiaDias(e.target.value)}
                  className="bg-muted/40 border-white/10 h-11 rounded-xl text-xs font-bold"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Observaciones o Condiciones Específicas (Opcional)
              </Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Notas de entrega, acuerdos de hosting o cláusulas de confidencialidad..."
                className="bg-muted/40 border-white/10 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateDocument}
              disabled={isGenerating}
              className="bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-lg shadow-primary/20"
            >
              Emitir y Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Previsualización Formal del Documento */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent showCloseButton={true} className="!max-w-[850px] !w-[90vw] p-0 overflow-hidden bg-card border-none shadow-2xl">
          <DialogHeader className="p-4 bg-primary text-primary-foreground border-b border-white/10 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-black tracking-tight text-primary-foreground">
              {selectedDoc?.titulo} (v{selectedDoc?.version}.0)
            </DialogTitle>
            {selectedDoc && (
              <Button
                size="sm"
                onClick={() => handleDownloadPDF(selectedDoc)}
                className="bg-[#2e3c7e] text-white rounded-xl text-xs font-bold gap-1.5 mr-6"
              >
                <Download className="h-3.5 w-3.5" /> Descargar PDF
              </Button>
            )}
          </DialogHeader>

          <div className="h-[75vh] overflow-auto p-8 bg-white text-slate-900 font-sans">
            {selectedDoc && (
              <div id="documento-operativo-modal" className="max-w-[700px] mx-auto space-y-6">
                
                {/* Header Membrete Hoja SpA */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div>
                    <img src="/logo.png" alt="Hoja SpA Logo" className="h-12 w-auto object-contain mb-1" />
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                      Servicios Informáticos Hoja SpA
                    </p>
                    <p className="text-[9px] text-slate-400">RUT: 77.XXX.XXX-X &bull; contacto@hojadev.xyz</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-mono text-xs font-black uppercase">
                      {getTipoLabel(selectedDoc.tipo)}
                    </span>
                    <p className="text-xs text-slate-600 mt-1 font-bold">Versión {selectedDoc.version}.0</p>
                    <p className="text-xs text-slate-500">Fecha: {selectedDoc.fechaEmision}</p>
                  </div>
                </div>

                {/* Datos del Proyecto y Cliente */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Proyecto</span>
                    <p className="font-black text-slate-900 text-sm">{selectedDoc.datosGenerados.proyectoNombre}</p>
                    <p className="text-slate-600 mt-0.5">{selectedDoc.datosGenerados.acuerdosComerciales}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Cliente</span>
                    <p className="font-black text-slate-900 text-sm">{selectedDoc.datosGenerados.clienteNombre}</p>
                    <p className="text-slate-600 mt-0.5">{selectedDoc.datosGenerados.clienteRut ? `RUT: ${selectedDoc.datosGenerados.clienteRut}` : "Cliente registrado"}</p>
                  </div>
                </div>

                {/* Alcance y Entregables */}
                <div className="space-y-2">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                    1. Alcance Técnico y Entregables Comprometidos
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                    {selectedDoc.datosGenerados.alcance.slice(0, 10).map((alc: string, i: number) => (
                      <li key={i}>{alc}</li>
                    ))}
                  </ul>
                </div>

                {/* Cláusula de Garantía */}
                {selectedDoc.datosGenerados.clausulasGarantia && (
                  <div className="space-y-1 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <h5 className="font-black text-[10px] uppercase text-amber-900">2. Cláusula de Garantía y Soporte</h5>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {selectedDoc.datosGenerados.clausulasGarantia}
                    </p>
                  </div>
                )}

                {/* Observaciones */}
                {selectedDoc.datosGenerados.observaciones && (
                  <div className="space-y-1">
                    <h5 className="font-black text-[10px] uppercase text-slate-900">3. Observaciones Particulares</h5>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      &ldquo;{selectedDoc.datosGenerados.observaciones}&rdquo;
                    </p>
                  </div>
                )}

                {/* Firmas */}
                <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-black text-slate-900">Servicios Informáticos Hoja SpA</p>
                    <p className="text-[10px] text-slate-500">Firma Responsable Técnico</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-black text-slate-900">{selectedDoc.firmanteCliente?.nombre || "Por el Cliente"}</p>
                    <p className="text-[10px] text-slate-500">Aceptación y Conformidad</p>
                  </div>
                </div>

              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden print template for PDF export */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        {selectedDoc && (
          <div id="documento-operativo-print" className="bg-white text-slate-900 p-12 w-[800px] font-sans space-y-6">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <img src="/logo.png" alt="Hoja SpA Logo" className="h-14 w-auto object-contain mb-1" />
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                  Servicios Informáticos Hoja SpA
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-mono text-xs font-black uppercase">
                  {getTipoLabel(selectedDoc.tipo)}
                </span>
                <p className="text-xs text-slate-600 mt-1 font-bold">Versión {selectedDoc.version}.0</p>
                <p className="text-xs text-slate-500">Fecha: {selectedDoc.fechaEmision}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Proyecto</span>
                <p className="font-black text-slate-900 text-sm">{selectedDoc.datosGenerados.proyectoNombre}</p>
                <p className="text-slate-600 mt-0.5">{selectedDoc.datosGenerados.acuerdosComerciales}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Cliente</span>
                <p className="font-black text-slate-900 text-sm">{selectedDoc.datosGenerados.clienteNombre}</p>
                <p className="text-slate-600 mt-0.5">{selectedDoc.datosGenerados.clienteRut ? `RUT: ${selectedDoc.datosGenerados.clienteRut}` : "Cliente registrado"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                1. Alcance Técnico y Entregables
              </h4>
              <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                {selectedDoc.datosGenerados.alcance.slice(0, 10).map((alc: string, i: number) => (
                  <li key={i}>{alc}</li>
                ))}
              </ul>
            </div>

            {selectedDoc.datosGenerados.clausulasGarantia && (
              <div className="space-y-1 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <h5 className="font-black text-[10px] uppercase text-amber-900">2. Cláusula de Garantía y Soporte</h5>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {selectedDoc.datosGenerados.clausulasGarantia}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8 pt-16 text-center text-xs">
              <div className="border-t border-slate-400 pt-2">
                <p className="font-black text-slate-900">Servicios Informáticos Hoja SpA</p>
                <p className="text-[10px] text-slate-500">Firma Responsable Técnico</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-black text-slate-900">{selectedDoc.firmanteCliente?.nombre || "Por el Cliente"}</p>
                <p className="text-[10px] text-slate-500">Aceptación y Conformidad</p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
