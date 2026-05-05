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
} from "../../components/ui/tooltip";

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
  const filtered = presupuestos.filter(p => 
    p.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.numero.includes(search)
  );

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background px-6 py-12 md:px-[10%] lg:px-[15%] xl:px-[15%]">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()} 
              className="rounded-full bg-muted/50 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground">Presupuestos</h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Cotizaciones y propuestas comerciales</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onLogout}
              className="gap-2 text-muted-foreground hover:text-destructive transition-colors font-bold px-2 sm:px-4"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden xs:inline">Cerrar Sesión</span>
            </Button>
            <Button onClick={onNew} className="gap-2 rounded-2xl px-4 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg font-black shadow-xl shadow-[#abaafd]/20 bg-[#abaafd] text-[#2e3c7e] hover:scale-105 transition-all">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" /> <span className="whitespace-nowrap">Nuevo <span className="hidden xs:inline">Presupuesto</span></span>
            </Button>
          </div>
      </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente o N°..." 
            className="pl-12 py-6 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary shadow-inner text-sm sm:text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse font-medium">Sincronizando con la nube...</div>
          ) : filtered.map(p => (
            <Card key={p.id} className="group overflow-hidden border-none shadow-md transition-all hover:shadow-xl hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#abaafd]/10 text-[#abaafd] group-hover:bg-[#abaafd] group-hover:text-white transition-colors">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] sm:text-xs font-black text-primary/40 uppercase tracking-widest">N° {p.numero}</span>
                        {p.version && p.version > 1 && (
                          <Badge variant="secondary" className="text-[8px] sm:text-[9px] uppercase h-3 sm:h-4 px-1 sm:px-1.5 bg-primary/5 text-primary border-none">v{p.version}</Badge>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight truncate">{p.cliente_nombre}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[10px] sm:text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> 
                          {p.fecha ? (typeof p.fecha === 'object' && 'seconds' in p.fecha 
                            ? new Date((p.fecha as any).seconds * 1000).toLocaleDateString() 
                            : new Date(p.fecha as any).toLocaleDateString()) : '---'}
                        </span>
                        <span className="font-bold text-primary">{formatCurrency(p.totales.total)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:gap-2 justify-end sm:justify-start border-t sm:border-none pt-3 sm:pt-0 border-muted/20">
                    <Tooltip>
                      <TooltipTrigger render={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onView(p)}
                          className="rounded-full bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all flex-1 sm:flex-none"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      } />
                      <TooltipContent>Visualizar PDF</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger render={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDownload(p)}
                          className="rounded-full bg-muted/30 hover:bg-secondary/10 hover:text-secondary transition-all flex-1 sm:flex-none"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      } />
                      <TooltipContent>Descargar PDF</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger render={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onEdit(p.id!)}
                          className="rounded-full bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all flex-1 sm:flex-none"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      } />
                      <TooltipContent>Editar rápido</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="py-20 text-center text-muted-foreground italic">No se encontraron presupuestos.</div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
