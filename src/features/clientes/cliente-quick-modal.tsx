"use client";

import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  Camera, 
  Share2, 
  FileText, 
  Calendar, 
  Loader2, 
  Sparkles,
  Target,
  UserCheck
} from "lucide-react";
import { saveCliente } from "@/lib/services";
import { Cliente, TipoRegistro, SubEstadoProspecto } from "@/lib/types";
import { toast } from "sonner";
import { sanitizeString, sanitizeData } from "@/lib/sanitize";

interface ClienteQuickModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newClient?: Cliente) => void;
}

export const ClienteQuickModal: React.FC<ClienteQuickModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>("prospecto");
  const [subEstado, setSubEstado] = useState<SubEstadoProspecto>("sin_contacto");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [rut, setRut] = useState("");
  const [socialWeb, setSocialWeb] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialLinkedin, setSocialLinkedin] = useState("");
  const [notaInicial, setNotaInicial] = useState("");
  const [proximoRecordatorio, setProximoRecordatorio] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setTipoRegistro("prospecto");
    setSubEstado("sin_contacto");
    setNombre("");
    setContacto("");
    setTelefono("");
    setEmail("");
    setRut("");
    setSocialWeb("");
    setSocialInstagram("");
    setSocialLinkedin("");
    setNotaInicial("");
    setProximoRecordatorio("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.warning("El nombre comercial o empresa es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Cliente> = {
        nombre: sanitizeString(nombre.trim()),
        contacto: sanitizeString(contacto.trim()),
        telefono: sanitizeString(telefono.trim()),
        email: sanitizeString(email.trim()),
        rut: sanitizeString(rut.trim()),
        social_web: sanitizeString(socialWeb.trim()),
        social_instagram: sanitizeString(socialInstagram.trim()),
        social_linkedin: sanitizeString(socialLinkedin.trim()),
        tipo_registro: tipoRegistro,
        sub_estado: tipoRegistro === "prospecto" ? subEstado : undefined,
        estado: tipoRegistro === "prospecto" ? "prospecto" : "activo",
        proximoRecordatorio: proximoRecordatorio || undefined,
        historialNotas: notaInicial.trim() ? [
          {
            id: `nota-${Date.now()}`,
            autorNombre: "Operador",
            fecha: new Date().toISOString(),
            texto: sanitizeString(notaInicial.trim()),
            tipo: "llamada",
          }
        ] : [],
      };

      const res = await saveCliente(sanitizeData(payload));
      toast.success(
        tipoRegistro === "prospecto" 
          ? "Prospecto registrado con éxito" 
          : "Cliente creado con éxito"
      );
      resetForm();
      onOpenChange(false);
      onSuccess(res);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error al registrar cliente";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl p-4 sm:p-6 bg-card border border-white/10 shadow-2xl rounded-2xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-foreground">
              Alta Rápida de Contacto Comercial
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Ingresa la información básica y presencia digital. Los productos, proyectos y tickets se gestionarán desde el detalle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-3">
          {/* Selector de Estado Inicial: Prospecto vs Cliente */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Tipo de Registro *
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-muted/40 rounded-2xl border border-border/50">
              <button
                type="button"
                onClick={() => setTipoRegistro("prospecto")}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  tipoRegistro === "prospecto"
                    ? "bg-sky-500 text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Target className="h-4 w-4" /> Prospecto Comercial
              </button>
              <button
                type="button"
                onClick={() => setTipoRegistro("cliente")}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  tipoRegistro === "cliente"
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserCheck className="h-4 w-4" /> Cliente con Proyectos
              </button>
            </div>
          </div>

          {/* Sub-estado para Prospectos */}
          {tipoRegistro === "prospecto" && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-sky-500/5 border border-sky-500/20">
              <Label className="text-xs font-bold text-sky-400">
                Sub-Estado del Prospecto
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSubEstado("sin_contacto")}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    subEstado === "sin_contacto"
                      ? "bg-slate-700/80 text-white border-slate-600 shadow-sm"
                      : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  ⏳ Sin Contacto
                </button>
                <button
                  type="button"
                  onClick={() => setSubEstado("contactado")}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    subEstado === "contactado"
                      ? "bg-sky-600 text-white border-sky-500 shadow-sm"
                      : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  📞 Contactado
                </button>
              </div>
            </div>
          )}

          {/* Información Básica */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quick-nombre" className="text-xs font-bold text-foreground">
                  Nombre Comercial / Empresa *
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="quick-nombre"
                    placeholder="Ej. Comercial Los Andes SpA"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="pl-9 rounded-xl bg-background border-border text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-contacto" className="text-xs font-bold text-foreground">
                  Persona de Contacto
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="quick-contacto"
                    placeholder="Ej. Juan Pérez (Gerente)"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    className="pl-9 rounded-xl bg-background border-border text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quick-telefono" className="text-xs font-bold text-foreground">
                  Teléfono (WhatsApp)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="quick-telefono"
                    placeholder="+56 9 1234 5678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="pl-9 rounded-xl bg-background border-border text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-email" className="text-xs font-bold text-foreground">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="quick-email"
                    type="email"
                    placeholder="contacto@empresa.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 rounded-xl bg-background border-border text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-rut" className="text-xs font-bold text-foreground">
                  RUT / ID Fiscal
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="quick-rut"
                    placeholder="76.123.456-7"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    className="pl-9 rounded-xl bg-background border-border text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Presencia Digital */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-muted/20 border border-border/40">
            <span className="text-xs font-bold text-muted-foreground block mb-1">
              Presencia Digital & Enlaces Web
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Sitio Web (https://...)"
                  value={socialWeb}
                  onChange={(e) => setSocialWeb(e.target.value)}
                  className="pl-8 text-xs rounded-xl bg-background border-border"
                />
              </div>

              <div className="relative">
                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="@instagram"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  className="pl-8 text-xs rounded-xl bg-background border-border"
                />
              </div>

              <div className="relative">
                <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="LinkedIn / Empresa"
                  value={socialLinkedin}
                  onChange={(e) => setSocialLinkedin(e.target.value)}
                  className="pl-8 text-xs rounded-xl bg-background border-border"
                />
              </div>
            </div>
          </div>

          {/* Recordatorio o Nota Inicial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quick-recordatorio" className="text-xs font-bold text-foreground">
                Próximo Recordatorio (Opcional)
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="quick-recordatorio"
                  type="datetime-local"
                  value={proximoRecordatorio}
                  onChange={(e) => setProximoRecordatorio(e.target.value)}
                  className="pl-9 rounded-xl bg-background border-border text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quick-nota" className="text-xs font-bold text-foreground">
                Comentario / Nota Inicial
              </Label>
              <Textarea
                id="quick-nota"
                placeholder="Observación o diagnóstico inicial..."
                value={notaInicial}
                onChange={(e) => setNotaInicial(e.target.value)}
                className="rounded-xl bg-background border-border text-xs min-h-[42px] py-2"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-border"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary text-primary-foreground font-black gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Crear Registro
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
