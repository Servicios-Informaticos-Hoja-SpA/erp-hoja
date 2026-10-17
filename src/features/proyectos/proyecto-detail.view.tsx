"use client";

import React, { useState } from "react";
import { 
  Proyecto, 
  ProyectoFase 
} from "@/lib/types";
import { 
  ArrowLeft, 
  Save, 
  Building2, 
  Layers, 
  Kanban, 
  Calendar, 
  Key, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RotateCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { FaseInformacion } from "./components/fase-informacion";
import { FaseEjecucion } from "./components/fase-ejecucion";
import { FaseCalidad } from "./components/fase-calidad";
import { FaseCredenciales } from "./components/fase-credenciales";
import { FaseDocumentos } from "./components/fase-documentos";

interface ProyectoDetailViewProps {
  proyecto: Proyecto;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
  onSave: () => Promise<void>;
  isSaving: boolean;
  onClose?: () => void;
}

const TABS = [
  { id: "fase1", label: "Información & Alcance", icon: Building2 },
  { id: "fase2", label: "Ejecución & Cambios", icon: Kanban },
  { id: "fase3", label: "Calidad & Cierre", icon: Calendar },
  { id: "fase4", label: "Credenciales & Garantía", icon: Key },
  { id: "fase5", label: "Documentos & Pendientes (ISO 9001)", icon: FileText },
] as const;

type TabId = typeof TABS[number]["id"];

export const ProyectoDetailView: React.FC<ProyectoDetailViewProps> = ({
  proyecto,
  setProyecto,
  onSave,
  isSaving,
  onClose,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("fase1");

  const formatCLP = (val: number = 0) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/proyectos");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER PRINCIPAL DEL PROYECTO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-lg bg-card border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="space-y-2">
          {/* Botón Volver */}
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a la Lista de Proyectos
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {proyecto.nombre}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              {proyecto.clienteNombre}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
            <span>Servicio: <strong className="text-slate-200 capitalize">{proyecto.tipoServicio?.replace(/_/g, " ")}</strong></span>
            <span>•</span>
            <span>Total: <strong className="font-mono text-emerald-400 font-bold">{formatCLP(proyecto.montos?.total)} CLP</strong></span>
            <span>•</span>
            <span>Entrega: <strong className="font-mono text-amber-300">{proyecto.fechaEntregaComprometida || "A convenir"}</strong></span>
          </div>
        </div>

        {/* Acciones del Header */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Selector Rápido de Fase */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fase Operativa</span>
            <Select
              value={proyecto.fase}
              onValueChange={(val) => setProyecto((prev) => prev ? { ...prev, fase: val as ProyectoFase } : null)}
            >
              <SelectTrigger className="h-8.5 text-xs bg-slate-900 border-white/15 text-white font-bold rounded-md min-w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/15 text-white">
                <SelectItem value="planificacion" className="text-xs text-amber-300">Planificación</SelectItem>
                <SelectItem value="desarrollo" className="text-xs text-blue-300">En Desarrollo</SelectItem>
                <SelectItem value="revision_qa" className="text-xs text-purple-300">Revisión / QA</SelectItem>
                <SelectItem value="entregado" className="text-xs text-emerald-300">Entregado</SelectItem>
                <SelectItem value="pausado" className="text-xs text-slate-400">Pausado</SelectItem>
                <SelectItem value="cancelado" className="text-xs text-rose-400">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botón Guardar Cambios */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block opacity-0">Acción</span>
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="h-8.5 px-4 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* SUB-MENÚ DE PESTAÑAS PARA CADA ETAPA */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/10">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-500"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO SEGÚN LA PESTAÑA ACTIVA */}
      {activeTab === "fase1" && (
        <FaseInformacion
          proyecto={proyecto}
          setProyecto={setProyecto}
          onSave={onSave}
          isSaving={isSaving}
        />
      )}

      {activeTab === "fase2" && (
        <FaseEjecucion
          proyecto={proyecto}
          setProyecto={setProyecto}
          onSave={onSave}
          isSaving={isSaving}
        />
      )}

      {activeTab === "fase3" && (
        <FaseCalidad
          proyecto={proyecto}
          setProyecto={setProyecto}
          onSave={onSave}
          isSaving={isSaving}
        />
      )}

      {activeTab === "fase4" && (
        <FaseCredenciales
          proyecto={proyecto}
          setProyecto={setProyecto}
          onSave={onSave}
          isSaving={isSaving}
        />
      )}

      {activeTab === "fase5" && (
        <FaseDocumentos
          proyecto={proyecto}
          setProyecto={setProyecto}
          onSave={onSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
