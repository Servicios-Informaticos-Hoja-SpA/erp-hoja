"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Send, 
  ExternalLink, 
  Sparkles, 
  Server, 
  AlertCircle,
  Building,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Presupuesto, ConfiguracionGlobal } from "@/lib/types";

export default function PropuestaPublicaPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [config, setConfig] = useState<ConfiguracionGlobal | null>(null);
  const [aceptando, setAceptando] = useState(false);
  const [aceptada, setAceptada] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchPropuesta = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/propuesta/${token}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("La propuesta solicitada no existe o el enlace ha caducado.");
          }
          throw new Error("Error al cargar la propuesta.");
        }
        const data = await res.json();
        setPresupuesto(data.presupuesto);
        setConfig(data.configuracion);
        if (data.presupuesto.estado === "aprobado") {
          setAceptada(true);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchPropuesta();
  }, [token]);

  const handleAceptar = async () => {
    if (!presupuesto || aceptando) return;

    try {
      setAceptando(true);
      const res = await fetch(`/api/propuesta/${token}/aceptar`, {
        method: "POST"
      });

      if (!res.ok) {
        throw new Error("No se pudo registrar la aceptación");
      }

      setAceptada(true);

      // Abrir WhatsApp directo con la empresa
      const telefonoEmpresa = "56954169597";
      const mensaje = `Hola Servicios Informáticos Hoja SpA! He revisado y aceptado la propuesta N° ${presupuesto.numero} para ${presupuesto.nombre_proyecto || presupuesto.cliente_nombre}. Me gustaría coordinar el inicio del proyecto y los datos para el anticipo del 50%.`;
      const waUrl = `https://wa.me/${telefonoEmpresa}?text=${encodeURIComponent(mensaje)}`;
      window.open(waUrl, "_blank");
    } catch (err) {
      console.error(err);
      alert("Hubo un inconveniente al procesar la aceptación. Por favor contáctanos directamente.");
    } finally {
      setAceptando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-semibold tracking-wide text-sm">Cargando propuesta comercial...</p>
      </div>
    );
  }

  if (error || !presupuesto) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-slate-900 border-white/10 text-center p-8">
          <AlertCircle className="w-14 h-14 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white mb-2">Propuesta no disponible</h2>
          <p className="text-sm text-slate-400 mb-6">{error || "El enlace de esta propuesta no es válido."}</p>
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold"
            onClick={() => window.open("https://wa.me/56954169597?text=Hola,%20tengo%20una%20consulta%20sobre%20una%20propuesta", "_blank")}
          >
            Contactar a Servicios Informáticos Hoja SpA
          </Button>
        </Card>
      </div>
    );
  }

  const isUF = presupuesto.moneda === "UF";
  const valorUF = presupuesto.valorUFReferencial || 38000;

  const formatMoney = (amount: number) => {
    if (isUF) {
      return `${amount.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} UF`;
    }
    return `$${amount.toLocaleString("es-CL")}`;
  };

  const calculatedNeto = presupuesto.totales?.neto ?? (presupuesto.items?.reduce((acc, curr) => acc + curr.total, 0) || 0);
  const calculatedIva = presupuesto.totales?.iva ?? Math.round(calculatedNeto * 0.19);
  const calculatedTotal = presupuesto.totales?.total ?? (calculatedNeto + calculatedIva);

  const montoAnticipo = presupuesto.bloqueDesarrollo?.montoAnticipo ?? (isUF ? Number((calculatedTotal * 0.5).toFixed(2)) : Math.round(calculatedTotal * 0.5));
  const montoEntrega = presupuesto.bloqueDesarrollo?.montoEntrega ?? (isUF ? Number((calculatedTotal - montoAnticipo).toFixed(2)) : calculatedTotal - montoAnticipo);
  const modalidadContinuidad = presupuesto.bloqueContinuidad?.modalidad || "incluido_ano1";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Encabezado Principal de Hoja SpA */}
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <span className="text-white font-black text-2xl tracking-tighter">H</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-bold">Servicios Informáticos</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">Propuesta Oficial</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Hoja SpA</h1>
              <p className="text-xs text-slate-400">V Región, Chile • WhatsApp: +56 9 5416 9597</p>
            </div>
          </div>

          <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-white/10">
            <div className="text-xs text-slate-400 font-medium">Propuesta Comercial N°</div>
            <div className="text-2xl font-mono font-black text-indigo-400">{presupuesto.numero}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center md:justify-end gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Válido por 15 días corridos</span>
            </div>
          </div>
        </div>

        {/* Banner de Estado si ya está aceptada */}
        {aceptada && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-5 flex items-center gap-4 text-emerald-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <p className="font-black text-base text-emerald-300">¡Esta propuesta ya fue aceptada!</p>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                El equipo de Servicios Informáticos Hoja SpA ya se encuentra coordinando la fase de inicio y arquitectura contigo.
              </p>
            </div>
          </div>
        )}

        {/* Resumen del Cliente y Proyecto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-slate-900/70 border-white/10">
            <CardContent className="p-6 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">CLIENTE</span>
              <p className="text-xl font-black text-white">{presupuesto.cliente_nombre}</p>
              <p className="text-xs text-slate-400">Cliente Oficial Hoja SpA</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-white/10">
            <CardContent className="p-6 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">PROYECTO</span>
              <p className="text-xl font-black text-indigo-300">{presupuesto.nombre_proyecto || "Solución Tecnológica a Medida"}</p>
              <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap leading-relaxed">
                {presupuesto.descripcion_proyecto || "Desarrollo de plataforma digital y arquitectura de continuidad."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Servicios / Soluciones */}
        <Card className="bg-slate-900/70 border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-black text-white">Detalle de Servicios e Implementación</h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              Moneda: {presupuesto.moneda || "CLP"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-6">Descripción</th>
                  <th className="py-3 px-4 text-center w-20">Cant.</th>
                  <th className="py-3 px-6 text-right w-36">Precio Unit.</th>
                  <th className="py-3 px-6 text-right w-36">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {(presupuesto.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-4 px-6">
                      <p className="text-white font-semibold text-sm leading-snug">{item.descripcion}</p>
                      {item.detalle && item.detalle.trim() && (
                        <p className="text-xs text-slate-400 font-normal leading-relaxed whitespace-pre-wrap mt-1.5 pl-2.5 border-l-2 border-indigo-500/40">
                          {item.detalle}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-300 font-mono">
                      {item.cantidad}
                    </td>
                    <td className="py-4 px-6 text-right text-slate-300 font-mono">
                      {formatMoney(item.precio)}
                    </td>
                    <td className="py-4 px-6 text-right text-white font-bold font-mono">
                      {formatMoney(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales Netos / IVA / Final */}
          <div className="p-6 bg-slate-950/60 border-t border-white/10 flex flex-col items-end">
            <div className="w-full sm:w-80 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal Neto:</span>
                <span className="font-mono text-slate-200">{formatMoney(calculatedNeto)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>IVA (19%):</span>
                <span className="font-mono text-slate-200">{formatMoney(calculatedIva)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-white/15">
                <span className="text-sm font-black text-white uppercase tracking-wider">Total Proyecto:</span>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-indigo-400">
                    {formatMoney(calculatedTotal)}
                  </span>
                  {isUF && (
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      ≈ ${(calculatedTotal * valorUF).toLocaleString("es-CL")} CLP (UF Ref: ${valorUF.toLocaleString("es-CL")})
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Bloque 1: Condiciones de Pago Desarrollo (50% / 50%) */}
        <Card className="bg-slate-900/80 border-indigo-500/30 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-wide uppercase">Bloque 1: Desarrollo e Implementación</h3>
                  <p className="text-xs text-slate-400">Cobro único con facilidades 50% anticipo / 50% contra entrega</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                50% Anticipo / 50% Entrega
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-bold">Hito 1: Anticipo de Inicio (50%)</span>
                <p className="text-2xl font-black font-mono text-white mt-1">{formatMoney(montoAnticipo)}</p>
                <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                  Para dar inicio inmediato a la arquitectura técnica, diseño de interfaz y configuración de infraestructura.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-bold">Hito 2: Saldo Final contra Entrega (50%)</span>
                <p className="text-2xl font-black font-mono text-white mt-1">{formatMoney(montoEntrega)}</p>
                <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                  Contra revisión de conformidad, puesta en producción y entrega de accesos de administrador.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloque 2: Continuidad, Hosting y Soporte */}
        <Card className="bg-slate-900/80 border-cyan-500/30 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-sm">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-wide uppercase">Bloque 2: Continuidad, Hosting y Soporte</h3>
                  <p className="text-xs text-slate-400">Infraestructura de alta disponibilidad y soporte continuo</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {modalidadContinuidad === "incluido_ano1" || modalidadContinuidad === "ano_1_incluido"
                  ? "Año 1 Incluido"
                  : modalidadContinuidad === "mensual" || modalidadContinuidad === "recurrente_mensual"
                    ? "Cobro Mensual"
                    : "Cobro Anual"}
              </span>
            </div>

            {modalidadContinuidad === "incluido_ano1" || modalidadContinuidad === "ano_1_incluido" ? (
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-black text-sm">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Beneficio Hoja SpA: Primer Año Incluido Sin Costo Adicional ($0)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {presupuesto.bloqueContinuidad?.detalle || 
                    "Tu proyecto incluye 12 meses de servidores Cloud de alto rendimiento, certificados SSL automáticos, casillas de correo corporativo, copias de seguridad semanales y soporte técnico prioritario ante cualquier incidencia."}
                </p>
                <p className="text-[11px] text-slate-400 italic">
                  * A contar del mes 13, coordinaremos contigo la renovación anual con 30 días de anticipación.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                <p className="text-sm font-black text-white">
                  Monto Recurrente:{" "}
                  <span className="text-cyan-400 font-mono text-base">
                    {formatMoney(presupuesto.bloqueContinuidad?.montoRecurrente ?? presupuesto.bloqueContinuidad?.monto ?? 0)} / {modalidadContinuidad === "mensual" || modalidadContinuidad === "recurrente_mensual" ? "mes" : "año"}
                  </span>
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {presupuesto.bloqueContinuidad?.detalle || 
                    "Suscripción de soporte técnico continuo, hosting administrado y mantenimiento preventivo a contar de la entrega del proyecto."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Datos Bancarios Oficiales */}
        <Card className="bg-slate-900/60 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Datos para Transferencia Bancaria</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-0.5">
                <p className="text-slate-400">Razón Social</p>
                <p className="font-bold text-white">{config?.nombre_titular || "SERVICIOS INFORMATICOS HOJA SPA"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-400">RUT</p>
                <p className="font-bold text-white">78.364.078-3</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-400">Banco</p>
                <p className="font-bold text-white">{config?.banco || "Banco Estado / Banco de Chile"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-400">Tipo de Cuenta</p>
                <p className="font-bold text-white">{config?.tipo_cuenta || "Cuenta Corriente"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-400">N° de Cuenta</p>
                <p className="font-bold text-white">{config?.numero_cuenta || "---"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-400">Email de Notificación</p>
                <p className="font-bold text-white">{config?.email_pago || "pagos@hoja.cl"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón de Acción Principal */}
        <div className="sticky bottom-6 z-30 bg-slate-900/95 border border-indigo-500/40 p-5 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-white">¿Todo listo para comenzar tu proyecto?</p>
            <p className="text-xs text-slate-400">
              Al aceptar, se notificará al equipo de Hoja SpA y se abrirá una conversación en WhatsApp para coordinar el inicio.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {aceptada ? (
              <Button 
                onClick={() => {
                  const waUrl = `https://wa.me/56954169597?text=${encodeURIComponent(`Hola! Ya acepté la propuesta N° ${presupuesto.numero} para ${presupuesto.nombre_proyecto || presupuesto.cliente_nombre}. Quiero conversar con el equipo.`)}`;
                  window.open(waUrl, "_blank");
                }}
                className="w-full sm:w-auto h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm gap-2 shadow-lg shadow-emerald-600/30"
              >
                <CheckCircle2 className="w-5 h-5" />
                Coordinar por WhatsApp (+56 9 5416 9597)
              </Button>
            ) : (
              <Button
                onClick={handleAceptar}
                disabled={aceptando}
                className="w-full sm:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm gap-2 shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02]"
              >
                {aceptando ? (
                  <span>Procesando Aceptación...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>Aceptar Propuesta y Coordinar Inicio</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
