"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  FileText, 
  Edit3, 
  Calendar, 
  Eye,
  Download,
  ArrowLeft,
  LogOut
} from "lucide-react";
import { Presupuesto } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

interface PresupuestoListViewProps {
  presupuestos: Presupuesto[];
  search: string;
  setSearch: (val: string) => void;
  onNew: () => void;
  onEdit: (id: string) => void;
  onView: (p: Presupuesto) => void;
  onDownload: (p: Presupuesto) => void;
  onLogout: () => void;
  loading: boolean;
}

export const PresupuestoListView: React.FC<PresupuestoListViewProps> = ({
  presupuestos,
  search,
  setSearch,
  onNew,
  onEdit,
  onView,
  onDownload,
  onLogout,
  loading
}) => {
  const router = useRouter();
  const filtered = presupuestos.filter(p => 
    p.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.numero.includes(search)
  );

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background px-4 py-8 sm:px-6 sm:py-12 md:px-[10%] lg:px-[15%]">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/')} 
              className="rounded-full bg-muted/50 shrink-0 h-10 w-10 sm:h-12 sm:w-12"
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tighter text-foreground">Presupuestos</h1>
              <p className="text-[10px] sm:text-sm text-muted-foreground font-medium">Cotizaciones y propuestas comerciales</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onLogout}
              className="gap-2 text-muted-foreground hover:text-destructive transition-colors font-bold px-3 h-10"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
            <Button onClick={onNew} className="gap-2 rounded-xl sm:rounded-2xl px-4 sm:px-8 h-10 sm:h-14 text-sm sm:text-lg font-black shadow-xl shadow-secondary/10 bg-secondary text-white hover:scale-105 transition-all">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" /> <span>Nuevo</span>
            </Button>
          </div>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente o N°..." 
            className="pl-12 h-12 rounded-xl sm:rounded-2xl bg-muted/30 border-none focus-visible:ring-secondary/20 shadow-inner text-sm sm:text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse font-medium">Sincronizando con la nube...</div>
          ) : (
            filtered.map(p => (
              <Card key={p.id} className="group overflow-hidden border-none shadow-md transition-all hover:shadow-xl hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-6">
                    {/* Lado Izquierdo: Info Principal */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/5 text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-sm">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">N° {p.numero}</span>
                          {p.version && p.version > 1 && (
                            <Badge className="text-[9px] uppercase h-4 px-1.5 bg-secondary text-white border-none rounded-md">v{p.version}</Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-black text-secondary leading-tight truncate">{p.cliente_nombre}</h3>
                        {p.descripcion_proyecto && (
                          <p className="text-xs font-semibold text-muted-foreground/80 truncate">{p.descripcion_proyecto}</p>
                        )}
                        <div className="flex items-center gap-2 pt-1 text-[10px] font-bold text-muted-foreground/60">
                          <Calendar className="h-3 w-3" /> 
                          <span>
                            {p.fecha ? (typeof p.fecha === 'object' && 'seconds' in p.fecha 
                              ? new Date((p.fecha as any).seconds * 1000).toLocaleDateString() 
                              : new Date(p.fecha as any).toLocaleDateString()) : '---'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lado Derecho: Precio y Acciones */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:gap-3 border-t sm:border-none pt-4 sm:pt-0 border-muted/10">
                      <div className="flex flex-col sm:items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary/30 leading-none mb-1">Total Proyecto</span>
                        <span className="text-2xl font-black text-secondary tracking-tighter leading-none">{formatCurrency(p.totales.total)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger
                            onClick={(e) => { e.stopPropagation(); onView(p); }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 hover:bg-secondary hover:text-white transition-all shadow-sm cursor-pointer text-secondary"
                          >
                            <Eye className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>Ver PDF</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            onClick={(e) => { e.stopPropagation(); onDownload(p); }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 hover:bg-secondary hover:text-white transition-all shadow-sm cursor-pointer text-secondary"
                          >
                            <Download className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>Descargar</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            onClick={(e) => { e.stopPropagation(); onEdit(p.id!); }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 hover:bg-secondary hover:text-white transition-all shadow-sm cursor-pointer text-secondary"
                          >
                            <Edit3 className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-20 text-center text-muted-foreground italic">No se encontraron presupuestos.</div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
