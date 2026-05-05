"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Save, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Camera, 
  Share2, 
  FileText,
  BadgeCheck
} from "lucide-react";
import { Cliente } from "@/lib/types";

interface ClienteFormViewProps {
  formData: Partial<Cliente>;
  setFormData: (data: Partial<Cliente>) => void;
  onSave: () => void;
  isSaving: boolean;
  title: string;
}

export const ClienteFormView: React.FC<ClienteFormViewProps> = ({
  formData,
  setFormData,
  onSave,
  isSaving,
  title
}) => {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* AREA DE CONTENIDO CON SCROLL */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-12 px-6 sm:px-8 py-8 sm:py-12">
          
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tighter text-foreground leading-none">{title}</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-[#abaafd]" /> Gestión de identidad de clientes Hoja SpA
            </p>
          </div>

          <div className="grid gap-10">
            {/* SECCIÓN 01: INFORMACIÓN BÁSICA */}
            <div className="space-y-6">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-3 text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#abaafd] text-[#2e3c7e] shadow-lg shadow-[#abaafd]/20 text-xs">01</span>
                Información Básica
              </h2>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#abaafd]/80">Nombre Completo / Empresa</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.nombre || ""}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      placeholder="Ej: Juan Perez o TecnoCorp S.A."
                      className="bg-muted/30 border-none h-14 pl-12 text-lg font-bold rounded-2xl focus:bg-muted/50 transition-all"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#abaafd]/80">RUT / Identificador Fiscal</Label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.rut || ""}
                        onChange={(e) => setFormData({...formData, rut: e.target.value})}
                        placeholder="12.345.678-9"
                        className="bg-muted/30 border-none h-14 pl-12 font-bold rounded-2xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#abaafd]/80">Email de Contacto</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.email || ""}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="cliente@email.com"
                        className="bg-muted/30 border-none h-14 pl-12 font-bold rounded-2xl"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#abaafd]/80">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.telefono || ""}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        placeholder="+56 9 1234 5678"
                        className="bg-muted/30 border-none h-14 pl-12 font-bold rounded-2xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#abaafd]/80">Persona de Contacto</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.contacto || ""}
                        onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                        placeholder="Ej: Gerente de Proyectos"
                        className="bg-muted/30 border-none h-14 pl-12 font-bold rounded-2xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 02: IDENTIDAD DIGITAL */}
            <div className="space-y-6">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-3 text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#abaafd] text-[#2e3c7e] shadow-lg shadow-[#abaafd]/20 text-xs">02</span>
                Presencia Digital
              </h2>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#abaafd]/80">Sitio Web</Label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.social_web || ""}
                      onChange={(e) => setFormData({...formData, social_web: e.target.value})}
                      placeholder="https://www.cliente.com"
                      className="bg-muted/30 border-none h-12 pl-12 font-bold rounded-2xl"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#abaafd]/80">Instagram</Label>
                    <div className="relative">
                      <Camera className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.social_instagram || ""}
                        onChange={(e) => setFormData({...formData, social_instagram: e.target.value})}
                        placeholder="@usuario"
                        className="bg-muted/30 border-none h-12 pl-12 font-bold rounded-2xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#abaafd]/80">LinkedIn</Label>
                    <div className="relative">
                      <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.social_linkedin || ""}
                        onChange={(e) => setFormData({...formData, social_linkedin: e.target.value})}
                        placeholder="linkedin.com/in/usuario"
                        className="bg-muted/30 border-none h-12 pl-12 font-bold rounded-2xl"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#abaafd]/80">Otras Redes / Notas</Label>
                  <div className="relative">
                    <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.social_otro || ""}
                      onChange={(e) => setFormData({...formData, social_otro: e.target.value})}
                      placeholder="Ej: Twitter, Facebook, etc."
                      className="bg-muted/30 border-none h-12 pl-12 font-bold rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER FIJO */}
      <div className="shrink-0 bg-secondary text-secondary-foreground shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10 backdrop-blur-3xl px-6 sm:px-12 py-6 sm:py-8 z-20">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col text-center sm:text-left">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Estado del Registro</span>
            <span className="text-lg sm:text-xl font-bold flex items-center justify-center sm:justify-start gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Listo para procesar
            </span>
          </div>
          <Button 
            onClick={onSave} 
            disabled={isSaving} 
            className="w-full sm:w-auto shrink-0 gap-4 rounded-2xl px-12 sm:px-16 py-6 sm:py-8 text-lg sm:text-xl font-black shadow-2xl shadow-[#abaafd]/20 hover:scale-105 transition-all bg-[#abaafd] text-[#2e3c7e]"
          >
            <Save className="h-5 w-5 sm:h-6 sm:w-6" /> 
            <span>{isSaving ? "Guardando..." : "Guardar Cliente"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
