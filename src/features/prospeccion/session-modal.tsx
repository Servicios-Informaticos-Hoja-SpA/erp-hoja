"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  UserCheck,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Check,
  StopCircle,
  ChevronRight
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
  finishProspectingSession,
  pauseProspectingSession,
  resumeProspectingSession,
  cancelProspectingSession
} from "@/lib/services";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export const ACTIVE_SESSION_STORAGE_KEY = "sihoja_active_prospecting_session";

interface StoredSessionState {
  session: ProspectingSession;
  elapsedSeconds: number;
  savedAt: number;
}

interface SessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionFinished?: () => void;
  initialMeta?: number;
  resumedSession?: ProspectingSession | null;
}

export function SessionModal({
  open,
  onOpenChange,
  onSessionFinished,
  initialMeta = 3,
  resumedSession = null,
}: SessionModalProps) {
  const { user } = useAuth();
  const userId = user?.uid || "hoja-operador-principal";
  const userEmail = user?.email || "operaciones@hoja.cl";

  // Fases: "setup" | "active" | "completed"
  const [phase, setPhase] = useState<"setup" | "active" | "completed">("setup");
  const [metaObjetivo, setMetaObjetivo] = useState(initialMeta);

  // Sesión activa y cronómetro
  const [session, setSession] = useState<ProspectingSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sesión guardada en caché local detectada
  const [savedLocalSession, setSavedLocalSession] = useState<StoredSessionState | null>(null);

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

  // Formateador de tiempo
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper para persistir en localStorage
  const saveStateToStorage = useCallback((currentSession: ProspectingSession, currentSeconds: number) => {
    try {
      if (typeof window !== "undefined") {
        const payload: StoredSessionState = {
          session: currentSession,
          elapsedSeconds: currentSeconds,
          savedAt: Date.now(),
        };
        localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (e) {
      console.warn("No se pudo guardar sesión en localStorage:", e);
    }
  }, []);

  const clearStorageSession = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      }
      setSavedLocalSession(null);
    } catch (e) {
      console.warn("No se pudo limpiar localStorage:", e);
    }
  }, []);

  // Cargar sesión guardada de localStorage si existe
  const checkStoredSession = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as StoredSessionState;
          if (parsed?.session?.id) {
            setSavedLocalSession(parsed);
            return parsed;
          }
        }
      }
    } catch {
      // Ignorar json corrupto
    }
    setSavedLocalSession(null);
    return null;
  }, []);

  // Escuchar si se pasa resumedSession desde fuera al abrir
  useEffect(() => {
    if (open) {
      if (resumedSession) {
        setSession(resumedSession);
        setElapsedSeconds(resumedSession.duracionSegundos || 0);
        setMetaObjetivo(resumedSession.metaObjetivo || 3);
        setPhase("active");
        saveStateToStorage(resumedSession, resumedSession.duracionSegundos || 0);
      } else {
        const stored = checkStoredSession();
        if (stored && stored.session.id) {
          // Detectó sesión guardada en localStorage
          setSavedLocalSession(stored);
        }
      }
    }
  }, [open, resumedSession, checkStoredSession, saveStateToStorage]);

  // Actualizar plantilla comercial al cambiar síntoma o nombre
  useEffect(() => {
    const template = PROSPECCION_TEMPLATES[sintoma];
    if (template) {
      setMensajeEnviado(template.generarMensaje(nombreNegocio));
      if (template.generarAsuntoEmail) {
        setAsuntoEmail(template.generarAsuntoEmail(nombreNegocio));
      }
    }
  }, [sintoma, nombreNegocio]);

  // Cronómetro y sincronización en segundo plano durante fase activa
  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (session) {
            saveStateToStorage(session, next);
          }
          return next;
        });
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
  }, [phase, session, saveStateToStorage]);

  // Guardar antes de que el usuario cierre la pestaña o refresque
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (phase === "active" && session) {
        saveStateToStorage(session, elapsedSeconds);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase, session, elapsedSeconds, saveStateToStorage]);

  // Reset al abrir en setup si no hay sesión activa
  useEffect(() => {
    if (open && phase === "setup" && !resumedSession && !savedLocalSession) {
      setMetaObjetivo(initialMeta);
      setElapsedSeconds(0);
      setNombreNegocio("");
      setTelefono("");
      setEmail("");
      setNotas("");
      setCanal("whatsapp");
      setSintoma("Sin página web");
    }
  }, [open, initialMeta, phase, resumedSession, savedLocalSession]);

  // 1. Iniciar Nueva Sesión
  const handleStartSession = async () => {
    try {
      setIsSending(true);
      const res = await startProspectingSession(metaObjetivo, userId, userEmail);
      setSession(res.session);
      setElapsedSeconds(0);
      setPhase("active");
      saveStateToStorage(res.session, 0);
      toast.success("¡Sesión iniciada! Registra tus contactos a tu propio ritmo.");
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

  // 2. Retomar Sesión Almacenada
  const handleResumeSession = async (stored: StoredSessionState) => {
    try {
      setIsSending(true);
      setSession(stored.session);
      setElapsedSeconds(stored.elapsedSeconds);
      setMetaObjetivo(stored.session.metaObjetivo || 3);
      setPhase("active");
      
      // Notificar backend para que marque estado 'activa'
      if (stored.session.id) {
        resumeProspectingSession(stored.session.id).catch(console.warn);
      }

      toast.success("Sesión retomada con éxito.");
      setTimeout(() => {
        nombreInputRef.current?.focus();
      }, 150);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo retomar la sesión");
    } finally {
      setIsSending(false);
    }
  };

  // 3. Pausar y Cerrar (Salida limpia que NO finaliza ni pierde la sesión)
  const handlePauseAndClose = async () => {
    if (!session?.id) {
      onOpenChange(false);
      return;
    }

    try {
      // Guardar en localStorage
      saveStateToStorage(session, elapsedSeconds);

      // Notificar en backend estado 'pausada'
      await pauseProspectingSession(session.id, elapsedSeconds);
      
      toast.info("Sesión pausada. Puedes retomarla en cualquier momento desde esta pantalla.", {
        duration: 4000,
      });

      onOpenChange(false);
      if (onSessionFinished) {
        onSessionFinished();
      }
    } catch (err) {
      console.error(err);
      // Aún si falla la red, queda en localStorage
      onOpenChange(false);
    }
  };

  // 4. Finalizar Sesión Ahora (Concluye limpiamente con los contactos actuales)
  const handleFinalizeSessionNow = async () => {
    if (!session?.id) {
      onOpenChange(false);
      return;
    }

    const cantContactos = session.contactosCompletados || 0;
    const confirmMsg = cantContactos >= session.metaObjetivo
      ? "¿Deseas dar por terminada la sesión y registrar tu meta cumplida?"
      : `¿Deseas finalizar la sesión ahora con ${cantContactos} de ${session.metaObjetivo} contactos registrados? Se guardará tu tiempo y progreso.`;

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      setIsSending(true);
      const finishRes = await finishProspectingSession(session.id, elapsedSeconds, userId);
      setSession(finishRes.session);
      setSessionStreak(finishRes.streak);
      clearStorageSession();
      setPhase("completed");
      toast.success("Sesión finalizada y guardada exitosamente.");
    } catch (err) {
      console.error(err);
      toast.error("Error al finalizar la sesión");
    } finally {
      setIsSending(false);
    }
  };

  // 5. Descartar / Cancelar Sesión (Elimina sesión no deseada)
  const handleDiscardSession = async () => {
    const targetSessionId = session?.id || savedLocalSession?.session.id;
    if (!targetSessionId) {
      clearStorageSession();
      setPhase("setup");
      return;
    }

    if (!confirm("¿Deseas descartar esta sesión? Los datos de la sesión se eliminarán para no quedar en tu historial.")) {
      return;
    }

    try {
      setIsSending(true);
      await cancelProspectingSession(targetSessionId);
      clearStorageSession();
      setSession(null);
      setElapsedSeconds(0);
      setPhase("setup");
      toast.info("Sesión descartada.");
      if (onSessionFinished) {
        onSessionFinished();
      }
    } catch (err) {
      console.error(err);
      clearStorageSession();
      setPhase("setup");
    } finally {
      setIsSending(false);
    }
  };

  // 6. Enviar / Registrar Contacto y Avanzar
  const handleSendAndNext = async () => {
    if (!session?.id) return;

    if (!nombreNegocio.trim()) {
      toast.warning("Ingresa el nombre del negocio o contacto");
      nombreInputRef.current?.focus();
      return;
    }

    // Validaciones por canal
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

      // Guardar prospecto
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
        window.open(`tel:${cleanPhone}`, "_self");
      }

      const nuevosContactos = (session.contactosCompletados || 0) + 1;
      const updatedSession: ProspectingSession = {
        ...session,
        contactosCompletados: nuevosContactos,
        duracionSegundos: elapsedSeconds,
      };
      setSession(updatedSession);
      saveStateToStorage(updatedSession, elapsedSeconds);

      const msgSuccess = 
        canal === "whatsapp" ? `Prospecto ${nuevosContactos} enviado por WhatsApp` :
        canal === "telefono" ? `Llamada a prospecto ${nuevosContactos} registrada` :
        canal === "correo" ? `Correo a prospecto ${nuevosContactos} generado` :
        `Prospecto ${nuevosContactos} guardado en CRM (Por Contactar)`;

      toast.success(msgSuccess);

      // Si cumplió la meta, finalizar automáticamente
      if (nuevosContactos >= session.metaObjetivo) {
        const finishRes = await finishProspectingSession(session.id, elapsedSeconds, userId);
        setSession(finishRes.session);
        setSessionStreak(finishRes.streak);
        clearStorageSession();
        setPhase("completed");
        toast.success("🎯 ¡Felicitaciones! Has completado tu meta de prospección.");
      } else {
        // Limpiar para el siguiente
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

  // 7. Agregar contacto extra tras completar meta
  const handleAddExtraContact = () => {
    if (!session) return;
    const updated = {
      ...session,
      metaObjetivo: session.metaObjetivo + 1,
    };
    setSession(updated);
    saveStateToStorage(updated, elapsedSeconds);
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
    clearStorageSession();
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

  // Síntomas disponibles
  const sintomasDisponibles: ProspectSintoma[] = [
    "Sin página web",
    "Web lenta / Sin certificado SSL",
    "Usa correo gratuito (@gmail / @hotmail)",
    "Ficha de Google Maps abandonada",
    "Venta manual por redes / Sin pasarela"
  ];

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen && phase === "active") {
          // Si cierra el modal con clic afuera o ESC mientras está en sesión activa,
          // pausar limpiamente para no perder el progreso
          handlePauseAndClose();
        } else {
          onOpenChange(newOpen);
        }
      }}
    >
      <DialogContent className="w-[96vw] sm:max-w-[700px] bg-slate-900/95 border-white/10 text-slate-100 max-h-[92dvh] overflow-y-auto p-4 sm:p-6 rounded-3xl shadow-2xl backdrop-blur-xl">
        
        {/* ============================================================== */}
        {/* FASE 1: SETUP PRE-SESIÓN (Con detector de sesión guardada)     */}
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
                Sin cuentas regresivas ni presión de tiempo. Diagnostica rápidamente el síntoma comercial del negocio y elige si contactar por WhatsApp, llamada, correo o guardar para después.
              </p>
            </DialogHeader>

            {/* BANNER: Detectada Sesión en Curso */}
            {savedLocalSession && (
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                      Tienes una sesión pendiente en curso
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    ⏱ {formatTimer(savedLocalSession.elapsedSeconds)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Progreso guardado:</span>
                  <span className="font-bold text-white">
                    {savedLocalSession.session.contactosCompletados} de {savedLocalSession.session.metaObjetivo} contactos
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={() => handleResumeSession(savedLocalSession)}
                    disabled={isSending}
                    className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs gap-1.5 shadow-md shadow-indigo-600/30"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Retomar Sesión ({savedLocalSession.session.contactosCompletados}/{savedLocalSession.session.metaObjetivo})
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleDiscardSession}
                    disabled={isSending}
                    className="h-10 px-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs"
                    title="Descartar sesión previa y comenzar limpia"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Selector de Meta de Contactos */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Meta de Contactos para esta Sesión
                  </Label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Recomendado: 3 contactos diarios para mantener racha y alta tasa de respuesta.
                  </p>
                </div>
                <div className="text-2xl font-black font-mono text-indigo-400 bg-indigo-500/10 px-4 py-1 rounded-xl border border-indigo-500/30">
                  {metaObjetivo}
                </div>
              </div>

              {/* Botones de selección rápida */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[3, 5, 7, 10].map((num) => (
                  <Button
                    key={num}
                    type="button"
                    variant={metaObjetivo === num ? "default" : "outline"}
                    onClick={() => setMetaObjetivo(num)}
                    className={`h-9 text-xs font-bold rounded-xl transition-all ${
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

            <DialogFooter className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cerrar
              </Button>

              <Button
                type="button"
                onClick={handleStartSession}
                disabled={isSending}
                className="w-full sm:w-auto h-11 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black text-sm gap-2 shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02]"
              >
                <Target className="w-4 h-4" />
                Iniciar Nueva Sesión ({metaObjetivo} contactos)
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ============================================================== */}
        {/* FASE 2: FLUJO DE PROSPECCIÓN ACTIVA (Ultra limpio y relajado)  */}
        {/* ============================================================== */}
        {phase === "active" && (
          <div className="space-y-4">
            
            {/* 1. HEADER COMPACTO: Progreso + Tiempo + Acciones de Cierre */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-mono text-xs font-black">
                  {contactosActuales + 1}
                </span>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black text-white">
                    <span>Prospecto {contactosActuales + 1} de {metaTotal}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({progresoPorcentaje}%)</span>
                  </div>
                  {/* Micro barra de progreso */}
                  <div className="w-24 sm:w-32 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/10 mt-1">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${progresoPorcentaje}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Centro/Derecha: Cronómetro Sutil + Botones de Pausar / Finalizar */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span className="text-xs font-mono font-black text-indigo-300">
                    {formatTimer(elapsedSeconds)}
                  </span>
                </div>

                {/* Botón Pausar y Guardar (no destruye ni marca incompleto) */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePauseAndClose}
                  className="h-8 px-2.5 rounded-xl border-white/15 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold gap-1"
                  title="Pausa el cronómetro y guarda el progreso para retomar luego"
                >
                  <Pause className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Pausar</span>
                </Button>

                {/* Botón Finalizar Sesión Ahora */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleFinalizeSessionNow}
                  className="h-8 px-2.5 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold gap-1"
                  title="Concluye la sesión con los contactos actuales"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Finalizar</span>
                </Button>
              </div>
            </div>

            {/* 2. DATOS DEL PROSPECTO (Diseño compacto y limpio) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
              <div>
                <Label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  Negocio o Contacto *
                </Label>
                <Input
                  ref={nombreInputRef}
                  value={nombreNegocio}
                  onChange={(e) => setNombreNegocio(e.target.value)}
                  placeholder="Ej. Taller Mecánico San Martín / Clínica Dental Reñaca"
                  className="bg-slate-900 border-white/15 text-white h-10 text-xs font-bold mt-1 placeholder:text-slate-600 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" /> Teléfono (WhatsApp o directo)
                  </Label>
                  <Input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+56 9 8765 4321"
                    className="bg-slate-900 border-white/15 text-white h-9 text-xs font-mono font-bold mt-1 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-indigo-400" /> Correo Electrónico (opcional)
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@negocio.cl"
                    className="bg-slate-900 border-white/15 text-white h-9 text-xs font-medium mt-1 placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* 3. DIAGNÓSTICO RÁPIDO: Chips / Pills compactas en lugar de 5 tarjetas gigantes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Síntoma Detectado
                </Label>
                <span className="text-[10px] text-slate-400 font-medium">Un clic para adaptar el mensaje</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {sintomasDisponibles.map((sin) => {
                  const item = PROSPECCION_TEMPLATES[sin];
                  const isSelected = sintoma === sin;

                  return (
                    <button
                      key={sin}
                      type="button"
                      onClick={() => setSintoma(sin)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                          : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span>{item.icono}</span>
                      <span>{item.tituloCorto}</span>
                    </button>
                  );
                })}
              </div>

              {/* Breve descripción de 1 línea del síntoma seleccionado */}
              <p className="text-[11px] text-slate-400 pl-1 italic">
                💡 {PROSPECCION_TEMPLATES[sintoma].descripcionSintoma}
              </p>
            </div>

            {/* 4. CANAL DE CONTACTO: Segmented control elegante (~40px de alto) */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                Canal de Prospección
              </Label>

              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs">
                {/* Tab WhatsApp */}
                <button
                  type="button"
                  onClick={() => setCanal("whatsapp")}
                  className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                    canal === "whatsapp"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="truncate">WhatsApp</span>
                </button>

                {/* Tab Teléfono / Llamada */}
                <button
                  type="button"
                  onClick={() => setCanal("telefono")}
                  className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                    canal === "telefono"
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="truncate">Llamada</span>
                </button>

                {/* Tab Correo */}
                <button
                  type="button"
                  onClick={() => setCanal("correo")}
                  className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                    canal === "correo"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">Correo</span>
                </button>

                {/* Tab Solo Guardar / No contactar */}
                <button
                  type="button"
                  onClick={() => setCanal("no_contactar")}
                  className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                    canal === "no_contactar"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span className="truncate">Guardar</span>
                </button>
              </div>
            </div>

            {/* 5. VISTA PREVIA Y ACCIÓN ADAPTADA AL CANAL (Compacta y sin bloat) */}
            {canal === "whatsapp" && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Mensaje Personalizado
                  </span>
                  <span className="text-[10px] text-slate-500">Puedes editar antes de enviar</span>
                </div>
                <Textarea
                  value={mensajeEnviado}
                  onChange={(e) => setMensajeEnviado(e.target.value)}
                  rows={3}
                  className="bg-slate-950/90 border-emerald-500/30 text-slate-200 text-xs font-sans leading-relaxed rounded-xl resize-none focus-visible:ring-emerald-500"
                />
              </div>
            )}

            {canal === "telefono" && (
              <div className="space-y-2 p-3 rounded-2xl bg-sky-950/20 border border-sky-500/20 animate-in fade-in duration-200">
                <div className="text-xs space-y-1">
                  <span className="font-bold text-sky-400 flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5" /> Pauta Breve de Conversación
                  </span>
                  <p className="text-[11px] text-slate-300 italic bg-slate-950/80 p-2 rounded-lg border border-white/5">
                    "{PROSPECCION_TEMPLATES[sintoma].pautaLlamada(nombreNegocio)}"
                  </p>
                </div>
                <Input
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Nota breve o resultado (ej. 'Llamar mañana a las 11:00')"
                  className="bg-slate-950/90 border-white/10 text-white h-8 text-xs rounded-xl"
                />
              </div>
            )}

            {canal === "correo" && (
              <div className="space-y-2 p-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 animate-in fade-in duration-200">
                <Input
                  value={asuntoEmail}
                  onChange={(e) => setAsuntoEmail(e.target.value)}
                  placeholder="Asunto del correo"
                  className="bg-slate-950/90 border-white/10 text-white h-8 text-xs rounded-xl font-medium"
                />
                <Textarea
                  value={mensajeEnviado}
                  onChange={(e) => setMensajeEnviado(e.target.value)}
                  rows={3}
                  className="bg-slate-950/90 border-indigo-500/30 text-slate-200 text-xs leading-relaxed rounded-xl resize-none"
                />
              </div>
            )}

            {canal === "no_contactar" && (
              <div className="space-y-2 p-3 rounded-2xl bg-amber-950/20 border border-amber-500/20 animate-in fade-in duration-200">
                <p className="text-[11px] text-amber-200/90 flex items-center gap-1.5 font-medium">
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Quedará registrado como <strong>"Por Contactar"</strong> en tu CRM para abordarlo cuando tengas tiempo.
                </p>
                <Input
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observación o dónde lo encontraste (opcional)"
                  className="bg-slate-950/90 border-white/10 text-white h-8 text-xs rounded-xl"
                />
              </div>
            )}

            {/* 6. BOTÓN PRINCIPAL ADAPTADO AL CANAL (Fijo y prominente) */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                {canal === "whatsapp" && "Abrirá WhatsApp Web/Móvil con el mensaje listo."}
                {canal === "telefono" && "Registrará la llamada y avanzará de prospecto."}
                {canal === "correo" && "Abrirá tu gestor de correo con destinatario listo."}
                {canal === "no_contactar" && "Guardará el lead como pendiente sin abrir apps."}
              </span>

              <Button
                type="button"
                onClick={handleSendAndNext}
                disabled={isSending}
                className={`w-full sm:w-auto h-11 px-7 rounded-xl font-black text-xs gap-2 shadow-xl transition-all hover:scale-[1.02] ${
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
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar WhatsApp y Siguiente ({contactosActuales + 1}/{metaTotal})</span>
                  </>
                ) : canal === "telefono" ? (
                  <>
                    <Phone className="w-3.5 h-3.5" />
                    <span>Registrar Llamada y Siguiente ({contactosActuales + 1}/{metaTotal})</span>
                  </>
                ) : canal === "correo" ? (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Abrir Correo y Siguiente ({contactosActuales + 1}/{metaTotal})</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
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
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/25">
              <Trophy className="w-8 h-8 text-slate-950" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 
                {session.metaCumplida ? "¡Meta Cumplida!" : "Sesión Finalizada"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {session.metaCumplida ? "¡Sesión Completada con Éxito!" : "¡Sesión Registrada!"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Has registrado <strong className="text-white font-black">{session.contactosCompletados} prospectos</strong> en{" "}
                <strong className="text-white font-black">{session.duracionMinutos || 1} minutos</strong>{" "}
                (promedio{" "}
                <strong className="text-emerald-400 font-black">
                  {(session.contactosCompletados > 0 
                    ? (session.duracionMinutos || 1) / session.contactosCompletados 
                    : 0
                  ).toFixed(1)}{" "}
                  min
                </strong>{" "}
                por prospecto).
              </p>
            </div>

            {/* Tarjeta de Racha Diaria Actualizada */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-950 border border-amber-500/30 max-w-md mx-auto space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
                <span className="text-sm font-black text-amber-300">
                  Racha Activa: {sessionStreak?.rachaActual || 1} días consecutivos
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Récord máximo del usuario: <strong className="text-white">{sessionStreak?.rachaMaxima || 1} días</strong>
              </p>
            </div>

            {/* Acciones de Cierre */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddExtraContact}
                className="w-full sm:w-auto h-10 px-5 rounded-xl border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs font-bold gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar un contacto extra
              </Button>

              <Button
                type="button"
                onClick={handleCloseAndFinish}
                className="w-full sm:w-auto h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/25"
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
