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
        <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-12 px-4 sm:px-8 py-6 sm:py-12">
          
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-foreground leading-none">{title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-2">
              <BadgeCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary/60" /> Gestión de identidad Hoja SpA
            </p>
          </div>

          <div className="grid gap-8 sm:gap-10">
            {/* SECCIÓN 01: INFORMACIÓN BÁSICA */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-3 text-foreground">
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-secondary text-white shadow-lg shadow-secondary/20 text-xs">01</span>
                Información Básica
              </h2>
              <div className="grid gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Nombre Completo / Empresa</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.nombre || ""}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      placeholder="Ej: Juan Perez o TecnoCorp S.A."
                      className="bg-muted/30 border-none h-12 sm:h-14 pl-12 text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl focus:bg-muted/50 transition-all"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">RUT / Identificador Fiscal</Label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.rut || ""}
                        onChange={(e) => setFormData({...formData, rut: e.target.value})}
                        placeholder="12.345.678-9"
                        className="bg-muted/30 border-none h-12 sm:h-14 pl-12 font-bold rounded-xl sm:rounded-2xl text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Email de Contacto</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.email || ""}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="cliente@email.com"
                        className="bg-muted/30 border-none h-12 sm:h-14 pl-12 font-bold rounded-xl sm:rounded-2xl text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.telefono || ""}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        placeholder="+56 9 1234 5678"
                        className="bg-muted/30 border-none h-12 sm:h-14 pl-12 font-bold rounded-xl sm:rounded-2xl text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Persona de Contacto</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.contacto || ""}
                        onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                        placeholder="Ej: Gerente de Proyectos"
                        className="bg-muted/30 border-none h-12 sm:h-14 pl-12 font-bold rounded-xl sm:rounded-2xl text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 02: IDENTIDAD DIGITAL */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-3 text-foreground">
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-secondary text-white shadow-lg shadow-secondary/20 text-xs">02</span>
                Presencia Digital
              </h2>
              <div className="grid gap-4 sm:gap-6">
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Instagram</Label>
                    <div className="relative">
                      <Camera className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.social_instagram || ""}
                        onChange={(e) => setFormData({...formData, social_instagram: e.target.value})}
                        placeholder="@usuario"
                        className="bg-muted/30 border-none h-12 sm:h-14 pl-12 font-bold rounded-xl sm:rounded-2xl text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">LinkedIn</Label>
                    <div className="relative">
                      <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.social_linkedin || ""}
                        onChange={(e) => setFormData({...formData, social_linkedin: e.target.value})}
                        placeholder="URL de perfil"
                        className="bg-muted/30 border-none h-12 sm:h-14 pl-12 font-bold rounded-xl sm:rounded-2xl text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Sitio Web</Label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.social_web || ""}
                      onChange={(e) => setFormData({...formData, social_web: e.target.value})}
                      placeholder="https://www.empresa.com"
                      className="bg-muted/30 border-none h-12 sm:h-14 pl-12 font-bold rounded-xl sm:rounded-2xl text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACCIÓN */}
      <div className="shrink-0 bg-secondary px-4 sm:px-8 py-4 sm:py-6 border-t border-white/5 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl flex items-center justify-end gap-4">
          <Button 
            onClick={onSave} 
            disabled={isSaving} 
            className="w-full sm:w-auto h-12 sm:h-16 px-8 sm:px-12 rounded-xl sm:rounded-2xl bg-[#abaafd] text-[#2e3c7e] font-black text-base sm:text-xl shadow-2xl shadow-[#abaafd]/20 hover:scale-105 transition-all gap-3"
          >
            <Save className="h-4 w-4 sm:h-5 sm:w-5" /> 
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
};
