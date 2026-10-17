"use client";

import React, { useState } from "react";
import { 
  Proyecto, 
  DocumentoAdjuntoProyecto, 
  PendienteProyecto 
} from "@/lib/types";
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ExternalLink, 
  ShieldCheck, 
  Paperclip,
  CheckSquare,
  AlertCircle,
  FileCheck,
  FileCode,
  FileSpreadsheet,
  RotateCw,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { subirArchivoProyectoStorage } from "../utils/storage-upload";
import { toast } from "sonner";

interface FaseDocumentosProps {
  proyecto: Proyecto;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

const TIPO_DOC_LABELS: Record<DocumentoAdjuntoProyecto["tipoDoc"], { label: string; prefix: string; desc: string }> = {
  alcance: { 
    label: "Definición de Alcance & SLA", 
    prefix: "ALC",
    desc: "Especificación técnica, requerimientos y compromisos SLA" 
  },
  minuta_reunion: { 
    label: "Minuta de Reunión / QA", 
    prefix: "REU",
    desc: "Registro de avance, pruebas demostrativas y acuerdos de sesión" 
  },
  acta_cierre: { 
    label: "Acta de Cierre & Conformidad", 
    prefix: "ACT",
    desc: "Recepción formal de entregables y traspaso operativo" 
  },
  garantia: { 
    label: "Carta de Garantía Técnica", 
    prefix: "GAR",
    desc: "Compromiso de soporte gratuito y cobertura post-despliegue" 
  },
  contrato: { 
    label: "Contrato / Orden de Compra", 
    prefix: "CON",
    desc: "Instrumento legal o administrativo firmado entre partes" 
  },
  otro: { 
    label: "Otro Documento Operativo", 
    prefix: "DOC",
    desc: "Diagramas, certificados o anexos técnicos complementarios" 
  },
};

export const FaseDocumentos: React.FC<FaseDocumentosProps> = ({
  proyecto,
  setProyecto,
  onSave,
  isSaving,
}) => {
  // Modal de Subida de Documento
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docTipo, setDocTipo] = useState<DocumentoAdjuntoProyecto["tipoDoc"]>("alcance");
  const [docEstado, setDocEstado] = useState<"borrador" | "emitido" | "firmado">("emitido");
  const [docNotas, setDocNotas] = useState("");
  const [uploading, setUploading] = useState(false);

  // Campos contextuales según el tipo de documento
  const [campoAlcanceVersion, setCampoAlcanceVersion] = useState("v1.0");
  const [campoReunionFecha, setCampoReunionFecha] = useState(new Date().toISOString().split("T")[0]);
  const [campoReunionAsistentes, setCampoReunionAsistentes] = useState("");
  const [campoCierreReceptor, setCampoCierreReceptor] = useState("");
  const [campoGarantiaDias, setCampoGarantiaDias] = useState(60);
  const [campoContratoNumero, setCampoContratoNumero] = useState("");

  // Input para nuevo pendiente
  const [nuevoPendienteTitulo, setNuevoPendienteTitulo] = useState("");
  const [nuevoPendienteResp, setNuevoPendienteResp] = useState("Hoja SpA");
  const [nuevoPendienteFecha, setNuevoPendienteFecha] = useState("");

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Validación estricta: solo PDF o Word
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext || "")) {
      toast.error("Formato no permitido. Solo se aceptan documentos PDF o Word (.pdf, .doc, .docx)");
      e.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    // Detección automática inteligente según el nombre del archivo
    const lower = file.name.toLowerCase();
    if (lower.includes("minuta") || lower.includes("reunion") || lower.includes("qa")) {
      setDocTipo("minuta_reunion");
    } else if (lower.includes("alcance") || lower.includes("sla")) {
      setDocTipo("alcance");
    } else if (lower.includes("acta") || lower.includes("cierre") || lower.includes("entrega")) {
      setDocTipo("acta_cierre");
    } else if (lower.includes("garantia")) {
      setDocTipo("garantia");
    } else if (lower.includes("contrato") || lower.includes("orden") || lower.includes("oc")) {
      setDocTipo("contrato");
    }

    if (lower.includes("firmad") || lower.includes("signed")) {
      setDocEstado("firmado");
    }
  };

  // Subir Documento a Firebase Storage
  const handleUploadSubmit = async () => {
    if (!selectedFile || !proyecto.id) return;

    try {
      setUploading(true);
      const res = await subirArchivoProyectoStorage(proyecto.id, selectedFile);
      const docsCount = (proyecto.archivosAdjuntos || []).length + 1;
      const prefix = TIPO_DOC_LABELS[docTipo]?.prefix || "DOC";
      const codigoIso = `SGC-PRY-${prefix}-${String(docsCount).padStart(3, "0")}`;

      // Ensamblar resumen de notas contextuales
      let metaNotas = docNotas.trim();
      if (docTipo === "alcance" && campoAlcanceVersion) {
        metaNotas = `[Versión: ${campoAlcanceVersion}] ${metaNotas}`.trim();
      } else if (docTipo === "minuta_reunion") {
        metaNotas = `[Fecha: ${campoReunionFecha}${campoReunionAsistentes ? ` | Asistentes: ${campoReunionAsistentes}` : ""}] ${metaNotas}`.trim();
      } else if (docTipo === "acta_cierre" && campoCierreReceptor) {
        metaNotas = `[Recepción Conforme por: ${campoCierreReceptor}] ${metaNotas}`.trim();
      } else if (docTipo === "garantia") {
        metaNotas = `[Vigencia: ${campoGarantiaDias} días] ${metaNotas}`.trim();
      } else if (docTipo === "contrato" && campoContratoNumero) {
        metaNotas = `[N° Contrato/OC: ${campoContratoNumero}] ${metaNotas}`.trim();
      }

      const nuevoDoc: DocumentoAdjuntoProyecto = {
        id: `doc-${Date.now()}`,
        nombre: selectedFile.name,
        tipoDoc: docTipo,
        codigoIso,
        fileUrl: res.fileUrl,
        storagePath: res.storagePath,
        fileType: res.fileType,
        tamanoBytes: res.tamanoBytes,
        fechaSubida: new Date().toISOString(),
        estado: docEstado,
        notas: metaNotas || undefined,
      };

      const adjuntos = Array.isArray(proyecto.archivosAdjuntos) ? [...proyecto.archivosAdjuntos] : [];
      setProyecto((prev) => prev ? {
        ...prev,
        archivosAdjuntos: [nuevoDoc, ...adjuntos]
      } : null);

      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setDocNotas("");
      setCampoReunionAsistentes("");
      setCampoCierreReceptor("");
      setCampoContratoNumero("");
      toast.success("Documento catalogado con código ISO 9001 y almacenado en Firebase Storage");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = (docId: string) => {
    const adjuntos = (proyecto.archivosAdjuntos || []).filter((d) => d.id !== docId);
    setProyecto((prev) => prev ? { ...prev, archivosAdjuntos: adjuntos } : null);
    toast.success("Documento retirado del proyecto");
  };

  // Gestión de Pendientes
  const handleAddPendiente = () => {
    if (!nuevoPendienteTitulo.trim()) return;
    const pendientes = Array.isArray(proyecto.pendientes) ? [...proyecto.pendientes] : [];

    const nuevo: PendienteProyecto = {
      id: `pend-${Date.now()}`,
      titulo: nuevoPendienteTitulo.trim(),
      completado: false,
      responsable: nuevoPendienteResp.trim() || "Hoja SpA",
      fechaLimite: nuevoPendienteFecha || undefined,
    };

    setProyecto((prev) => prev ? {
      ...prev,
      pendientes: [...pendientes, nuevo]
    } : null);

    setNuevoPendienteTitulo("");
    setNuevoPendienteFecha("");
  };

  const handleTogglePendiente = (id: string) => {
    const pendientes = (proyecto.pendientes || []).map((p) => {
      if (p.id === id) {
        return { ...p, completado: !p.completado };
      }
      return p;
    });
    setProyecto((prev) => prev ? { ...prev, pendientes } : null);
  };

  const handleDeletePendiente = (id: string) => {
    const pendientes = (proyecto.pendientes || []).filter((p) => p.id !== id);
    setProyecto((prev) => prev ? { ...prev, pendientes } : null);
  };

  return (
    <div className="space-y-6">
      {/* REPOSITORIO DE DOCUMENTOS FORMALES ISO 9001 */}
      <Card className="bg-card border-white/10 rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                Repositorio Documental & Control de Calidad
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  ISO 9001
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Archivos oficiales en Firebase Storage clasificados con codificación formal
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="h-8.5 px-3.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5 shadow-md shadow-indigo-600/30 shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            Subir Documento (.pdf / .doc)
          </Button>
        </div>

        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Tabla de Documentos Subidos */}
          <div className="overflow-x-auto rounded-md border border-white/10">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                  <th className="py-2.5 px-3 font-bold">Código ISO</th>
                  <th className="py-2.5 px-3 font-bold">Documento / Archivo</th>
                  <th className="py-2.5 px-3 font-bold">Tipo</th>
                  <th className="py-2.5 px-3 font-bold">Estado</th>
                  <th className="py-2.5 px-3 font-bold">Metadatos / Notas</th>
                  <th className="py-2.5 px-3 font-bold">Tamaño</th>
                  <th className="py-2.5 px-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(proyecto.archivosAdjuntos || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No hay documentos cargados en el repositorio del proyecto aún.
                    </td>
                  </tr>
                ) : (
                  (proyecto.archivosAdjuntos || []).map((doc) => {
                    const tipoCfg = TIPO_DOC_LABELS[doc.tipoDoc] || TIPO_DOC_LABELS.otro;
                    return (
                      <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">
                          {doc.codigoIso || "—"}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-white max-w-[200px] truncate" title={doc.nombre}>
                          {doc.nombre}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {tipoCfg.label}
                        </td>
                        <td className="py-2.5 px-3">
                          {doc.estado === "firmado" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Firmado
                            </span>
                          ) : doc.estado === "emitido" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                              Emitido
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/30">
                              Borrador
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-[220px] truncate" title={doc.notas || ""}>
                          {doc.notas || "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                          {formatBytes(doc.tamanoBytes)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(doc.fileUrl, "_blank")}
                              className="h-7 w-7 p-0 text-slate-300 hover:text-white hover:bg-white/10 rounded-md"
                              title="Abrir o Descargar documento"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md"
                              title="Eliminar del repositorio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* GESTIÓN DE TAREAS Y PENDIENTES */}
      <Card className="bg-card border-white/10 rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Pendientes Operativos & Tareas de Cierre</h3>
              <p className="text-xs text-slate-400">
                Compromisos y requerimientos pendientes para la entrega final del proyecto
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-slate-400">
            {(proyecto.pendientes || []).filter((p) => p.completado).length}/{(proyecto.pendientes || []).length} resueltos
          </span>
        </div>

        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Listado de pendientes */}
          <div className="space-y-2">
            {(proyecto.pendientes || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No hay pendientes registrados en el proyecto.
              </p>
            ) : (
              (proyecto.pendientes || []).map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-md border transition-all ${
                    p.completado
                      ? "bg-emerald-500/5 border-emerald-500/20 text-slate-400"
                      : "bg-white/[0.02] border-white/10 text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePendiente(p.id)}
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-all cursor-pointer ${
                        p.completado
                          ? "bg-emerald-500 border-emerald-500 text-slate-950"
                          : "border-white/30 hover:border-white/60"
                      }`}
                    >
                      {p.completado && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <span className={`text-xs font-medium truncate ${p.completado ? "line-through text-slate-400" : ""}`}>
                      {p.titulo}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {p.responsable && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                        {p.responsable}
                      </span>
                    )}
                    {p.fechaLimite && (
                      <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {p.fechaLimite}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePendiente(p.id)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Formulario rápido para agregar pendiente */}
          <div className="p-3.5 rounded-md bg-white/5 border border-white/10 space-y-2.5">
            <span className="text-xs font-bold text-white block">Nuevo Pendiente o Requerimiento de Calidad:</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <Input
                value={nuevoPendienteTitulo}
                onChange={(e) => setNuevoPendienteTitulo(e.target.value)}
                placeholder="Título del pendiente (ej: Validar certificado SSL / Entrega de manual)..."
                className="sm:col-span-2 bg-slate-900 border-white/15 text-white text-xs h-8.5 rounded-md"
              />
              <Input
                value={nuevoPendienteResp}
                onChange={(e) => setNuevoPendienteResp(e.target.value)}
                placeholder="Responsable (ej: Hoja SpA / Cliente)"
                className="bg-slate-900 border-white/15 text-white text-xs h-8.5 rounded-md"
              />
              <Input
                type="date"
                value={nuevoPendienteFecha}
                onChange={(e) => setNuevoPendienteFecha(e.target.value)}
                className="bg-slate-900 border-white/15 text-white text-xs h-8.5 rounded-md"
              />
            </div>

            <Button
              type="button"
              onClick={handleAddPendiente}
              className="h-8.5 px-3.5 rounded-md bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Pendiente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MODAL GUIADO: SUBIR DOCUMENTO (PDF / WORD) CON CLASIFICACIÓN PREVIA Y CAMPOS CONTEXTUALES */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[520px] bg-slate-950 border border-white/15 text-slate-100 rounded-lg shadow-2xl p-5 sm:p-6">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-white">Subir y Catalogar Documento</DialogTitle>
                <p className="text-xs text-slate-400">Gestión de Calidad ISO 9001 en Firebase Storage</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Paso 1: Tipo de Documento */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Tipo de Documento (Clasificación ISO)</Label>
              <Select value={docTipo} onValueChange={(val) => setDocTipo(val as DocumentoAdjuntoProyecto["tipoDoc"])}>
                <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/15 text-white">
                  {Object.entries(TIPO_DOC_LABELS).map(([k, cfg]) => (
                    <SelectItem key={k} value={k} className="text-xs">
                      {cfg.label} ({cfg.prefix})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-400 italic">
                {TIPO_DOC_LABELS[docTipo]?.desc} &bull; Código sugerido: <strong>SGC-PRY-{TIPO_DOC_LABELS[docTipo]?.prefix}-00{((proyecto.archivosAdjuntos || []).length + 1)}</strong>
              </p>
            </div>

            {/* Paso 2: Selector de Archivo (.pdf, .doc, .docx) */}
            <div className="space-y-1.5 p-3 rounded-md bg-white/[0.02] border border-white/10">
              <Label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Archivo (Únicamente PDF o Word)</span>
                <span className="text-[10px] text-indigo-300 font-mono font-bold">.pdf, .doc, .docx</span>
              </Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md cursor-pointer"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400 font-bold">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span className="truncate">{selectedFile.name}</span>
                  <span className="text-slate-400 font-mono">({formatBytes(selectedFile.size)})</span>
                </div>
              )}
            </div>

            {/* Paso 3: Campos contextuales según el tipo de documento */}
            <div className="p-3 rounded-md bg-slate-900/60 border border-white/10 space-y-3">
              <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wide">
                Campos Específicos para: {TIPO_DOC_LABELS[docTipo]?.label}
              </span>

              {docTipo === "alcance" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-300">Versión de Alcance</Label>
                    <Input
                      value={campoAlcanceVersion}
                      onChange={(e) => setCampoAlcanceVersion(e.target.value)}
                      placeholder="v1.0"
                      className="bg-slate-950 border-white/15 text-white text-xs h-8 rounded-md"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-300">Cotización Origen</Label>
                    <Input
                      value={proyecto.presupuestoNumero ? `COT-${proyecto.presupuestoNumero}` : "Contrato Directo"}
                      readOnly
                      className="bg-slate-950 border-white/15 text-slate-400 text-xs h-8 rounded-md"
                    />
                  </div>
                </div>
              )}

              {docTipo === "minuta_reunion" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-300">Fecha de Reunión</Label>
                      <Input
                        type="date"
                        value={campoReunionFecha}
                        onChange={(e) => setCampoReunionFecha(e.target.value)}
                        className="bg-slate-950 border-white/15 text-white text-xs h-8 rounded-md"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-300">Asistentes Clave</Label>
                      <Input
                        value={campoReunionAsistentes}
                        onChange={(e) => setCampoReunionAsistentes(e.target.value)}
                        placeholder="Ej: Gerente TI, PM"
                        className="bg-slate-950 border-white/15 text-white text-xs h-8 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              {docTipo === "acta_cierre" && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-300">Nombre de Contraparte que Acepta Conforme</Label>
                  <Input
                    value={campoCierreReceptor}
                    onChange={(e) => setCampoCierreReceptor(e.target.value)}
                    placeholder="Ej: Roberto Salas (Gerente Operaciones Mandante)"
                    className="bg-slate-950 border-white/15 text-white text-xs h-8 rounded-md"
                  />
                </div>
              )}

              {docTipo === "garantia" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-300">Días de Cobertura</Label>
                    <Input
                      type="number"
                      value={campoGarantiaDias}
                      onChange={(e) => setCampoGarantiaDias(parseInt(e.target.value) || 60)}
                      className="bg-slate-950 border-white/15 text-white text-xs h-8 rounded-md font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-300">Canal de Soporte</Label>
                    <Input
                      value="contacto@hojaspa.cl"
                      readOnly
                      className="bg-slate-950 border-white/15 text-slate-400 text-xs h-8 rounded-md"
                    />
                  </div>
                </div>
              )}

              {docTipo === "contrato" && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-300">N° de Contrato u Orden de Compra (OC)</Label>
                  <Input
                    value={campoContratoNumero}
                    onChange={(e) => setCampoContratoNumero(e.target.value)}
                    placeholder="Ej: OC-4491-2026"
                    className="bg-slate-950 border-white/15 text-white text-xs h-8 rounded-md font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-300">Estado del Documento</Label>
                  <Select value={docEstado} onValueChange={(val) => setDocEstado(val as "borrador" | "emitido" | "firmado")}>
                    <SelectTrigger className="bg-slate-950 border-white/15 text-white text-xs h-8 rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/15 text-white">
                      <SelectItem value="emitido" className="text-xs">Emitido</SelectItem>
                      <SelectItem value="firmado" className="text-xs text-emerald-400 font-bold">Firmado por Cliente</SelectItem>
                      <SelectItem value="borrador" className="text-xs text-slate-400">Borrador Interno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-300">Resumen / Notas</Label>
                  <Input
                    value={docNotas}
                    onChange={(e) => setDocNotas(e.target.value)}
                    placeholder="Observaciones..."
                    className="bg-slate-950 border-white/15 text-white text-xs h-8 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUploadModalOpen(false)}
              className="bg-white/5 border-white/15 text-slate-300 text-xs h-9 rounded-md"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={uploading || !selectedFile}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-9 rounded-md px-4 gap-1.5"
            >
              {uploading ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Subir y Catalogar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
