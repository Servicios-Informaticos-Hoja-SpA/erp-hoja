"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  Circle, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Trash2, 
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChecklistItem, ProyectoTipoServicio } from "@/lib/types";
import { getDefaultChecklist } from "./checklist-templates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChecklistViewProps {
  checklist: ChecklistItem[];
  onChange: (newChecklist: ChecklistItem[]) => void;
  tipoServicio?: ProyectoTipoServicio;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  checklist = [],
  onChange,
  tipoServicio = "desarrollo_web",
}) => {
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("General");

  const completedCount = checklist.filter((item) => item.completada).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggle = (id?: string) => {
    if (!id) return;
    const updated = checklist.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          completada: !item.completada,
          completadaEn: !item.completada ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });
    onChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const items = [...checklist];
    const temp = items[index - 1];
    items[index - 1] = items[index];
    items[index] = temp;
    // Reindexar orden
    const reordered = items.map((it, i) => ({ ...it, orden: i + 1 }));
    onChange(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === checklist.length - 1) return;
    const items = [...checklist];
    const temp = items[index + 1];
    items[index + 1] = items[index];
    items[index] = temp;
    const reordered = items.map((it, i) => ({ ...it, orden: i + 1 }));
    onChange(reordered);
  };

  const handleAdd = () => {
    if (!nuevaTarea.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      orden: checklist.length + 1,
      categoria: nuevaCategoria.trim() || "General",
      titulo: nuevaTarea.trim(),
      completada: false,
    };
    onChange([...checklist, newItem]);
    setNuevaTarea("");
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    const filtered = checklist.filter((item) => item.id !== id);
    const reordered = filtered.map((it, i) => ({ ...it, orden: i + 1 }));
    onChange(reordered);
  };

  const handleLoadTemplate = (tipo: ProyectoTipoServicio) => {
    const templateTasks = getDefaultChecklist(tipo);
    onChange(templateTasks);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Progreso y Acciones de Plantilla */}
      <div className="p-4 rounded-2xl bg-card/60 border border-white/10 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-muted-foreground">Progreso Operativo</span>
            <span className="text-primary">{completedCount} de {totalCount} tareas ({progressPercent}%)</span>
          </div>
          <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select onValueChange={(val) => { if (val) handleLoadTemplate(val as ProyectoTipoServicio); }}>
            <SelectTrigger className="h-9 rounded-xl bg-white/5 border-white/10 text-xs font-bold">
              <SelectValue placeholder="Cargar plantilla..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desarrollo_web">🌐 Desarrollo Web</SelectItem>
              <SelectItem value="soporte_nube">☁️ Soporte Nube / DevOps</SelectItem>
              <SelectItem value="ciberseguridad">🛡️ Ciberseguridad</SelectItem>
              <SelectItem value="inventario_hardware">🖥️ Hardware e Inventario</SelectItem>
              <SelectItem value="consultoria">📋 Consultoría</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleLoadTemplate(tipoServicio)}
            className="h-9 px-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground"
            title="Reiniciar plantilla del tipo de servicio"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Input para agregar tarea */}
      <div className="flex gap-2">
        <Input 
          value={nuevaCategoria}
          onChange={(e) => setNuevaCategoria(e.target.value)}
          placeholder="Etapa / Categoría"
          className="w-36 bg-card/50 border-white/10 h-11 rounded-xl text-xs font-bold shrink-0"
        />
        <Input 
          value={nuevaTarea}
          onChange={(e) => setNuevaTarea(e.target.value)}
          placeholder="Escribe una nueva tarea operativa..."
          className="bg-card/50 border-white/10 h-11 rounded-xl text-xs font-medium flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button
          onClick={handleAdd}
          className="h-11 px-4 rounded-xl bg-primary text-primary-foreground font-black text-xs gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" /> Agregar
        </Button>
      </div>

      {/* Lista de Tareas Reordenables */}
      <div className="space-y-2">
        {checklist.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs font-medium border border-dashed border-white/10 rounded-2xl">
            No hay tareas en el checklist. Puedes cargar una plantilla predefinida o agregar tareas personalizadas.
          </div>
        ) : (
          checklist.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                item.completada
                  ? "bg-emerald-500/5 border-emerald-500/20 text-muted-foreground opacity-80"
                  : "bg-card/50 border-white/10 text-foreground hover:border-primary/40 shadow-sm"
              }`}
            >
              {/* Checkbox y Título */}
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer select-none min-w-0"
                onClick={() => handleToggle(item.id)}
              >
                <button
                  type="button"
                  className="shrink-0 transition-transform active:scale-90"
                >
                  {item.completada ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>

                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] uppercase font-mono px-1.5 py-0">
                      {item.categoria}
                    </Badge>
                    <span className={`text-xs font-bold truncate ${item.completada ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item.titulo}
                    </span>
                  </div>
                  {item.descripcion && (
                    <p className="text-[11px] text-muted-foreground/70 truncate pl-0.5">
                      {item.descripcion}
                    </p>
                  )}
                </div>
              </div>

              {/* Controles de Reordenamiento y Eliminación */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={idx === 0}
                  onClick={() => handleMoveUp(idx)}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg disabled:opacity-20"
                  title="Subir tarea"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={idx === checklist.length - 1}
                  onClick={() => handleMoveDown(idx)}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg disabled:opacity-20"
                  title="Bajar tarea"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                  title="Eliminar tarea"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
