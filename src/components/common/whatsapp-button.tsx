"use client";

import React, { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface WhatsAppButtonProps {
  telefono?: string;
  clienteNombre?: string;
  contexto?: {
    tipo: "seguimiento" | "presupuesto" | "cobro" | "proyecto" | "general";
    numeroDoc?: string;
    monto?: number;
    fecha?: string;
    proyectoNombre?: string;
    motivo?: string;
  };
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  buttonLabel?: string;
  iconOnly?: boolean;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  telefono = "",
  clienteNombre = "Cliente",
  contexto,
  variant = "ghost",
  size = "icon",
  className = "",
  buttonLabel = "WhatsApp",
  iconOnly = true,
}) => {
  const [open, setOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState(telefono);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");
  const [message, setMessage] = useState<string>("");

  // Sanitizar teléfono para formato internacional E.164 (Ej: 56912345678)
  const formatPhone = (raw: string) => {
    let clean = raw.replace(/\D/g, "");
    if (clean.length === 9 && clean.startsWith("9")) {
      clean = "56" + clean;
    } else if (clean.length === 8) {
      clean = "569" + clean;
    }
    return clean;
  };

  const getTemplateMessage = (templateKey: string) => {
    const formattedMonto = contexto?.monto 
      ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(contexto.monto)
      : "";

    switch (templateKey) {
      case "seguimiento_comercial":
        return `Hola ${clienteNombre}, te escribo de Servicios Informáticos Hoja SpA para consultar sobre ${contexto?.motivo || "nuestro contacto pendiente"}. ¿Tienes unos minutos hoy para conversar?`;
      
      case "presupuesto_revision":
        return `Hola ${clienteNombre}, te saludo desde Hoja SpA. Quería consultar si tuviste oportunidad de revisar la propuesta/cotización ${contexto?.numeroDoc ? `N° ${contexto.numeroDoc}` : ""}. Quedo muy atento a cualquier consulta o ajuste técnico.`;
      
      case "cobro_hito":
        return `Hola ${clienteNombre}, te contacto desde Hoja SpA respecto al proyecto ${contexto?.proyectoNombre ? `"${contexto.proyectoNombre}"` : ""}. Te recordamos el hito de pago pendiente por ${formattedMonto}. ¿Podrías confirmarnos la fecha de transferencia? ¡Muchas gracias!`;
      
      case "proyecto_avance":
        return `Hola ${clienteNombre}, te escribo desde el equipo técnico de Hoja SpA para compartirte una actualización sobre el avance del proyecto ${contexto?.proyectoNombre ? `"${contexto.proyectoNombre}"` : ""}. ¿Podemos agendar una breve llamada de revisión?`;

      default:
        return `Hola ${clienteNombre}, te contacto de Servicios Informáticos Hoja SpA.`;
    }
  };

  const handleOpen = () => {
    setPhoneInput(telefono);
    let defaultTemp = "seguimiento_comercial";
    if (contexto?.tipo === "presupuesto") defaultTemp = "presupuesto_revision";
    if (contexto?.tipo === "cobro") defaultTemp = "cobro_hito";
    if (contexto?.tipo === "proyecto") defaultTemp = "proyecto_avance";
    
    setSelectedTemplate(defaultTemp);
    setMessage(getTemplateMessage(defaultTemp));
    setOpen(true);
  };

  const handleTemplateChange = (val: string | null) => {
    if (!val) return;
    setSelectedTemplate(val);
    if (val !== "custom") {
      setMessage(getTemplateMessage(val));
    }
  };

  const handleSend = () => {
    const cleanPhone = formatPhone(phoneInput);
    if (!cleanPhone || cleanPhone.length < 8) {
      toast.error("Por favor ingresa un número de teléfono válido con código de país");
      return;
    }
    const encoded = encodeURIComponent(message.trim());
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, "_blank");
    setOpen(false);
    toast.success("Abriendo WhatsApp Web / Móvil...");
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpen}
        className={`hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors ${className}`}
        title={`Contactar a ${clienteNombre} por WhatsApp`}
      >
        <MessageSquare className="h-4 w-4 text-emerald-500" />
        {!iconOnly && <span className="ml-2 font-medium">{buttonLabel}</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>

      <DialogContent className="sm:max-w-[500px] border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black tracking-tight text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <MessageSquare className="h-4 w-4" />
            </span>
            Mensaje Directo WhatsApp
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Contactar a <strong className="text-foreground">{clienteNombre}</strong> usando el protocolo oficial de WhatsApp.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Número de Teléfono (WhatsApp)
            </Label>
            <input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="+56 9 1234 5678"
              className="w-full rounded-xl bg-muted/40 border border-white/10 px-3.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Plantilla Predefinida
            </Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger className="w-full rounded-xl bg-muted/40 border border-white/10 text-sm">
                <SelectValue placeholder="Selecciona una plantilla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seguimiento_comercial">📅 Seguimiento Comercial / Llamada</SelectItem>
                <SelectItem value="presupuesto_revision">📄 Revisión de Cotización Emitida</SelectItem>
                <SelectItem value="cobro_hito">💰 Recordatorio de Pago / Hito</SelectItem>
                <SelectItem value="proyecto_avance">🚀 Actualización de Proyecto</SelectItem>
                <SelectItem value="custom">✍️ Mensaje Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Mensaje a Enviar
            </Label>
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setSelectedTemplate("custom");
              }}
              rows={4}
              placeholder="Escribe tu mensaje..."
              className="resize-none rounded-xl bg-muted/40 border border-white/10 text-sm leading-relaxed focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 rounded-xl shadow-lg shadow-emerald-600/20"
          >
            <Send className="h-4 w-4" /> Enviar por WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
