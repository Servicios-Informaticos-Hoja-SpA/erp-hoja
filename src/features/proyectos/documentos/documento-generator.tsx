"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Eye, 
  ShieldCheck,
  Plus,
  Key,
  Wrench,
  Sparkles,
  GitPullRequest
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
  const [slaDetalle, setSlaDetalle] = useState(
    proyecto.slaDetalle || "Respuesta en < 4 horas para incidentes críticos; disponibilidad de infraestructura 99.5%; soporte preventivo mensual."
  );
  const [credencialesTexto, setCredencialesTexto] = useState(
    proyecto.especificacionesCierre?.accesosTraspasados || "Panel Hosting/Cloud, Repositorio Git y accesos administrativos traspasados al cliente."
  );
  const [entregablesTexto, setEntregablesTexto] = useState(
    proyecto.especificacionesCierre?.urlsDespliegue || "URL de Producción / Sistema operativo y seriales de hardware verificados."
  );

  const handleOpenCreate = (tipo: TipoDocumentoOperativo) => {
    setTipoSeleccionado(tipo);
    if (tipo === "propuesta_sla") {
      setTitulo(`Propuesta Técnico-Comercial & SLA - ${proyecto.nombre}`);
    } else if (tipo === "acta_inicio") {
      setTitulo(`Acta Formal de Inicio - ${proyecto.nombre}`);
    } else if (tipo === "solicitud_cambio") {
      setTitulo(`Mini-Anexo Modificación de Alcance (CR) - ${proyecto.nombre}`);
    } else if (tipo === "acta_entrega_conformidad") {
      setTitulo(`Acta de Entrega y Recepción Conforme - ${proyecto.nombre}`);
    } else if (tipo === "traspaso_accesos") {
      setTitulo(`Ficha de Traspaso de Accesos y Credenciales - ${proyecto.nombre}`);
    } else if (tipo === "informe_mantencion") {
      setTitulo(`Informe Periódico de Mantención - ${proyecto.nombre}`);
    } else {
      setTitulo(`Resumen Técnico de Operaciones - ${proyecto.nombre}`);
    }
    setIsCreateOpen(true);
  };

  const handleCreateDocument = async () => {
    setIsGenerating(true);
    try {
      const versionCalculada = documentos.filter((d) => d.tipo === tipoSeleccionado).length + 1;

      // Compilación de alcance técnico desde checklist o ítems
      const alcanceCompilado = (proyecto.alcanceItems && proyecto.alcanceItems.length > 0)
        ? proyecto.alcanceItems
        : (proyecto.checklist || []).map((c) => `${c.categoria}: ${c.titulo}`);

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
          alcance: alcanceCompilado,
          acuerdosComerciales: `Monto acordado: $${new Intl.NumberFormat("es-CL").format(proyecto.montos?.total || 0)} CLP ${proyecto.presupuestoNumero ? `(Cotización COT-${proyecto.presupuestoNumero})` : ""}`,
          fechasClave: {
            inicio: proyecto.fechaInicio,
            entrega: proyecto.fechaEntregaComprometida || "A convenir",
          },
          entregablesTecnicos: entregablesTexto ? entregablesTexto.split("\n").filter(Boolean) : undefined,
          credencialesOAccesos: credencialesTexto ? credencialesTexto.split("\n").filter(Boolean) : undefined,
          clausulasGarantia: `Garantía técnica por fallas o vicios ocultos por ${garantiaDias} días corridos posteriores a la emisión de esta acta formal.`,
          observaciones: observaciones.trim() || undefined,
          slaDetalle: tipoSeleccionado === "propuesta_sla" ? slaDetalle : undefined,
          crDetalles: tipoSeleccionado === "solicitud_cambio" && proyecto.solicitudesCambio && proyecto.solicitudesCambio.length > 0
            ? {
                numero: proyecto.solicitudesCambio[proyecto.solicitudesCambio.length - 1].numero,
                impactoHoras: proyecto.solicitudesCambio[proyecto.solicitudesCambio.length - 1].impactoHoras,
                impactoCostoNeto: proyecto.solicitudesCambio[proyecto.solicitudesCambio.length - 1].impactoCostoNeto,
                estado: proyecto.solicitudesCambio[proyecto.solicitudesCambio.length - 1].estado,
              }
            : undefined,
          metricasPostventa: tipoSeleccionado === "informe_mantencion"
            ? {
                ticketsCerrados: 1,
                ticketsAbiertos: 0,
                horasConsumidas: 4,
                preventivasRealizadas: [
                  "Actualización de parches y dependencias de seguridad",
                  "Revisión de backups automáticos y comprobación de integridad",
                  "Monitoreo de almacenamiento y rendimiento del sistema",
                ],
              }
            : undefined,
        },
        firmanteCliente: {
          nombre: proyecto.clienteNombre,
          rut: proyecto.clienteRut || "",
        },
      };

      await onSaveDocumento(nuevoDoc);
      setIsCreateOpen(false);
      toast.success(`Documento v${versionCalculada}.0 generado con éxito`);
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
      toast.success("Documento formal descargado en PDF");
    } catch (err) {
      console.error(err);
      toast.error("Error al generar PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const getTipoLabel = (tipo: TipoDocumentoOperativo) => {
    switch (tipo) {
      case "propuesta_sla":
        return "Propuesta Técnico-Comercial & SLA";
      case "acta_inicio":
        return "Acta Formal de Inicio (Kickoff)";
      case "solicitud_cambio":
        return "Mini-Anexo de Modificación de Alcance (CR)";
      case "acta_entrega_conformidad":
        return "Acta de Entrega y Recepción Técnica";
      case "traspaso_accesos":
        return "Ficha de Traspaso de Accesos y Credenciales";
      case "informe_mantencion":
        return "Informe Periódico de Mantención";
      case "resumen_tecnico":
        return "Resumen Técnico";
      default:
        return tipo;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Botones de Emisión Rápida de Documentos ISO 9001 */}
      <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Generador de Expediente Documental (ISO 9001)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {documentos.length} documento(s) emitido(s)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Button
            size="sm"
            onClick={() => handleOpenCreate("propuesta_sla")}
            className="rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-bold text-xs justify-start h-9 gap-1.5"
          >
            <FileText className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span className="truncate">1. Propuesta & SLA</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenCreate("acta_inicio")}
            className="rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-bold text-xs justify-start h-9 gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span className="truncate">1. Acta de Inicio</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenCreate("solicitud_cambio")}
            className="rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs justify-start h-9 gap-1.5"
          >
            <GitPullRequest className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate">2. Anexo Cambio (CR)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenCreate("acta_entrega_conformidad")}
            className="rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs justify-start h-9 gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">3. Acta de Entrega</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenCreate("traspaso_accesos")}
            className="rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold text-xs justify-start h-9 gap-1.5"
          >
            <Key className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">3. Traspaso Accesos</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenCreate("informe_mantencion")}
            className="rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-bold text-xs justify-start h-9 gap-1.5"
          >
            <Wrench className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">4. Informe Mantención</span>
          </Button>
        </div>
      </div>

      {/* Lista de Documentos Emitidos */}
      <div className="space-y-3">
        {documentos.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs font-medium border border-dashed border-white/10 rounded-2xl bg-card/30">
            No se han generado actas para este proyecto aún. Haz clic en cualquiera de los botones superiores para generar y descargar un documento formal en PDF.
          </div>
        ) : (
          documentos.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-white/10 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-black shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-sm text-foreground">{doc.titulo}</h4>
                    <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black uppercase">
                      v{doc.version}.0
                    </Badge>
                    <Badge variant="outline" className="text-[9px] font-mono border-white/10">
                      {getTipoLabel(doc.tipo)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fecha de emisión: {doc.fechaEmision} &bull; Estado: <strong className="text-foreground capitalize">{doc.estado}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setIsPreviewOpen(true);
                  }}
                  className="rounded-xl h-9 text-xs font-bold border-white/10 gap-1.5 hover:bg-muted/60"
                >
                  <Eye className="h-3.5 w-3.5" /> Ver Vista Previa
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDownloadPDF(doc)}
                  disabled={isGenerating}
                  className="rounded-xl h-9 text-xs font-bold bg-primary text-primary-foreground hover:scale-105 transition-all gap-1.5 shadow-md shadow-primary/20"
                >
                  <Download className="h-3.5 w-3.5" /> Descargar PDF
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para Crear y Parametrizar Documento */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[580px] border border-white/10 bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Generar {getTipoLabel(tipoSeleccionado)}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Proyecto: <strong className="text-foreground">{proyecto.nombre}</strong> &bull; Cliente: <strong className="text-foreground">{proyecto.clienteNombre}</strong>
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Título del Documento
              </Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="bg-muted/40 border-white/10 h-10 rounded-xl text-xs font-bold"
              />
            </div>

            {tipoSeleccionado === "propuesta_sla" && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Acuerdo de Nivel de Servicio (SLA)
                </Label>
                <Textarea
                  value={slaDetalle}
                  onChange={(e) => setSlaDetalle(e.target.value)}
                  className="bg-muted/40 border-white/10 rounded-xl text-xs min-h-[70px]"
                  placeholder="Definición de tiempos de respuesta, canales y disponibilidad..."
                />
              </div>
            )}

            {(tipoSeleccionado === "acta_entrega_conformidad" || tipoSeleccionado === "traspaso_accesos") && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Entregables Técnicos / URLs / Seriales
                </Label>
                <Textarea
                  value={entregablesTexto}
                  onChange={(e) => setEntregablesTexto(e.target.value)}
                  className="bg-muted/40 border-white/10 rounded-xl text-xs min-h-[60px]"
                  placeholder="Ingresa cada entregable o URL en una línea..."
                />
              </div>
            )}

            {tipoSeleccionado === "traspaso_accesos" && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Credenciales / Cuentas Traspasadas
                </Label>
                <Textarea
                  value={credencialesTexto}
                  onChange={(e) => setCredencialesTexto(e.target.value)}
                  className="bg-muted/40 border-white/10 rounded-xl text-xs min-h-[60px]"
                  placeholder="Detalla paneles, repositorios o usuarios entregados..."
                />
              </div>
            )}

            {tipoSeleccionado === "acta_entrega_conformidad" && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Días de Garantía Técnica Post-Entrega
                </Label>
                <Input
                  type="number"
                  value={garantiaDias}
                  onChange={(e) => setGarantiaDias(e.target.value)}
                  className="bg-muted/40 border-white/10 h-10 rounded-xl text-xs font-bold"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Observaciones o Cláusulas Específicas (Opcional)
              </Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones adicionales para el acta formal..."
                className="bg-muted/40 border-white/10 rounded-xl text-xs min-h-[60px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)} className="rounded-xl text-xs">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateDocument}
              disabled={isGenerating}
              className="bg-primary text-primary-foreground font-black text-xs rounded-xl"
            >
              {isGenerating ? "Generando..." : "Emitir Documento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Previsualización */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[750px] border border-white/10 bg-card p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-4 bg-muted/40 border-b border-white/10 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-black text-foreground">
              {selectedDoc?.titulo}
            </DialogTitle>
            {selectedDoc && (
              <Button
                size="sm"
                onClick={() => handleDownloadPDF(selectedDoc)}
                className="rounded-xl h-8 bg-primary text-primary-foreground font-black text-xs gap-1.5 mr-6"
              >
                <Download className="h-3.5 w-3.5" /> Descargar PDF
              </Button>
            )}
          </DialogHeader>

          <div className="h-[75vh] overflow-auto p-8 bg-white text-slate-900 font-sans">
            {selectedDoc && (
              <div id="documento-operativo-modal" className="max-w-[650px] mx-auto space-y-6 text-xs">
                
                {/* Header Membrete */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div>
                    <img src="/logo.png" alt="Hoja SpA Logo" className="h-12 w-auto object-contain mb-1" />
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-700">
                      Servicios Informáticos Hoja SpA
                    </p>
                    <p className="text-[9px] text-slate-500">contacto@hojadev.xyz &bull; Gestión Documental ISO 9001</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-mono text-[10px] font-black uppercase">
                      {getTipoLabel(selectedDoc.tipo)}
                    </span>
                    <p className="text-xs text-slate-600 mt-1 font-bold">Versión {selectedDoc.version}.0</p>
                    <p className="text-xs text-slate-500">Fecha: {selectedDoc.fechaEmision}</p>
                  </div>
                </div>

                {/* Datos del Proyecto y Cliente */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
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

                {/* SLA si aplica */}
                {selectedDoc.datosGenerados.slaDetalle && (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
                    <h5 className="font-black text-[10px] uppercase text-sky-950">Acuerdo de Nivel de Servicio (SLA)</h5>
                    <p className="text-slate-700 leading-relaxed">{selectedDoc.datosGenerados.slaDetalle}</p>
                  </div>
                )}

                {/* Alcance y Entregables */}
                <div className="space-y-2">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                    1. Alcance Técnico y Entregables Comprometidos
                  </h4>
                  <ul className="list-disc pl-5 text-slate-700 space-y-1">
                    {selectedDoc.datosGenerados.alcance.slice(0, 10).map((alc: string, i: number) => (
                      <li key={i}>{alc}</li>
                    ))}
                  </ul>
                </div>

                {/* Entregables técnicos específicos */}
                {selectedDoc.datosGenerados.entregablesTecnicos && selectedDoc.datosGenerados.entregablesTecnicos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                      2. Componentes y Especificaciones Técnicas
                    </h4>
                    <ul className="list-disc pl-5 text-slate-700 space-y-1">
                      {selectedDoc.datosGenerados.entregablesTecnicos.map((e: string, i: number) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Credenciales o accesos si aplica */}
                {selectedDoc.datosGenerados.credencialesOAccesos && selectedDoc.datosGenerados.credencialesOAccesos.length > 0 && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">
                      3. Accesos y Credenciales Entregadas
                    </h4>
                    <ul className="list-disc pl-5 text-slate-700 space-y-1">
                      {selectedDoc.datosGenerados.credencialesOAccesos.map((c: string, i: number) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cláusula de Garantía */}
                {selectedDoc.datosGenerados.clausulasGarantia && (
                  <div className="space-y-1 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <h5 className="font-black text-[10px] uppercase text-amber-900">Cláusula de Garantía y Soporte</h5>
                    <p className="text-amber-900 leading-relaxed">
                      {selectedDoc.datosGenerados.clausulasGarantia}
                    </p>
                  </div>
                )}

                {/* Observaciones */}
                {selectedDoc.datosGenerados.observaciones && (
                  <div className="space-y-1">
                    <h5 className="font-black text-[10px] uppercase text-slate-900">Observaciones</h5>
                    <p className="text-slate-700 leading-relaxed italic">
                      &ldquo;{selectedDoc.datosGenerados.observaciones}&rdquo;
                    </p>
                  </div>
                )}

                {/* Firmas */}
                <div className="grid grid-cols-2 gap-8 pt-10 text-center">
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-black text-slate-900">Servicios Informáticos Hoja SpA</p>
                    <p className="text-[10px] text-slate-500">Responsable Técnico</p>
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
          <div id="documento-operativo-print" className="bg-white text-slate-900 p-12 w-[800px] font-sans space-y-6 text-xs">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <img src="/logo.png" alt="Hoja SpA Logo" className="h-14 w-auto object-contain mb-1" />
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-700">
                  Servicios Informáticos Hoja SpA
                </p>
                <p className="text-[9px] text-slate-500">contacto@hojadev.xyz &bull; Gestión Documental ISO 9001</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-mono text-[10px] font-black uppercase">
                  {getTipoLabel(selectedDoc.tipo)}
                </span>
                <p className="text-xs text-slate-600 mt-1 font-bold">Versión {selectedDoc.version}.0</p>
                <p className="text-xs text-slate-500">Fecha: {selectedDoc.fechaEmision}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
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

            {selectedDoc.datosGenerados.slaDetalle && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
                <h5 className="font-black text-[10px] uppercase text-sky-950">Acuerdo de Nivel de Servicio (SLA)</h5>
                <p className="text-slate-700 leading-relaxed">{selectedDoc.datosGenerados.slaDetalle}</p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                1. Alcance Técnico y Entregables Comprometidos
              </h4>
              <ul className="list-disc pl-5 text-slate-700 space-y-1">
                {selectedDoc.datosGenerados.alcance.slice(0, 10).map((alc: string, i: number) => (
                  <li key={i}>{alc}</li>
                ))}
              </ul>
            </div>

            {selectedDoc.datosGenerados.entregablesTecnicos && selectedDoc.datosGenerados.entregablesTecnicos.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  2. Componentes y Especificaciones Técnicas
                </h4>
                <ul className="list-disc pl-5 text-slate-700 space-y-1">
                  {selectedDoc.datosGenerados.entregablesTecnicos.map((e: string, i: number) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedDoc.datosGenerados.credencialesOAccesos && selectedDoc.datosGenerados.credencialesOAccesos.length > 0 && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">
                  3. Accesos y Credenciales Entregadas
                </h4>
                <ul className="list-disc pl-5 text-slate-700 space-y-1">
                  {selectedDoc.datosGenerados.credencialesOAccesos.map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedDoc.datosGenerados.clausulasGarantia && (
              <div className="space-y-1 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <h5 className="font-black text-[10px] uppercase text-amber-900">Cláusula de Garantía y Soporte</h5>
                <p className="text-amber-900 leading-relaxed">
                  {selectedDoc.datosGenerados.clausulasGarantia}
                </p>
              </div>
            )}

            {selectedDoc.datosGenerados.observaciones && (
              <div className="space-y-1">
                <h5 className="font-black text-[10px] uppercase text-slate-900">Observaciones</h5>
                <p className="text-slate-700 leading-relaxed italic">
                  &ldquo;{selectedDoc.datosGenerados.observaciones}&rdquo;
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8 pt-16 text-center">
              <div className="border-t border-slate-400 pt-2">
                <p className="font-black text-slate-900">Servicios Informáticos Hoja SpA</p>
                <p className="text-[10px] text-slate-500">Responsable Técnico</p>
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
