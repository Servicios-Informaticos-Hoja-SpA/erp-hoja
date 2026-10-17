"use client";

import React, { useState } from "react";
import { 
  Proyecto, 
  ReunionProyecto, 
  ChecklistItem, 
  TicketSeveridad 
} from "@/lib/types";
import { 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  LifeBuoy, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  ExternalLink,
  Upload,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  descargarPlantillaMinutaReunion, 
  descargarPlantillaActaCierreYGarantia 
} from "../utils/documento-word";
import { subirArchivoProyectoStorage } from "../utils/storage-upload";
import { saveTicket } from "@/lib/services";
import { toast } from "sonner";

interface FaseCalidadProps {
  proyecto: Proyecto;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export const FaseCalidad: React.FC<FaseCalidadProps> = ({
  proyecto,
  setProyecto,
  onSave,
  isSaving,
}) => {
  // Modal para agendar / registrar reunión
  const [isReunionModalOpen, setIsReunionModalOpen] = useState(false);
  const [reuTitulo, setReuTitulo] = useState("");
  const [reuTipo, setReuTipo] = useState<ReunionProyecto["tipo"]>("avance");
  const [reuFecha, setReuFecha] = useState(new Date().toISOString().split("T")[0]);
  const [reuHora, setReuHora] = useState("10:00");
  const [reuAsistentes, setReuAsistentes] = useState("");
  const [reuPuntos, setReuPuntos] = useState("");
  const [reuFeedback, setReuFeedback] = useState("");
  const [reuAcuerdos, setReuAcuerdos] = useState("");

  // Modal para Abrir Ticket Rápido desde reunión
  const [ticketModalReuId, setTicketModalReuId] = useState<string | null>(null);
  const [ticketTitulo, setTicketTitulo] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketSeveridad, setTicketSeveridad] = useState<TicketSeveridad>("Media");
  const [savingTicket, setSavingTicket] = useState(false);

  // Subida de Acta de Cierre firmada
  const [uploadingCierre, setUploadingCierre] = useState(false);

  // Nomenclatura normalizada
  const codigoActaCierre = `ACTA-CIERRE-${proyecto.presupuestoNumero || "PRY"}-${new Date().getFullYear()}`;

  // 1. Guardar Reunión en la agenda
  const handleSaveReunion = () => {
    if (!reuTitulo.trim()) return;
    const reuniones = Array.isArray(proyecto.reuniones) ? [...proyecto.reuniones] : [];

    const nuevaReunion: ReunionProyecto = {
      id: `reu-${Date.now()}`,
      fecha: reuFecha,
      hora: reuHora,
      tipo: reuTipo,
      titulo: reuTitulo.trim(),
      asistentes: reuAsistentes ? reuAsistentes.split(",").map((s) => s.trim()) : [],
      puntosTratados: reuPuntos.trim(),
      feedbackCliente: reuFeedback.trim(),
      acuerdosYCompromisos: reuAcuerdos.trim(),
      creadoEn: new Date().toISOString(),
    };

    setProyecto((prev) => prev ? {
      ...prev,
      reuniones: [nuevaReunion, ...reuniones]
    } : null);

    setIsReunionModalOpen(false);
    setReuTitulo("");
    setReuPuntos("");
    setReuFeedback("");
    setReuAcuerdos("");
    toast.success("Reunión registrada en la agenda del proyecto");
  };

  const handleDeleteReunion = (reuId: string) => {
    const reuniones = (proyecto.reuniones || []).filter((r) => r.id !== reuId);
    setProyecto((prev) => prev ? { ...prev, reuniones } : null);
  };

  // 2. Abrir Ticket Rápido desde la reunión y crear tarjeta en Kanban
  const handleCrearTicketRapido = async () => {
    if (!ticketTitulo.trim() || !proyecto.clienteId) return;

    try {
      setSavingTicket(true);
      const ticketPayload = {
        clienteId: proyecto.clienteId,
        clienteNombre: proyecto.clienteNombre,
        proyectoId: proyecto.id,
        asunto: `[${proyecto.nombre}] ${ticketTitulo.trim()}`,
        descripcion: `${ticketDesc.trim()}\n\n(Detectado en reunión de seguimiento del proyecto)`,
        severidad: ticketSeveridad,
        estado: "abierto" as const,
      };

      const resTicket = await saveTicket(proyecto.clienteId, ticketPayload);
      const ticketId = resTicket?.id || `tck-${Date.now()}`;

      // Crear tarjeta de tarea automáticamente en Kanban (Columna: Por Hacer o En Desarrollo)
      const checklist = Array.isArray(proyecto.checklist) ? [...proyecto.checklist] : [];
      const newTask: ChecklistItem = {
        id: `task-ticket-${ticketId}`,
        orden: checklist.length + 1,
        categoria: "Incidencia / QA",
        titulo: `Ticket: ${ticketTitulo.trim()}`,
        descripcion: ticketDesc.trim(),
        completada: false,
        estadoKanban: "por_hacer",
        prioridad: ticketSeveridad === "Alta" ? "alta" : "media",
        responsable: "Hoja SpA",
        ticketIdRelacionado: ticketId,
      };

      // Asociar ID de ticket a la reunión
      const reuniones = (proyecto.reuniones || []).map((r) => {
        if (r.id === ticketModalReuId) {
          return { ...r, ticketGeneradoId: ticketId };
        }
        return r;
      });

      setProyecto((prev) => prev ? {
        ...prev,
        checklist: [...checklist, newTask],
        reuniones,
      } : null);

      setTicketModalReuId(null);
      setTicketTitulo("");
      setTicketDesc("");
      toast.success("Ticket de soporte abierto y tarjeta creada en el Kanban del proyecto");
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar el ticket");
    } finally {
      setSavingTicket(false);
    }
  };

  // Subir Acta de Cierre Firmada
  const handleUploadActaCierre = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !proyecto.id) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext || "")) {
      toast.error("Formato no permitido. Solo se aceptan archivos PDF o Word (.pdf, .doc, .docx)");
      e.target.value = "";
      return;
    }

    try {
      setUploadingCierre(true);
      const res = await subirArchivoProyectoStorage(proyecto.id, file);

      const nuevoDoc = {
        id: `doc-${Date.now()}`,
        nombre: file.name,
        tipoDoc: "acta_cierre" as const,
        codigoIso: codigoActaCierre,
        fileUrl: res.fileUrl,
        storagePath: res.storagePath,
        fileType: res.fileType,
        tamanoBytes: res.tamanoBytes,
        fechaSubida: new Date().toISOString(),
        estado: "firmado" as const,
        notas: "Acta de Cierre y Conformidad firmada por el cliente",
      };

      const adjuntosPrevios = Array.isArray(proyecto.archivosAdjuntos) ? proyecto.archivosAdjuntos : [];
      setProyecto((prev) => prev ? {
        ...prev,
        archivosAdjuntos: [nuevoDoc, ...adjuntosPrevios],
        actaEntregaFormalizada: true,
        fase: "entregado",
      } : null);

      toast.success("Acta de cierre firmada almacenada en Firebase y proyecto marcado como Entregado");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir el acta");
    } finally {
      setUploadingCierre(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. AGENDA DE REUNIONES, ENTREGAS & PRUEBAS QA */}
      <Card className="bg-card border-white/10 rounded-lg shadow-xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Agenda de Reuniones, Entregas & Pruebas QA</h3>
              <p className="text-xs text-slate-400">
                Minutas, acuerdos con el cliente y retroalimentación de calidad
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setIsReunionModalOpen(true)}
            className="h-9 px-3.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            Programar Reunión / Entrega
          </Button>
        </div>

        <CardContent className="p-6 space-y-4">
          {(proyecto.reuniones || []).length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-md">
              No hay reuniones agendadas ni registradas aún. Presiona &quot;Programar Reunión / Entrega&quot; para registrar la primera sesión.
            </div>
          ) : (
            (proyecto.reuniones || []).map((reu) => (
              <div
                key={reu.id}
                className="p-4 rounded-md bg-white/5 border border-white/10 space-y-3 hover:border-white/20 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {reu.fecha} {reu.hora && `(${reu.hora})`}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs font-black text-white">{reu.titulo}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      {reu.tipo}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Botón Abrir Ticket Rápido */}
                    <Button
                      size="sm"
                      onClick={() => {
                        setTicketModalReuId(reu.id);
                        setTicketTitulo("");
                        setTicketDesc("");
                      }}
                      className="h-8 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-bold gap-1"
                    >
                      <LifeBuoy className="w-3 h-3" />
                      Abrir Ticket Rápido
                    </Button>

                    {/* Descargar Minuta Word */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => descargarPlantillaMinutaReunion(proyecto, reu)}
                      className="h-8 px-2.5 rounded-lg border-white/15 text-slate-300 hover:text-white text-[11px] font-bold gap-1"
                      title="Descargar minuta editable en Word (.doc)"
                    >
                      <Download className="w-3 h-3 text-indigo-400" />
                      Minuta .doc
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReunion(reu.id)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {reu.puntosTratados && (
                  <div className="text-xs text-slate-300 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 space-y-1">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">Puntos Tratados:</span>
                    <p className="leading-relaxed">{reu.puntosTratados}</p>
                  </div>
                )}

                {reu.feedbackCliente && (
                  <div className="text-xs text-amber-200 bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/20 space-y-1">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-amber-400 block">
                      Pruebas de Calidad & Retroalimentación:
                    </span>
                    <p className="leading-relaxed">{reu.feedbackCliente}</p>
                  </div>
                )}

                {reu.acuerdosYCompromisos && (
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">Acuerdos y Próximos Pasos:</span>
                    <p>{reu.acuerdosYCompromisos}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 2. CIERRE FORMAL DEL PROYECTO & ACTA DE ENTREGA */}
      <Card className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 rounded-lg p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Nomenclatura Formal: {codigoActaCierre}
            </div>
            <h3 className="text-base font-black text-white">
              Acta de Cierre, Recepción Conforme & Carta de Garantía
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Descarga la planilla editable en Word (.doc) con todos los entregables, credenciales y cláusulas de garantía para ser firmada de forma manual con el cliente. Luego sube el acta firmada a Firebase Storage para el respaldo contable y de calidad ISO 9001.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Descargar Plantilla Acta de Cierre */}
            <Button
              type="button"
              onClick={() => descargarPlantillaActaCierreYGarantia(proyecto)}
              className="h-10 px-4 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs gap-2 shadow-lg shadow-purple-600/30"
            >
              <Download className="w-4 h-4" />
              Descargar Acta Cierre (.doc)
            </Button>

            {/* Subir Acta Firmada */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleUploadActaCierre}
                disabled={uploadingCierre}
                className="hidden"
              />
              <span className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition-colors">
                <Upload className="w-4 h-4 text-emerald-400" />
                {uploadingCierre ? "Subiendo a Firebase..." : "Subir Acta Firmada"}
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* MODAL: PROGRAMAR / REGISTRAR REUNIÓN */}
      <Dialog open={isReunionModalOpen} onOpenChange={setIsReunionModalOpen}>
        <DialogContent className="sm:max-w-[560px] bg-slate-950 border border-white/15 text-slate-100 rounded-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white">Registrar Reunión / Entrega de Avance</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Título / Motivo de la Sesión</Label>
              <Input
                value={reuTitulo}
                onChange={(e) => setReuTitulo(e.target.value)}
                placeholder="Ej: Demostración de Prototipo y Pruebas con Cliente"
                className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Tipo de Sesión</Label>
                <Select value={reuTipo} onValueChange={(val) => setReuTipo(val as ReunionProyecto["tipo"])}>
                  <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/15 text-white">
                    <SelectItem value="planificacion" className="text-xs">Planificación Inicial</SelectItem>
                    <SelectItem value="avance" className="text-xs">Avance y Demo</SelectItem>
                    <SelectItem value="qa_entrega" className="text-xs">Revisión QA y Entrega</SelectItem>
                    <SelectItem value="cierre" className="text-xs">Cierre Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Fecha</Label>
                <Input
                  type="date"
                  value={reuFecha}
                  onChange={(e) => setReuFecha(e.target.value)}
                  className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Hora</Label>
                <Input
                  type="time"
                  value={reuHora}
                  onChange={(e) => setReuHora(e.target.value)}
                  className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Asistentes (separados por coma)</Label>
              <Input
                value={reuAsistentes}
                onChange={(e) => setReuAsistentes(e.target.value)}
                placeholder="Ej: Hans Hoja, Juan Pérez (Cliente), María Soto"
                className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Puntos Tratados</Label>
              <Textarea
                value={reuPuntos}
                onChange={(e) => setReuPuntos(e.target.value)}
                placeholder="Detalle de temas revisados durante la reunión..."
                rows={2}
                className="bg-slate-900 border-white/15 text-white text-xs rounded-md resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">
                Pruebas de Calidad & Retroalimentación del Cliente
              </Label>
              <Textarea
                value={reuFeedback}
                onChange={(e) => setReuFeedback(e.target.value)}
                placeholder="Observaciones de funcionamiento, fallos encontrados o visto bueno..."
                rows={2}
                className="bg-slate-900 border-white/15 text-white text-xs rounded-md resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Acuerdos y Compromisos</Label>
              <Textarea
                value={reuAcuerdos}
                onChange={(e) => setReuAcuerdos(e.target.value)}
                placeholder="Acciones acordadas para la próxima entrega..."
                rows={2}
                className="bg-slate-900 border-white/15 text-white text-xs rounded-md resize-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsReunionModalOpen(false)}
              className="bg-white/5 border-white/15 text-slate-300 text-xs h-10 rounded-md"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveReunion}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 rounded-md px-5"
            >
              Guardar Reunión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ABRIR TICKET RÁPIDO DESDE REUNIÓN */}
      <Dialog open={!!ticketModalReuId} onOpenChange={(open) => !open && setTicketModalReuId(null)}>
        <DialogContent className="sm:max-w-[480px] bg-slate-950 border border-white/15 text-slate-100 rounded-lg shadow-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-white">Abrir Ticket Rápido</DialogTitle>
                <p className="text-xs text-slate-400">Creará un ticket de soporte y una tarjeta en el Kanban</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Asunto del Ticket / Bug</Label>
              <Input
                value={ticketTitulo}
                onChange={(e) => setTicketTitulo(e.target.value)}
                placeholder="Ej: Corregir validación de RUT en formulario de contacto"
                className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Severidad / Prioridad</Label>
              <Select value={ticketSeveridad} onValueChange={(val) => setTicketSeveridad(val as TicketSeveridad)}>
                <SelectTrigger className="bg-slate-900 border-white/15 text-white text-xs h-10 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/15 text-white">
                  <SelectItem value="Baja" className="text-xs">Baja</SelectItem>
                  <SelectItem value="Media" className="text-xs">Media</SelectItem>
                  <SelectItem value="Alta" className="text-xs text-rose-400">Alta (Crítica)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Descripción del Problema Detectado</Label>
              <Textarea
                value={ticketDesc}
                onChange={(e) => setTicketDesc(e.target.value)}
                placeholder="Pasos para reproducir, mensaje de error o comportamiento observado..."
                rows={3}
                className="bg-slate-900 border-white/15 text-white text-xs rounded-md resize-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setTicketModalReuId(null)}
              className="bg-white/5 border-white/15 text-slate-300 text-xs h-10 rounded-md"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCrearTicketRapido}
              disabled={savingTicket}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-10 rounded-md px-5"
            >
              {savingTicket ? "Guardando..." : "Crear Ticket & Tarjeta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
