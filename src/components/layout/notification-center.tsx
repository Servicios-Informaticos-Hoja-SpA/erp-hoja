"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Briefcase, 
  DollarSign, 
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  CheckCheck,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertaOperativa } from "@/lib/types";
import { getAlertasGlobales } from "@/lib/services";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const NotificationCenter: React.FC = () => {
  const router = useRouter();
  const [alertas, setAlertas] = useState<AlertaOperativa[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("todas");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sihoja_dismissed_alert_ids");
      if (saved) {
        setDismissedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const data = await getAlertasGlobales();
      setAlertas(data);
    } catch (err) {
      console.error("Error al cargar alertas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAlertas = () => {
    const allIds = alertas.map((a) => a.id);
    const nextDismissed = Array.from(new Set([...dismissedIds, ...allIds]));
    setDismissedIds(nextDismissed);
    localStorage.setItem("sihoja_dismissed_alert_ids", JSON.stringify(nextDismissed));
    toast.success("Todas las alertas han sido reseteadas");
  };

  const handleRestoreAlertas = () => {
    setDismissedIds([]);
    localStorage.removeItem("sihoja_dismissed_alert_ids");
    toast.info("Historial de alertas restaurado");
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await getAlertasGlobales();
        if (isMounted) setAlertas(data);
      } catch (err) {
        console.error("Error al cargar alertas:", err);
      }
    };

    load();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        load();
      }
    }, 120000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeAlertas = useMemo(
    () => alertas.filter((a) => !dismissedIds.includes(a.id)),
    [alertas, dismissedIds]
  );

  const filteredAlertas = useMemo(
    () =>
      activeAlertas.filter((a) => {
        if (selectedFilter === "todas") return true;
        return a.tipo === selectedFilter;
      }),
    [activeAlertas, selectedFilter]
  );

  const unreadCount = activeAlertas.length;
  const highPriorityCount = activeAlertas.filter(a => a.prioridad === "alta").length;

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "cliente":
        return <Calendar className="h-4 w-4 text-sky-400" />;
      case "presupuesto":
        return <FileText className="h-4 w-4 text-amber-400" />;
      case "proyecto":
        return <Briefcase className="h-4 w-4 text-purple-400" />;
      case "flujo_caja":
        return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case "suscripcion":
        return <RefreshCw className="h-4 w-4 text-indigo-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-rose-400" />;
    }
  };

  const handleActionClick = (url?: string) => {
    if (!url) return;
    setOpen(false);
    router.push(url);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger 
        className="relative flex items-center justify-center rounded-xl h-10 w-10 hover:bg-white/10 text-foreground transition-all cursor-pointer"
        title="Centro de Alertas y Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-md shadow-rose-500/50 animate-pulse">
            {unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] sm:w-[420px] p-0 border border-white/10 bg-card/95 backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* Header con botón para Resetear Alertas */}
        <div className="p-4 bg-muted/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-black tracking-tight text-foreground">
                Alertas Operativas
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium">
                {unreadCount} pendiente(s) &bull; {highPriorityCount} urgentes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {activeAlertas.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetAlertas}
                className="h-7 px-2 text-[10px] font-bold rounded-lg hover:bg-emerald-500/15 text-emerald-400 gap-1"
                title="Resetear todas las alertas"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Resetear
              </Button>
            )}
            {dismissedIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestoreAlertas}
                className="h-7 px-2 text-[10px] font-bold rounded-lg hover:bg-white/10 text-muted-foreground gap-1"
                title="Restaurar alertas"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleManualRefresh}
              disabled={loading}
              className="h-7 w-7 rounded-lg hover:bg-white/10 text-muted-foreground"
              title="Actualizar alertas"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="flex items-center gap-1 p-2 bg-muted/20 border-b border-white/5 overflow-x-auto text-[11px]">
          <button
            onClick={() => setSelectedFilter("todas")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedFilter === "todas"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            Todas ({activeAlertas.length})
          </button>
          <button
            onClick={() => setSelectedFilter("cliente")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedFilter === "cliente"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            Clientes
          </button>
          <button
            onClick={() => setSelectedFilter("presupuesto")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedFilter === "presupuesto"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            Cotizaciones
          </button>
          <button
            onClick={() => setSelectedFilter("proyecto")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedFilter === "proyecto"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            Proyectos
          </button>
          <button
            onClick={() => setSelectedFilter("flujo_caja")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedFilter === "flujo_caja"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            Cobros
          </button>
          <button
            onClick={() => setSelectedFilter("suscripcion")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedFilter === "suscripcion"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            Suscripciones
          </button>
        </div>

        {/* Lista de Alertas */}
        <ScrollArea className="h-[360px] p-3">
          {filteredAlertas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 opacity-60" />
              <p className="text-xs font-bold text-foreground">¡Todo al día!</p>
              <p className="text-[11px] text-muted-foreground">
                No tienes alertas pendientes en esta categoría.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAlertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`p-3 rounded-xl border transition-all text-xs flex flex-col gap-2 ${
                    alerta.prioridad === "alta"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-100"
                      : "bg-muted/30 border-white/10 text-foreground"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-background/50 border border-white/10">
                        {getTipoIcon(alerta.tipo)}
                      </span>
                      <span className="font-black text-xs leading-snug">
                        {alerta.titulo}
                      </span>
                    </div>
                    {alerta.prioridad === "alta" && (
                      <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 uppercase font-black">
                        Urgente
                      </Badge>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed pl-8">
                    {alerta.descripcion}
                  </p>

                  {/* Acciones */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 pl-8">
                    <span className="text-[10px] text-muted-foreground/70 font-mono">
                      {alerta.fechaRef || "Hoy"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {alerta.telefonoWhatsApp && (
                        <WhatsAppButton
                          telefono={alerta.telefonoWhatsApp}
                          clienteNombre={alerta.titulo.split(":")[1]?.trim() || "Cliente"}
                          contexto={{
                            tipo: alerta.tipo === "presupuesto" ? "presupuesto" : "seguimiento",
                            motivo: alerta.descripcion
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                        />
                      )}
                      {alerta.enlaceAccion && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleActionClick(alerta.enlaceAccion)}
                          className="h-7 text-[10px] font-bold rounded-lg px-2.5 gap-1 bg-white/10 hover:bg-white/20 text-foreground"
                        >
                          {alerta.textoAccion || "Ver"}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
