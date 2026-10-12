"use client";

import React, { useState } from "react";
import { 
  Briefcase, 
  CheckCircle2, 
  DollarSign, 
  FileText, 
  Save, 
  X,
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
import { Proyecto, ProyectoFase, ProyectoTipoServicio, DocumentoOperativo } from "@/lib/types";
import { ChecklistView } from "./checklist.view";
import { HitosPagoView } from "./hitos-pago.view";
import { DocumentoGenerator } from "./documentos/documento-generator";

interface ProyectoDetailViewProps {
  proyecto: Proyecto;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
  documentos: DocumentoOperativo[];
  onSave: () => Promise<void>;
  onSaveDocumento: (doc: Partial<DocumentoOperativo>) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
}

export const ProyectoDetailView: React.FC<ProyectoDetailViewProps> = ({
  proyecto,
  setProyecto,
  documentos,
  onSave,
  onSaveDocumento,
  onClose,
  isSaving,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "checklist" | "hitos" | "documentos">("general");

  const formatCLP = (val: number = 0) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

  const completedTasks = (proyecto.checklist || []).filter(c => c.completada).length;
  const totalTasks = (proyecto.checklist || []).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      
      {/* Header del Proyecto */}
      <div className="p-6 bg-card border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary font-black shadow-lg">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
                {proyecto.nombre}
              </h2>
              <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase">
                {proyecto.fase}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Cliente: <strong className="text-foreground">{proyecto.clienteNombre}</strong>
              {proyecto.presupuestoNumero && ` &bull; Cotización N° ${proyecto.presupuestoNumero}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="rounded-xl bg-primary text-primary-foreground font-black text-xs h-10 px-4 shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-1.5"
          >
            <Save className="h-4 w-4" /> {isSaving ? "Guardando..." : "Guardar Proyecto"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-xl h-10 w-10 hover:bg-white/10 text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Tabs de Navegación del Proyecto */}
      <div className="flex items-center gap-2 px-6 pt-3 pb-1 border-b border-white/10 bg-muted/20 overflow-x-auto text-xs font-bold shrink-0">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === "general"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-white/5"
          }`}
        >
          <Sparkles className="h-4 w-4" /> Visión General
        </button>

        <button
          onClick={() => setActiveTab("checklist")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === "checklist"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-white/5"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" /> Checklist ({completedTasks}/{totalTasks})
        </button>

        <button
          onClick={() => setActiveTab("hitos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === "hitos"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-white/5"
          }`}
        >
          <DollarSign className="h-4 w-4" /> Hitos de Pago
        </button>

        <button
          onClick={() => setActiveTab("documentos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === "documentos"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-white/5"
          }`}
        >
          <FileText className="h-4 w-4" /> Actas y Documentos ({documentos.length})
        </button>
      </div>

      {/* Área con Scroll para Contenido de Tabs */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* TAB 1: VISIÓN GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-6">
              
              {/* Barra de Progreso */}
              <div className="p-6 rounded-2xl bg-card/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Progreso Técnico del Proyecto</span>
                  <span className="text-primary">{progressPercent}% completado</span>
                </div>
                <div className="h-3 w-full bg-muted/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Parámetros del Proyecto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-card/60 border border-white/10">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Nombre del Proyecto
                  </Label>
                  <Input 
                    value={proyecto.nombre}
                    onChange={(e) => setProyecto({ ...proyecto, nombre: e.target.value })}
                    className="bg-muted/40 border-white/10 h-11 rounded-xl text-sm font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Fase Operativa
                  </Label>
                  <Select
                    value={proyecto.fase}
                    onValueChange={(val) => {
                      if (val) setProyecto({ ...proyecto, fase: val as ProyectoFase });
                    }}
                  >
                    <SelectTrigger className="bg-muted/40 border-white/10 h-11 rounded-xl text-sm font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planificacion">📋 Planificación</SelectItem>
                      <SelectItem value="desarrollo">💻 En Desarrollo</SelectItem>
                      <SelectItem value="revision_qa">🔍 En Revisión / QA</SelectItem>
                      <SelectItem value="entregado">✅ Entregado / Finalizado</SelectItem>
                      <SelectItem value="pausado">⏸️ Pausado</SelectItem>
                      <SelectItem value="cancelado">❌ Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Tipo de Servicio
                  </Label>
                  <Select
                    value={proyecto.tipoServicio}
                    onValueChange={(val) => {
                      if (val) setProyecto({ ...proyecto, tipoServicio: val as ProyectoTipoServicio });
                    }}
                  >
                    <SelectTrigger className="bg-muted/40 border-white/10 h-11 rounded-xl text-sm font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desarrollo_web">🌐 Desarrollo Web</SelectItem>
                      <SelectItem value="soporte_nube">☁️ Soporte Nube / DevOps</SelectItem>
                      <SelectItem value="ciberseguridad">🛡️ Ciberseguridad</SelectItem>
                      <SelectItem value="inventario_hardware">🖥️ Inventario y Hardware</SelectItem>
                      <SelectItem value="consultoria">📋 Consultoría</SelectItem>
                      <SelectItem value="otro">⚙️ Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Fecha de Inicio
                    </Label>
                    <Input 
                      type="date"
                      value={proyecto.fechaInicio || ""}
                      onChange={(e) => setProyecto({ ...proyecto, fechaInicio: e.target.value })}
                      className="bg-muted/40 border-white/10 h-11 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Fecha Entrega Límite
                    </Label>
                    <Input 
                      type="date"
                      value={proyecto.fechaEntregaComprometida || ""}
                      onChange={(e) => setProyecto({ ...proyecto, fechaEntregaComprometida: e.target.value })}
                      className="bg-muted/40 border-white/10 h-11 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Alcance y Descripción
                  </Label>
                  <Textarea 
                    value={proyecto.descripcion || ""}
                    onChange={(e) => setProyecto({ ...proyecto, descripcion: e.target.value })}
                    rows={3}
                    placeholder="Descripción técnica y alcance convenido..."
                    className="bg-muted/40 border-white/10 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Resumen de Montos Pactados */}
              <div className="p-6 rounded-2xl bg-card/60 border border-white/10 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Valores Pactados
                </span>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-[9px] text-muted-foreground uppercase font-black block">Neto</span>
                    <span className="text-base font-black text-foreground">{formatCLP(proyecto.montos?.neto)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-[9px] text-muted-foreground uppercase font-black block">IVA (19%)</span>
                    <span className="text-base font-black text-foreground">{formatCLP(proyecto.montos?.iva)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="text-[9px] text-primary uppercase font-black block">Total</span>
                    <span className="text-base font-black text-primary">{formatCLP(proyecto.montos?.total)}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CHECKLIST */}
          {activeTab === "checklist" && (
            <ChecklistView 
              checklist={proyecto.checklist || []}
              onChange={(newChecklist) => {
                const completed = newChecklist.filter(c => c.completada).length;
                const total = newChecklist.length;
                const newPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
                setProyecto({
                  ...proyecto,
                  checklist: newChecklist,
                  progresoPorcentaje: newPercent,
                });
              }}
              tipoServicio={proyecto.tipoServicio}
            />
          )}

          {/* TAB 3: HITOS DE PAGO */}
          {activeTab === "hitos" && (
            <HitosPagoView 
              hitosPago={proyecto.hitosPago || []}
              montoTotal={proyecto.montos?.total || 0}
              onChange={(newHitos) => {
                setProyecto({
                  ...proyecto,
                  hitosPago: newHitos,
                });
              }}
            />
          )}

          {/* TAB 4: ACTAS Y DOCUMENTOS */}
          {activeTab === "documentos" && (
            <DocumentoGenerator 
              proyecto={proyecto}
              documentos={documentos}
              onSaveDocumento={onSaveDocumento}
            />
          )}

        </div>
      </div>
    </div>
  );
};
