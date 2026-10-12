"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Save, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Camera, 
  Share2, 
  FileText, 
  BadgeCheck,
  Calendar,
  Key,
  Plus,
  Trash2,
  Activity,
  Target,
  Stethoscope
} from "lucide-react";
import { 
  Cliente, 
  ClienteEstado, 
  AccesoOperativo,
  ClienteSintomaPrincipal,
  ClienteEtapaPipeline
} from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ClienteFormViewProps {
  formData: Partial<Cliente>;
  setFormData: (data: Partial<Cliente>) => void;
  onSave: () => void;
  isSaving: boolean;
  title: string;
  onAddNota: (texto: string, tipo: "reunion" | "llamada" | "whatsapp" | "acuerdo") => void;
  onRemoveNota: (id: string) => void;
  onAddAcceso: (acceso: AccesoOperativo) => void;
  onRemoveAcceso: (index: number) => void;
}

export const ClienteFormView: React.FC<ClienteFormViewProps> = ({
  formData,
  setFormData,
  onSave,
  isSaving,
  title,
  onAddNota,
  onRemoveNota,
  onAddAcceso,
  onRemoveAcceso,
}) => {
  // Estado local para agregar nueva nota
  const [nuevaNotaTexto, setNuevaNotaTexto] = useState("");
  const [nuevaNotaTipo, setNuevaNotaTipo] = useState<"reunion" | "llamada" | "whatsapp" | "acuerdo">("llamada");

  // Estado local para agregar nuevo acceso
  const [nuevoAccesoTipo, setNuevoAccesoTipo] = useState("cPanel");
  const [nuevoAccesoIdentificador, setNuevoAccesoIdentificador] = useState("");
  const [nuevoAccesoUsuario, setNuevoAccesoUsuario] = useState("");
  const [nuevoAccesoClave, setNuevoAccesoClave] = useState("");

  const handleCreateNota = () => {
    if (!nuevaNotaTexto.trim()) return;
    onAddNota(nuevaNotaTexto, nuevaNotaTipo);
    setNuevaNotaTexto("");
  };

  const handleCreateAcceso = () => {
    if (!nuevoAccesoIdentificador.trim() || !nuevoAccesoUsuario.trim()) return;
    onAddAcceso({
      tipo: nuevoAccesoTipo,
      identificador: nuevoAccesoIdentificador.trim(),
      usuario: nuevoAccesoUsuario.trim(),
      claveONotas: nuevoAccesoClave.trim(),
    });
    setNuevoAccesoIdentificador("");
    setNuevoAccesoUsuario("");
    setNuevoAccesoClave("");
  };

  const getTipoNotaBadge = (tipo?: string) => {
    switch (tipo) {
      case "reunion":
        return <Badge className="bg-purple-500/20 text-purple-300 border-none">Reunión</Badge>;
      case "llamada":
        return <Badge className="bg-sky-500/20 text-sky-300 border-none">Llamada</Badge>;
      case "whatsapp":
        return <Badge className="bg-emerald-500/20 text-emerald-300 border-none">WhatsApp</Badge>;
      case "acuerdo":
        return <Badge className="bg-amber-500/20 text-amber-300 border-none">Acuerdo</Badge>;
      default:
        return <Badge variant="secondary">Nota</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* AREA DE CONTENIDO CON SCROLL */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-12 px-4 sm:px-8 py-6 sm:py-12">
          
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-foreground leading-none">{title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-2">
              <BadgeCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" /> CRM & Memoria Operativa Hoja SpA
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
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Completo / Empresa</Label>
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
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">RUT / Identificador Fiscal</Label>
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
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email de Contacto</Label>
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
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Teléfono (WhatsApp)</Label>
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
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Persona de Contacto</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.contacto || ""}
                        onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                        placeholder="Ej: Gerente de Operaciones"
                        className="bg-muted/30 border-none h-12 sm:h-14 pl-12 font-bold rounded-xl sm:rounded-2xl text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 02: ESTADO CRM Y PRÓXIMO CONTACTO */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-3 text-foreground">
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-secondary text-white shadow-lg shadow-secondary/20 text-xs">02</span>
                Estado Operativo y Seguimiento Comercial
              </h2>
              <div className="grid gap-4 sm:gap-6 p-6 rounded-2xl bg-white/5 border border-white/10">
                {/* CRM Pipeline y Selector de Síntomas Clave */}
                <div className="grid md:grid-cols-2 gap-4 pb-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      Etapa del Pipeline CRM *
                    </Label>
                    <Select 
                      value={formData.etapaPipeline || "Detectado"} 
                      onValueChange={(val) => {
                        if (val) setFormData({...formData, etapaPipeline: val as ClienteEtapaPipeline});
                      }}
                    >
                      <SelectTrigger className="bg-muted/40 border border-indigo-500/30 h-12 rounded-xl text-sm font-bold text-white">
                        <SelectValue placeholder="Selecciona etapa" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/15 text-white font-medium">
                        <SelectItem value="Detectado">🔍 Detectado (Oportunidad fría)</SelectItem>
                        <SelectItem value="Contactado">📞 Contactado (Primer acercamiento)</SelectItem>
                        <SelectItem value="En Diagnóstico">🔬 En Diagnóstico (Evaluación de dolor)</SelectItem>
                        <SelectItem value="Cotización Presentada">📄 Cotización Presentada</SelectItem>
                        <SelectItem value="Cerrado Ganado">🏆 Cerrado Ganado</SelectItem>
                        <SelectItem value="Perdido">❌ Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-amber-400" />
                      Síntoma Principal Detectado
                    </Label>
                    <Select 
                      value={formData.sintomaPrincipal || "ninguno"} 
                      onValueChange={(val) => {
                        setFormData({
                          ...formData, 
                          sintomaPrincipal: val === "ninguno" ? undefined : (val as ClienteSintomaPrincipal)
                        });
                      }}
                    >
                      <SelectTrigger className="bg-muted/40 border border-amber-500/30 h-12 rounded-xl text-xs font-bold text-white">
                        <SelectValue placeholder="Seleccionar síntoma comercial..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/15 text-white font-medium">
                        <SelectItem value="ninguno">-- Sin síntoma específico --</SelectItem>
                        <SelectItem value="Google Maps desactualizado / sin botón WhatsApp">📍 Google Maps desactualizado / sin botón WhatsApp</SelectItem>
                        <SelectItem value="Web lenta / sin certificado SSL">🔒 Web lenta / sin certificado SSL</SelectItem>
                        <SelectItem value="Usa correos gratuitos (@gmail / @hotmail)">📧 Usa correos gratuitos (@gmail / @hotmail)</SelectItem>
                        <SelectItem value="Gestión manual de pedidos por redes">📱 Gestión manual de pedidos por redes</SelectItem>
                        <SelectItem value="Sin pasarela de pagos automatizada">💳 Sin pasarela de pagos automatizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado Operativo General</Label>
                  <Select 
                    value={formData.estado || "prospecto"} 
                    onValueChange={(val) => {
                      if (val) setFormData({...formData, estado: val as ClienteEstado});
                    }}
                  >
                    <SelectTrigger className="bg-muted/30 border-none h-12 rounded-xl text-sm font-bold">
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospecto">🎯 Prospecto Comercial</SelectItem>
                      <SelectItem value="activo">🚀 Activo en desarrollo</SelectItem>
                      <SelectItem value="recurrente">🔄 Servicio recurrente / Mantención</SelectItem>
                      <SelectItem value="inactivo">⏸️ Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha Próximo Contacto</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="date"
                        value={formData.fechaProximoSeguimiento || formData.proximoContacto?.fecha || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData, 
                            fechaProximoSeguimiento: val,
                            proximoContacto: {
                              motivo: formData.proximoContacto?.motivo || "",
                              estado: formData.proximoContacto?.estado || "pendiente",
                              fecha: val
                            }
                          });
                        }}
                        className="bg-muted/30 border-none h-12 pl-12 font-bold rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado del Contacto</Label>
                    <Select 
                      value={formData.proximoContacto?.estado || "pendiente"} 
                      onValueChange={(val) => {
                        if (val) {
                          setFormData({
                            ...formData,
                            proximoContacto: {
                              fecha: formData.proximoContacto?.fecha || "",
                              motivo: formData.proximoContacto?.motivo || "",
                              estado: val as "pendiente" | "realizado" | "cancelado"
                            }
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="bg-muted/30 border-none h-12 rounded-xl text-sm font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">⏳ Pendiente</SelectItem>
                        <SelectItem value="realizado">✅ Realizado</SelectItem>
                        <SelectItem value="cancelado">❌ Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Motivo / Asunto del Seguimiento</Label>
                  <Input 
                    value={formData.proximoContacto?.motivo || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      proximoContacto: {
                        fecha: formData.proximoContacto?.fecha || "",
                        estado: formData.proximoContacto?.estado || "pendiente",
                        motivo: e.target.value
                      }
                    })}
                    placeholder="Ej: Llamada de seguimiento para revisión de propuesta técnica"
                    className="bg-muted/30 border-none h-12 font-bold rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 03: MEMORIA OPERATIVA (NOTAS RÁPIDAS) */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-3 text-foreground">
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-secondary text-white shadow-lg shadow-secondary/20 text-xs">03</span>
                Memoria Operativa & Historial de Notas
              </h2>
              
              <div className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Select 
                      value={nuevaNotaTipo} 
                      onValueChange={(val) => {
                        if (val) setNuevaNotaTipo(val as "reunion" | "llamada" | "whatsapp" | "acuerdo");
                      }}
                    >
                      <SelectTrigger className="w-36 bg-muted/30 border-none h-10 rounded-xl text-xs font-bold shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="llamada">📞 Llamada</SelectItem>
                        <SelectItem value="reunion">👥 Reunión</SelectItem>
                        <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                        <SelectItem value="acuerdo">🤝 Acuerdo</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input 
                      value={nuevaNotaTexto}
                      onChange={(e) => setNuevaNotaTexto(e.target.value)}
                      placeholder="Escribe una nota rápida de reunión o acuerdo..."
                      className="bg-muted/30 border-none h-10 rounded-xl text-xs font-medium flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateNota();
                        }
                      }}
                    />

                    <Button 
                      type="button"
                      onClick={handleCreateNota}
                      className="h-10 px-4 rounded-xl font-bold text-xs bg-primary text-primary-foreground gap-1.5 shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" /> Agregar
                    </Button>
                  </div>
                </div>

                {/* Feed cronológico de notas */}
                <div className="space-y-2.5 pt-2 max-h-60 overflow-y-auto">
                  {(!formData.historialNotas || formData.historialNotas.length === 0) ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No hay notas registradas para este cliente aún.
                    </p>
                  ) : (
                    formData.historialNotas.map((nota) => (
                      <div 
                        key={nota.id}
                        className="p-3 rounded-xl bg-muted/20 border border-white/5 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {getTipoNotaBadge(nota.tipo)}
                            <span className="font-bold text-foreground">{nota.autorNombre}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {nota.fecha ? new Date(nota.fecha).toLocaleDateString("es-CL") : ""}
                            </span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed pl-1">
                            {nota.texto}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => nota.id && onRemoveNota(nota.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN 04: INFRAESTRUCTURA TÉCNICA Y ACCESOS */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-3 text-foreground">
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-secondary text-white shadow-lg shadow-secondary/20 text-xs">04</span>
                Matriz de Infraestructura Técnica y Accesos
              </h2>

              <div className="space-y-6 p-6 rounded-2xl bg-white/5 border border-white/10">
                {/* Dominio y DNS */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dominio y Proveedor</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        value={formData.infraestructura?.dominio?.nombre || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          infraestructura: {
                            ...formData.infraestructura,
                            dominio: {
                              ...formData.infraestructura?.dominio,
                              nombre: e.target.value
                            }
                          }
                        })}
                        placeholder="ejemplo.cl"
                        className="bg-muted/30 border-none h-11 font-bold rounded-xl text-xs"
                      />
                      <Input 
                        value={formData.infraestructura?.dominio?.proveedor || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          infraestructura: {
                            ...formData.infraestructura,
                            dominio: {
                              ...formData.infraestructura?.dominio,
                              proveedor: e.target.value
                            }
                          }
                        })}
                        placeholder="NIC Chile / GoDaddy"
                        className="bg-muted/30 border-none h-11 font-bold rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hosting / Servidor</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        value={formData.infraestructura?.hosting?.proveedor || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          infraestructura: {
                            ...formData.infraestructura,
                            hosting: {
                              ...formData.infraestructura?.hosting,
                              proveedor: e.target.value
                            }
                          }
                        })}
                        placeholder="Vercel / VPS / cPanel"
                        className="bg-muted/30 border-none h-11 font-bold rounded-xl text-xs"
                      />
                      <Input 
                        value={formData.infraestructura?.dns?.proveedor || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          infraestructura: {
                            ...formData.infraestructura,
                            dns: {
                              ...formData.infraestructura?.dns,
                              proveedor: e.target.value
                            }
                          }
                        })}
                        placeholder="DNS: Cloudflare / AWS"
                        className="bg-muted/30 border-none h-11 font-bold rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Accesos Operativos */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-primary" /> Accesos Operativos Registrados
                  </Label>

                  {/* Inputs para agregar acceso */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <Input 
                      value={nuevoAccesoTipo}
                      onChange={(e) => setNuevoAccesoTipo(e.target.value)}
                      placeholder="Tipo (SSH, cPanel, WP)"
                      className="bg-muted/30 border-none h-10 font-bold rounded-xl text-xs"
                    />
                    <Input 
                      value={nuevoAccesoIdentificador}
                      onChange={(e) => setNuevoAccesoIdentificador(e.target.value)}
                      placeholder="Host / URL / IP"
                      className="bg-muted/30 border-none h-10 font-bold rounded-xl text-xs"
                    />
                    <Input 
                      value={nuevoAccesoUsuario}
                      onChange={(e) => setNuevoAccesoUsuario(e.target.value)}
                      placeholder="Usuario / Login"
                      className="bg-muted/30 border-none h-10 font-bold rounded-xl text-xs"
                    />
                    <div className="flex gap-1.5">
                      <Input 
                        value={nuevoAccesoClave}
                        onChange={(e) => setNuevoAccesoClave(e.target.value)}
                        placeholder="Clave / Notas"
                        className="bg-muted/30 border-none h-10 font-bold rounded-xl text-xs flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleCreateAcceso}
                        className="h-10 px-3 rounded-xl font-bold text-xs bg-primary text-primary-foreground shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Lista de accesos agregados */}
                  <div className="space-y-2 pt-2">
                    {(!formData.infraestructura?.accesos || formData.infraestructura.accesos.length === 0) ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No hay accesos técnicos registrados para este cliente.
                      </p>
                    ) : (
                      formData.infraestructura.accesos.map((acc, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-muted/20 border border-white/5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 truncate">
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {acc.tipo}
                            </Badge>
                            <span className="font-bold text-foreground truncate">{acc.identificador}</span>
                            <span className="text-muted-foreground font-mono">user: {acc.usuario}</span>
                            {acc.claveONotas && (
                              <span className="text-muted-foreground/80 truncate">({acc.claveONotas})</span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveAcceso(idx)}
                            className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-lg shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 05: IDENTIDAD DIGITAL */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-3 text-foreground">
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-secondary text-white shadow-lg shadow-secondary/20 text-xs">05</span>
                Presencia Digital
              </h2>
              <div className="grid gap-4 sm:gap-6">
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instagram</Label>
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
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">LinkedIn</Label>
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
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sitio Web</Label>
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
      <div className="shrink-0 bg-card/90 px-4 sm:px-8 py-4 sm:py-6 border-t border-white/10 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl flex items-center justify-end gap-4">
          <Button 
            onClick={onSave} 
            disabled={isSaving} 
            className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-12 rounded-xl sm:rounded-2xl bg-primary text-primary-foreground font-black text-sm sm:text-base shadow-2xl shadow-primary/20 hover:scale-105 transition-all gap-3"
          >
            <Save className="h-4 w-4 sm:h-5 sm:w-5" /> 
            {isSaving ? "Guardando..." : "Guardar Cliente"}
          </Button>
        </div>
      </div>
    </div>
  );
};
