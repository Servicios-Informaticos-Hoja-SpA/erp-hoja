"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Server, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  Edit3, 
  Trash2, 
  ExternalLink,
  MessageSquare,
  DollarSign,
  Globe,
  Mail,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Subscription, 
  Cliente, 
  EstadoSuscripcion 
} from "@/lib/types";

interface SubscriptionsListViewProps {
  subscriptions: Subscription[];
  clientes: Cliente[];
  loading: boolean;
  onNew: () => void;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onRenovar: (id: string) => Promise<void>;
  onSendWhatsApp: (sub: Subscription, tipo: "preventivo" | "vencido") => void;
}

export function SubscriptionsListView({
  subscriptions,
  clientes,
  loading,
  onNew,
  onEdit,
  onDelete,
  onRenovar,
  onSendWhatsApp,
}: SubscriptionsListViewProps) {
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [renewingId, setRenewingId] = useState<string | null>(null);

  // Filtrado
  const filtered = subscriptions.filter((sub) => {
    const matchesSearch = 
      sub.dominio.toLowerCase().includes(search.toLowerCase()) ||
      sub.clienteNombre.toLowerCase().includes(search.toLowerCase()) ||
      sub.tipoServicio.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterEstado === "todos") return true;
    return sub.estado === filterEstado;
  });

  // Métricas
  const porVencerCount = subscriptions.filter((s) => s.estado === "por_vencer").length;
  const vencidosCount = subscriptions.filter((s) => s.estado === "vencido").length;
  const activosCount = subscriptions.filter((s) => s.estado === "activo").length;

  const totalCLP = subscriptions
    .filter((s) => s.estado === "activo" || s.estado === "por_vencer")
    .reduce((acc, s) => {
      if (s.moneda === "CLP") {
        return acc + (s.cicloFacturacion === "anual" ? Math.round(s.monto / 12) : s.monto);
      }
      return acc;
    }, 0);

  const totalUF = subscriptions
    .filter((s) => s.estado === "activo" || s.estado === "por_vencer")
    .reduce((acc, s) => {
      if (s.moneda === "UF") {
        return acc + (s.cicloFacturacion === "anual" ? s.monto / 12 : s.monto);
      }
      return acc;
    }, 0);

  const handleRenovarClick = async (id: string) => {
    try {
      setRenewingId(id);
      await onRenovar(id);
    } finally {
      setRenewingId(null);
    }
  };

  const getEstadoBadge = (estado: EstadoSuscripcion, diasRestantes?: number) => {
    switch (estado) {
      case "vencido":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Vencido ({diasRestantes !== undefined ? `${Math.abs(diasRestantes)}d expirado` : "Corte"})
          </span>
        );
      case "por_vencer":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Por Vencer ({diasRestantes !== undefined ? `${diasRestantes}d restantes` : "<= 7 días"})
          </span>
        );
      case "activo":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Activo {diasRestantes !== undefined && diasRestantes > 0 ? `(${diasRestantes}d)` : ""}
          </span>
        );
      case "suspendido":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-700/50 text-slate-400 border border-slate-600">
            Suspendido
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acción Crear */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <Server className="w-7 h-7 text-indigo-400" />
            Servicios Recurrentes & Hosting
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Gestión de suscripciones, cuentas cPanel (Bluehosting), Vercel y cobranza preventiva por WhatsApp.
          </p>
        </div>

        <Button
          onClick={onNew}
          className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2 shadow-lg shadow-indigo-600/25"
        >
          <Plus className="w-4 h-4" />
          Nueva Suscripción / Hosting
        </Button>
      </div>

      {/* Tarjetas de Métricas de Ingresos Recurrentes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-white/15">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Piso Recurrente (MRR Proyectado)</span>
            <div className="text-xl font-mono font-black text-emerald-400">
              ${totalCLP.toLocaleString("es-CL")} <span className="text-xs text-slate-400 font-sans">CLP/mes</span>
            </div>
            {totalUF > 0 && (
              <p className="text-xs text-slate-400 font-mono font-bold">
                + {totalUF.toFixed(2)} UF/mes
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-white/15">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">Por Vencer (≤ 7 días)</span>
            <div className="text-2xl font-mono font-black text-amber-300">
              {porVencerCount}
            </div>
            <p className="text-xs text-slate-400">Servicios que requieren recordatorio</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/15">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-rose-400">Vencidos / Acción Urgente</span>
            <div className="text-2xl font-mono font-black text-rose-300">
              {vencidosCount}
            </div>
            <p className="text-xs text-slate-400">Riesgo inminente de suspensión</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/15">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400">Servicios Activos</span>
            <div className="text-2xl font-mono font-black text-indigo-300">
              {activosCount}
            </div>
            <p className="text-xs text-slate-400">Cuentas activas en producción</p>
          </CardContent>
        </Card>
      </div>

      {/* Buscador y Pastillas de Filtro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por dominio o cliente..."
            className="pl-10 h-10 rounded-xl bg-card border-white/15 text-foreground placeholder:text-slate-500 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterEstado("todos")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              filterEstado === "todos"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border border-white/15 text-slate-300 hover:bg-white/5"
            }`}
          >
            Todos ({subscriptions.length})
          </button>
          <button
            onClick={() => setFilterEstado("por_vencer")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              filterEstado === "por_vencer"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Por Vencer ({porVencerCount})
          </button>
          <button
            onClick={() => setFilterEstado("vencido")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              filterEstado === "vencido"
                ? "bg-rose-500 text-white shadow-md"
                : "bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Vencidos ({vencidosCount})
          </button>
          <button
            onClick={() => setFilterEstado("activo")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              filterEstado === "activo"
                ? "bg-emerald-500 text-white shadow-md"
                : "bg-card border border-white/15 text-slate-300 hover:bg-white/5"
            }`}
          >
            Activos ({activosCount})
          </button>
        </div>
      </div>

      {/* Lista de Suscripciones */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-card/60 animate-pulse border border-white/10" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-white/15 text-center p-12">
          <Server className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-black text-white">No se encontraron servicios</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? "No hay servicios que coincidan con la búsqueda." : "Aún no registras servicios recurrentes o suscripciones."}
          </p>
          <Button onClick={onNew} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold">
            Agregar Primer Servicio
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((sub) => {
            const cliente = clientes.find((c) => c.id === sub.clienteId);
            const fechaCorteFormatted = sub.fechaCorte ? new Date(sub.fechaCorte).toLocaleDateString("es-CL") : "---";

            return (
              <Card 
                key={sub.id} 
                className={`bg-card transition-all border ${
                  sub.estado === "vencido"
                    ? "border-rose-500/40 bg-rose-950/10 shadow-lg shadow-rose-950/20"
                    : sub.estado === "por_vencer"
                      ? "border-amber-500/40 bg-amber-950/10 shadow-lg shadow-amber-950/20"
                      : "border-white/15 hover:border-white/30"
                }`}
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Fila superior: Dominio, Tipo y Estado */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-indigo-400" />
                        <span className="text-lg font-black font-mono text-white tracking-tight">
                          {sub.dominio}
                        </span>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white/10 text-slate-200 border border-white/10">
                        {sub.tipoServicio}
                      </span>

                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                        {sub.proveedor}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {getEstadoBadge(sub.estado, sub.diasRestantes)}
                      <div className="text-right">
                        <span className="text-base font-black font-mono text-emerald-400">
                          {sub.moneda === "UF" 
                            ? `${sub.monto.toLocaleString("es-CL", { minimumFractionDigits: 1 })} UF` 
                            : `$${sub.monto.toLocaleString("es-CL")} CLP`}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          /{sub.cicloFacturacion}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fila intermedia: Cliente, Fechas y Notas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente Titular</span>
                      <p className="font-bold text-white text-sm mt-0.5">{sub.clienteNombre}</p>
                      {cliente?.telefono && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Tel: {cliente.telefono}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Próxima Fecha de Corte</span>
                      <div className="flex items-center gap-1.5 mt-0.5 font-bold text-white text-sm">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span>{fechaCorteFormatted}</span>
                      </div>
                      {sub.diasRestantes !== undefined && (
                        <p className={`text-[11px] font-semibold mt-0.5 ${
                          sub.diasRestantes < 0 
                            ? "text-rose-400 font-black" 
                            : sub.diasRestantes <= 7 
                              ? "text-amber-400 font-black" 
                              : "text-slate-400"
                        }`}>
                          {sub.diasRestantes < 0 
                            ? `Expiró hace ${Math.abs(sub.diasRestantes)} días` 
                            : sub.diasRestantes === 0 
                              ? "Vence hoy" 
                              : `Quedan ${sub.diasRestantes} días`}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Observaciones</span>
                      <p className="text-slate-300 mt-0.5 italic">
                        {sub.notas || "Sin observaciones específicas."}
                      </p>
                    </div>
                  </div>

                  {/* Fila inferior: Botones de Acción y WhatsApp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Botón WhatsApp Preventivo */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSendWhatsApp(sub, "preventivo")}
                        className="h-9 px-3 text-xs font-bold rounded-xl border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 gap-1.5"
                        title="Enviar mensaje preventivo 7 días antes"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>WhatsApp Preventivo</span>
                      </Button>

                      {/* Botón WhatsApp Alerta Suspensión */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSendWhatsApp(sub, "vencido")}
                        className="h-9 px-3 text-xs font-bold rounded-xl border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 gap-1.5"
                        title="Enviar alerta por servicio vencido / riesgo de corte"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        <span>Alerta Suspensión WhatsApp</span>
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Renovar Período */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={renewingId === sub.id}
                        onClick={() => handleRenovarClick(sub.id!)}
                        className="h-9 px-3 text-xs font-bold rounded-xl border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 gap-1.5"
                        title="Renovar servicio por un nuevo ciclo (+1 mes o +1 año)"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${renewingId === sub.id ? "animate-spin" : ""}`} />
                        <span>Renovar Ciclo</span>
                      </Button>

                      {/* Editar */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(sub)}
                        className="h-9 px-3 text-xs font-bold rounded-xl border-white/15 bg-card hover:bg-muted text-slate-300 gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-primary" />
                        <span>Editar</span>
                      </Button>

                      {/* Eliminar */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(sub.id!)}
                        className="h-9 px-2.5 text-xs font-bold rounded-xl text-rose-400 hover:bg-rose-500/10"
                        title="Eliminar suscripción"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
