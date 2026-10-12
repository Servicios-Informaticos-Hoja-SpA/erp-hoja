"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Target, 
  Clock, 
  Send, 
  Flame, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Phone,
  Mail,
  BookmarkCheck,
  PhoneCall,
  UserCheck
} from "lucide-react";
import { 
  ProspectSintoma, 
  ProspectingSession, 
  Prospect, 
  ProspectCanal,
  UserStreak 
} from "@/lib/types";
import { 
  PROSPECCION_TEMPLATES 
} from "@/lib/prospeccion-templates";
import { 
  startProspectingSession, 
  saveProspectContact, 
  finishProspectingSession 
} from "@/lib/services";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

interface SessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionFinished?: () => void;
  initialMeta?: number;
}

export function SessionModal({
  open,
  onOpenChange,
  onSessionFinished,
  initialMeta = 3,
}: SessionModalProps) {
  const { user } = useAuth();
  const userId = user?.uid || "hoja-operador-principal";
  const userEmail = user?.email || "operaciones@hoja.cl";

  // Fases de la sesión: "setup" | "active" | "completed"
  const [phase, setPhase] = useState<"setup" | "active" | "completed">("setup");
  const [metaObjetivo, setMetaObjetivo] = useState(initialMeta);

  // Sesión activa
  const [session, setSession] = useState<ProspectingSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Formulario del prospecto actual
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [canal, setCanal] = useState<ProspectCanal>("whatsapp");
  const [sintoma, setSintoma] = useState<ProspectSintoma>("Sin página web");
  const [mensajeEnviado, setMensajeEnviado] = useState("");
  const [asuntoEmail, setAsuntoEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionStreak, setSessionStreak] = useState<UserStreak | null>(null);

  // Input ref para enfocar al cambiar de prospecto
  const nombreInputRef = useRef<HTMLInputElement | null>(null);

  // Actualizar la plantilla de mensaje y asunto cuando cambia el síntoma o el nombre del negocio
  useEffect(() => {
    const template = PROSPECCION_TEMPLATES[sintoma];
    if (template) {
      setMensajeEnviado(template.generarMensaje(nombreNegocio));
      if (template.generarAsuntoEmail) {
        setAsuntoEmail(template.generarAsuntoEmail(nombreNegocio));
      }
    }
  }, [sintoma, nombreNegocio]);

  // Cronómetro en segundo plano durante fase "active" (avanza transparente)
  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  // Reset al abrir o cerrar
  useEffect(() => {
    if (open && phase === "setup") {
      setMetaObjetivo(initialMeta);
      setElapsedSeconds(0);
      setNombreNegocio("");
      setTelefono("");
      setEmail("");
      setNotas("");
      setCanal("whatsapp");
      setSintoma("Sin página web");
    }
  }, [open, initialMeta, phase]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 1. Iniciar Sesión
  const handleStartSession = async () => {
    try {
      setIsSending(true);
      const res = await startProspectingSession(metaObjetivo, userId, userEmail);
      setSession(res.session);
      setElapsedSeconds(0);
      setPhase("active");
      toast.success("¡Sesión iniciada! Enfócate en tu meta sin presión de tiempo.");
      setTimeout(() => {
        nombreInputRef.current?.focus();
      }, 150);
    } catch (err) {
      console.error(err);
      toast.error("Error al iniciar la sesión de prospección");
    } finally {
      setIsSending(false);
    }
  };

  // 2. Ejecutar Acción de Contacto o Guardado y Avanzar al Siguiente Prospecto
  const handleSendAndNext = async () => {
    if (!session?.id) return;

    if (!nombreNegocio.trim()) {
      toast.warning("Ingresa el nombre del negocio o contacto");
      nombreInputRef.current?.focus();
      return;
    }

    // Validaciones según el canal elegido
    if (canal === "whatsapp" && !telefono.trim()) {
      toast.warning("Ingresa el número de WhatsApp para enviar el mensaje");
      return;
    }

    if (canal === "telefono" && !telefono.trim()) {
      toast.warning("Ingresa el número telefónico para registrar la llamada");
      return;
    }

    if (canal === "correo" && !email.trim()) {
      toast.warning("Ingresa el correo electrónico para enviar la propuesta");
      return;
    }

    if (canal === "no_contactar" && !telefono.trim() && !email.trim() && !notas.trim()) {
      toast.warning("Ingresa al menos un teléfono, correo o nota para guardar este prospecto");
      return;
    }

    // Normalizar teléfono chileno (+56 9...)
    let cleanPhone = "";
    if (telefono.trim()) {
      cleanPhone = telefono.replace(/[^0-9]/g, "");
      if (cleanPhone.length === 9 && cleanPhone.startsWith("9")) {
        cleanPhone = `56${cleanPhone}`;
      } else if (cleanPhone.length === 8) {
        cleanPhone = `569${cleanPhone}`;
      }
    }

    try {
      setIsSending(true);

      const estadoFinal = canal === "no_contactar" ? "por_contactar" : "contactado";
      const mensajeFinal = canal === "no_contactar"
        ? (notas.trim() || "Prospecto identificado para contacto futuro")
        : canal === "telefono"
          ? (notas.trim() ? `Llamada telefónica: ${notas.trim()}` : "Llamada telefónica directa efectuada")
          : mensajeEnviado.trim();

      // Guardar prospecto en Firestore
      await saveProspectContact({
        sessionId: session.id,
        userId,
        userEmail,
        nombreNegocio: nombreNegocio.trim(),
        telefono: cleanPhone || telefono.trim(),
        email: email.trim(),
        canal,
        sintoma,
        mensajeEnviado: mensajeFinal,
        estado: estadoFinal,
        notas: notas.trim(),
      });

      // Disparar acción correspondiente al canal
      if (canal === "whatsapp" && cleanPhone) {
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensajeEnviado.trim())}`;
        window.open(waUrl, "_blank");
      } else if (canal === "correo" && email.trim()) {
        const mailtoUrl = `mailto:${email.trim()}?subject=${encodeURIComponent(asuntoEmail.trim())}&body=${encodeURIComponent(mensajeEnviado.trim())}`;
        window.open(mailtoUrl, "_blank");
      } else if (canal === "telefono" && cleanPhone) {
        // En móvil abre la app de teléfono
        window.open(`tel:${cleanPhone}`, "_self");
      }

      const nuevosContactos = (session.contactosCompletados || 0) + 1;
      const updatedSession = {
        ...session,
        contactosCompletados: nuevosContactos,
      };
      setSession(updatedSession);

      const msgSuccess = 
        canal === "whatsapp" ? `Prospecto ${nuevosContactos} enviado por WhatsApp` :
        canal === "telefono" ? `Llamada a prospecto ${nuevosContactos} registrada` :
        canal === "correo" ? `Correo a prospecto ${nuevosContactos} generado` :
        `Prospecto ${nuevosContactos} guardado en pipeline (Por Contactar)`;

      toast.success(msgSuccess);

      // Verificar si cumplió la meta de la sesión
      if (nuevosContactos >= session.metaObjetivo) {
        const finishRes = await finishProspectingSession(session.id, elapsedSeconds, userId);
        setSession(finishRes.session);
        setSessionStreak(finishRes.streak);
        setPhase("completed");
        toast.success("🎯 ¡Felicitaciones! Has completado tu meta de prospección.");
      } else {
        // Limpiar para el siguiente prospecto
        setNombreNegocio("");
        setTelefono("");
        setEmail("");
        setNotas("");
        setTimeout(() => {
          nombreInputRef.current?.focus();
        }, 150);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar el prospecto");
    } finally {
      setIsSending(false);
    }
  };

  // 3. Finalizar Sesión manualmente antes o en cualquier momento
  const handleManualFinish = async () => {
    if (!session?.id) {
      onOpenChange(false);
      return;
    }
    if (!confirm("¿Deseas finalizar la sesión actual y guardar los resultados obtenidos?")) {
      return;
    }

    try {
      setIsSending(true);
      const finishRes = await finishProspectingSession(session.id, elapsedSeconds, userId);
      setSession(finishRes.session);
      setSessionStreak(finishRes.streak);
      setPhase("completed");
    } catch (err) {
      console.error(err);
      toast.error("Error al finalizar la sesión");
    } finally {
      setIsSending(false);
    }
  };

  // 4. Agregar un contacto extra a la sesión
  const handleAddExtraContact = () => {
    if (!session) return;
    setSession({
      ...session,
      metaObjetivo: session.metaObjetivo + 1,
    });
    setPhase("active");
    setNombreNegocio("");
    setTelefono("");
    setEmail("");
    setNotas("");
    setTimeout(() => {
      nombreInputRef.current?.focus();
    }, 150);
  };

  const handleCloseAndFinish = () => {
    setPhase("setup");
    setSession(null);
    setElapsedSeconds(0);
    onOpenChange(false);
    if (onSessionFinished) {
      onSessionFinished();
    }
  };

  const contactosActuales = session?.contactosCompletados || 0;
  const metaTotal = session?.metaObjetivo || metaObjetivo;
  const progresoPorcentaje = Math.min(100, Math.round((contactosActuales / metaTotal) * 100));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[720px] bg-slate-900 border-white/15 text-slate-100 max-h-[92dvh] overflow-y-auto p-4 sm:p-8 rounded-3xl shadow-2xl">
        
        {/* ============================================================== */}
        {/* FASE 1: SETUP PRE-SESIÓN (Sin temporizador límite)             */}
        {/* ============================================================== */}
        {phase === "setup" && (
          <div className="space-y-6">
            <DialogHeader className="text-left space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-wider w-fit">
                <Target className="w-3.5 h-3.5" /> Sesión Guiada de Contactos
              </div>
              <DialogTitle className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Iniciar Sesión de Prospección
              </DialogTitle>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Sin cuentas regresivas ni presión de tiempo. Elige con total flexibilidad cómo prospectar: enviar por WhatsApp, registrar llamadas, enviar correos o simplemente guardar prospectos calificados para contactar más tarde.
              </p>
            </DialogHeader>

            {/* Selector de Meta de Contactos */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Meta de Contactos para esta Sesión
                  </Label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Recomendado: 3 contactos diarios para mantener racha y conversión alta.
                  </p>
                </div>
                <div className="text-2xl font-black font-mono text-indigo-400 bg-indigo-500/10 px-4 py-1 rounded-xl border border-indigo-500/30">
                  {metaObjetivo}
                </div>
              </div>

              {/* Botones de sugerencia rápida */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[3, 5, 7, 10].map((num) => (
                  <Button
                    key={num}
                    type="button"
                    variant={metaObjetivo === num ? "default" : "outline"}
                    onClick={() => setMetaObjetivo(num)}
                    className={`h-10 text-xs font-bold rounded-xl transition-all ${
                      metaObjetivo === num 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" 
                        : "border-white/15 bg-card hover:bg-white/5 text-slate-300"
                    }`}
                  >
                    {num === 3 ? "🎯 3 (Sugerido)" : `${num} contactos`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Beneficio de la sesión */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Cronómetro Transparente</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Mide tu ritmo en segundo plano sin cuentas regresivas.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
                <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Racha Diaria Activa</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Al cumplir tu meta sumas +1 a tu racha de días activos.</p>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={handleStartSession}
                disabled={isSending}
                className="w-full sm:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black text-sm gap-2 shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02]"
              >
                <Target className="w-4 h-4" />
                Iniciar Sesión de Contactos
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ============================================================== */}
        {/* FASE 2: FLUJO DE PROSPECCIÓN ACTIVA (Flexible y Multi-Canal)   */}
        {/* ============================================================== */}
        {phase === "active" && (
          <div className="space-y-5">
            
            {/* Header de la Sesión: Progreso visual y Cronómetro sutil */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono font-bold text-indigo-400">
                    Prospecto {contactosActuales + 1} de {metaTotal}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    Meta: {metaTotal}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Ficha de Prospección Comercial
                </h3>
              </div>

              {/* Cronómetro Sutil en Segundo Plano */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span className="text-xs text-slate-400 font-medium">Tiempo:</span>
                  <span className="text-sm font-mono font-black text-indigo-300">
                    {formatTimer(elapsedSeconds)}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleManualFinish}
                  className="h-8 text-xs text-slate-400 hover:text-rose-400"
                  title="Finalizar sesión antes de cumplir meta"
                >
                  Pausar / Salir
                </Button>
              </div>
            </div>

            {/* Barra de Progreso Visual */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-400">
                <span>Progreso hacia la meta</span>
                <span>{contactosActuales} / {metaTotal} completados ({progresoPorcentaje}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${progresoPorcentaje}%` }}
                />
              </div>
            </div>

            {/* Formulario de Entrada */}
            <div className="space-y-4">
              
              {/* 1. Nombre del Negocio */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  1. Nombre del Negocio o Contacto *
                </Label>
                <Input
                  ref={nombreInputRef}
                  value={nombreNegocio}
                  onChange={(e) => setNombreNegocio(e.target.value)}
                  placeholder="Ej. Taller Mecánico San Martín / Clínica Dental Reñaca"
                  className="bg-slate-950 border-white/15 text-white h-11 text-sm font-bold placeholder:text-slate-600 focus-visible:ring-indigo-500"
                />
              </div>

              {/* 2. Datos de Contacto (Teléfono y Correo) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    2. Teléfono (con o sin WhatsApp)
                  </Label>
                  <Input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+56 9 8765 4321 ó 32 212 3456"
                    className="bg-slate-950 border-white/15 text-white h-11 text-sm font-mono font-bold placeholder:text-slate-600 focus-visible:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    3. Correo Electrónico (Opcional)
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@negocio.cl"
                    className="bg-slate-950 border-white/15 text-white h-11 text-sm font-bold placeholder:text-slate-600 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 3. Selector de Síntomas Rápidos */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  4. Síntoma Detectado (Selección Rápida)
                </Label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(PROSPECCION_TEMPLATES) as ProspectSintoma[]).map((sin) => {
                    const item = PROSPECCION_TEMPLATES[sin];
                    const isSelected = sintoma === sin;

                    return (
                      <button
                        key={sin}
                        type="button"
                        onClick={() => setSintoma(sin)}
                        className={`p-2.5 rounded-xl text-left border transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? "bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                            : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        }`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{item.icono}</span>
                        <div className="min-w-0">
                          <p className={`text-xs font-black ${isSelected ? "text-indigo-300" : "text-slate-300"}`}>
                            {item.tituloCorto}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.descripcionSintoma}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Selector de Canal de Contacto / Modo de Prospección */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>5. ¿Cómo deseas proceder con este prospecto?</span>
                  <span className="text-[10px] text-slate-400 font-normal">Elige la opción más cómoda</span>
                </Label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Opción A: WhatsApp */}
                  <button
                    type="button"
                    onClick={() => setCanal("whatsapp")}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[70px] ${
                      canal === "whatsapp"
                        ? "bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/15"
                        : "bg-slate-950/60 border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <MessageSquare className={`w-4 h-4 ${canal === "whatsapp" ? "text-emerald-400" : "text-slate-400"}`} />
                      {canal === "whatsapp" && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black leading-tight text-white">WhatsApp</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Mensaje directo</p>
                    </div>
                  </button>

                  {/* Opción B: Llamada Directa / Teléfono sin WhatsApp */}
                  <button
                    type="button"
                    onClick={() => setCanal("telefono")}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[70px] ${
                      canal === "telefono"
                        ? "bg-sky-500/20 border-sky-500 text-white shadow-md shadow-sky-500/15"
                        : "bg-slate-950/60 border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Phone className={`w-4 h-4 ${canal === "telefono" ? "text-sky-400" : "text-slate-400"}`} />
                      {canal === "telefono" && (
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black leading-tight text-white">Llamada Directa</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Sin WhatsApp</p>
                    </div>
                  </button>

                  {/* Opción C: Correo Electrónico */}
                  <button
                    type="button"
                    onClick={() => setCanal("correo")}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[70px] ${
                      canal === "correo"
                        ? "bg-indigo-500/20 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                        : "bg-slate-950/60 border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Mail className={`w-4 h-4 ${canal === "correo" ? "text-indigo-400" : "text-slate-400"}`} />
                      {canal === "correo" && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black leading-tight text-white">Por Correo</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Propuesta formal</p>
                    </div>
                  </button>

                  {/* Opción D: No contactar ahora (Solo prospectar) */}
                  <button
                    type="button"
                    onClick={() => setCanal("no_contactar")}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[70px] ${
                      canal === "no_contactar"
                        ? "bg-amber-500/25 border-amber-500 text-amber-200 shadow-md shadow-amber-500/15"
                        : "bg-slate-950/60 border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <BookmarkCheck className={`w-4 h-4 ${canal === "no_contactar" ? "text-amber-400" : "text-slate-400"}`} />
                      {canal === "no_contactar" && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black leading-tight text-white">No contactar</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Guardar para después</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 5. Contenido Dinámico según Canal Seleccionado */}
              {canal === "whatsapp" && (
                <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      Mensaje de WhatsApp (Adaptado Automáticamente)
                    </Label>
                    <span className="text-[10px] text-slate-500">Puedes editar el texto</span>
                  </div>

                  <Textarea
                    value={mensajeEnviado}
                    onChange={(e) => setMensajeEnviado(e.target.value)}
                    rows={4}
                    className="bg-slate-950 border-white/15 text-slate-200 text-xs font-sans leading-relaxed rounded-xl p-3 resize-none focus-visible:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Al avanzar se abrirá WhatsApp con este texto precargado para {telefono || "el número indicado"}.
                  </p>
                </div>
              )}

              {canal === "telefono" && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-black text-sky-300">
                      <PhoneCall className="w-4 h-4 text-sky-400" /> Pauta Breve de Conversación
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed italic bg-black/30 p-2.5 rounded-lg border border-white/5">
                      "{PROSPECCION_TEMPLATES[sintoma].pautaLlamada(nombreNegocio)}"
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-300">
                      Notas o resultado de la llamada (opcional):
                    </Label>
                    <Textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Ej. Hablé con Don Carlos, pidió llamar mañana a las 11:00..."
                      rows={2}
                      className="bg-slate-950 border-white/15 text-slate-200 text-xs rounded-xl p-3 resize-none"
                    />
                  </div>
                </div>
              )}

              {canal === "correo" && (
                <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-300">
                      Asunto del Correo:
                    </Label>
                    <Input
                      value={asuntoEmail}
                      onChange={(e) => setAsuntoEmail(e.target.value)}
                      className="bg-slate-950 border-white/15 text-slate-200 text-xs h-9 rounded-xl font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-300">
                      Cuerpo de la Propuesta por Correo:
                    </Label>
                    <Textarea
                      value={mensajeEnviado}
                      onChange={(e) => setMensajeEnviado(e.target.value)}
                      rows={4}
                      className="bg-slate-950 border-white/15 text-slate-200 text-xs leading-relaxed rounded-xl p-3 resize-none focus-visible:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Al avanzar se abrirá tu aplicación de correo con el asunto y destinatario listos.
                  </p>
                </div>
              )}

              {canal === "no_contactar" && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                    <BookmarkCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-amber-300">Modo Solo Prospección (Por Contactar)</p>
                      <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                        El lead se guardará en tu base de datos y CRM en etapa <strong>"Detectado / Por Contactar"</strong> y sumará +1 a tu meta de la sesión sin abrir ninguna aplicación externa. Podrás contactarlo más tarde cuando te sea conveniente.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-300">
                      Notas u observaciones del prospecto (opcional):
                    </Label>
                    <Textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Ej. Encontrado en Google Maps, local concurrido, contactar por la mañana..."
                      rows={2}
                      className="bg-slate-950 border-white/15 text-slate-200 text-xs rounded-xl p-3 resize-none"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Botón Principal Adaptado al Canal */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                {canal === "whatsapp" && "Abrirá WhatsApp Web/Móvil y registrará el contacto."}
                {canal === "telefono" && "Registrará el contacto telefónico y avanzará."}
                {canal === "correo" && "Abrirá tu gestor de correo con el mensaje listo."}
                {canal === "no_contactar" && "Guardará el lead como pendiente y avanzará."}
              </div>

              <Button
                type="button"
                onClick={handleSendAndNext}
                disabled={isSending}
                className={`w-full sm:w-auto h-12 px-8 rounded-xl font-black text-sm gap-2 shadow-xl transition-all hover:scale-[1.02] ${
                  canal === "whatsapp" 
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30"
                    : canal === "telefono"
                      ? "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sky-600/30"
                      : canal === "correo"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30"
                        : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/30"
                }`}
              >
                {isSending ? (
                  <span>Registrando...</span>
                ) : canal === "whatsapp" ? (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>Enviar WhatsApp y Siguiente ({contactosActuales + 1}/{metaTotal})</span>
                  </>
                ) : canal === "telefono" ? (
                  <>
                    <Phone className="w-4 h-4 text-white" />
                    <span>Registrar Llamada y Siguiente ({contactosActuales + 1}/{metaTotal})</span>
                  </>
                ) : canal === "correo" ? (
                  <>
                    <Mail className="w-4 h-4 text-white" />
                    <span>Abrir Correo y Siguiente ({contactosActuales + 1}/{metaTotal})</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Guardar Prospecto y Siguiente ({contactosActuales + 1}/{metaTotal})</span>
                  </>
                )}
              </Button>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* FASE 3: CIERRE Y RESUMEN DE SESIÓN (Celebración y Racha)        */}
        {/* ============================================================== */}
        {phase === "completed" && session && (
          <div className="space-y-6 text-center py-2">
            
            {/* Ícono de Victoria */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/25">
              <Trophy className="w-10 h-10 text-slate-950" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ¡Meta Cumplida!
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ¡Sesión Completada con Éxito!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Has generado <strong className="text-white font-black">{session.contactosCompletados} prospectos</strong> en{" "}
                <strong className="text-white font-black">{session.duracionMinutos} minutos</strong>{" "}
                (promedio{" "}
                <strong className="text-emerald-400 font-black">
                  {(session.contactosCompletados > 0 
                    ? session.duracionMinutos / session.contactosCompletados 
                    : 0
                  ).toFixed(1)}{" "}
                  min
                </strong>{" "}
                por prospecto).
              </p>
            </div>

            {/* Tarjeta de Racha Diaria Actualizada */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-950 border border-amber-500/30 max-w-md mx-auto space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Flame className="w-6 h-6 text-amber-400 animate-bounce" />
                <span className="text-base font-black text-amber-300">
                  Racha Activa: {sessionStreak?.rachaActual || 1} días consecutivos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Récord máximo del usuario: <strong className="text-white">{sessionStreak?.rachaMaxima || 1} días</strong>
              </p>
            </div>

            {/* Acciones de Cierre */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddExtraContact}
                className="w-full sm:w-auto h-11 px-5 rounded-xl border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs font-bold gap-2"
              >
                <Plus className="w-4 h-4" /> Agregar un contacto extra
              </Button>

              <Button
                type="button"
                onClick={handleCloseAndFinish}
                className="w-full sm:w-auto h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/25"
              >
                Cerrar y Ver Estadísticas
              </Button>
            </div>

          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}

