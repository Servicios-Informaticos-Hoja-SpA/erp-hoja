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
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()} 
              className="rounded-full bg-muted/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-foreground">Presupuestos</h1>
              <p className="text-sm text-muted-foreground font-medium">Cotizaciones y propuestas comerciales</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={onLogout}
              className="gap-2 text-muted-foreground hover:text-destructive transition-colors font-bold"
            >
              <LogOut className="h-4 w-4" /> Cerrar Sesión
            </Button>
            <Button onClick={onNew} className="gap-2 rounded-2xl px-8 py-6 text-lg font-black shadow-xl shadow-[#abaafd]/20 bg-[#abaafd] text-[#2e3c7e] hover:scale-105 transition-all">
              <Plus className="h-5 w-5" /> Nuevo Presupuesto
            </Button>
          </div>
      </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente o N°..." 
            className="pl-12 py-6 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse font-medium">Sincronizando con la nube...</div>
          ) : filtered.map(p => (
            <Card key={p.id} className="group overflow-hidden border-none shadow-md transition-all hover:shadow-xl hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#abaafd]/10 text-[#abaafd] group-hover:bg-[#abaafd] group-hover:text-white transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-primary/40 uppercase tracking-widest">N° {p.numero}</span>
                        {p.version && p.version > 1 && (
                          <Badge variant="secondary" className="text-[9px] uppercase h-4 px-1.5 bg-primary/5 text-primary border-none">v{p.version}</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-foreground leading-tight">{p.cliente_nombre}</h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground font-medium">
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
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger render={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onView(p)}
                          className="rounded-full bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all"
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
                          className="rounded-full bg-muted/30 hover:bg-secondary/10 hover:text-secondary transition-all"
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
                          className="rounded-full bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all"
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
