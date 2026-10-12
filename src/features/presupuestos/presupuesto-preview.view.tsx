"use client";

import React from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Presupuesto, ConfiguracionGlobal } from "@/lib/types";

interface PresupuestoPreviewProps {
  id?: string;
  data: Partial<Presupuesto>;
  config: ConfiguracionGlobal | null;
  isPrinting?: boolean;
}

export const PresupuestoPreview: React.FC<PresupuestoPreviewProps> = ({ id, data, config, isPrinting = false }) => {
  const [isZoomed, setIsZoomed] = React.useState(false);
  if (!data) return null;

  const formatDate = (date: unknown) => {
    if (!date) return "";
    try {
      if (typeof date === "string") {
        return new Date(date).toLocaleDateString("es-CL");
      }
      if (typeof date === "object" && date !== null && "seconds" in date) {
        return new Date((date as { seconds: number }).seconds * 1000).toLocaleDateString("es-CL");
      }
      return new Date(String(date)).toLocaleDateString("es-CL");
    } catch {
      return "";
    }
  };

  const isUF = data.moneda === 'UF';
  const valorUF = data.valorUFReferencial || 38000;

  const formatCurrencyShort = (amount: number) => {
    if (isUF) {
      return `${amount.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} UF`;
    }
    return `$${amount.toLocaleString('es-CL')}`;
  };

  const calculatedNeto = data.items?.reduce((acc, curr) => acc + curr.total, 0) || 0;
  const calculatedIva = Math.round(calculatedNeto * 0.19);
  const calculatedTotal = calculatedNeto + calculatedIva;

  const montoAnticipo = data.bloqueDesarrollo?.montoAnticipo ?? (isUF ? Number((calculatedTotal * 0.5).toFixed(2)) : Math.round(calculatedTotal * 0.5));
  const montoEntrega = data.bloqueDesarrollo?.montoEntrega ?? (isUF ? Number((calculatedTotal - montoAnticipo).toFixed(2)) : calculatedTotal - montoAnticipo);
  const modalidadContinuidad = data.bloqueContinuidad?.modalidad || 'incluido_ano1';

  return (
    <div id={id} className={`w-full relative pb-10 ${isPrinting ? "" : isZoomed ? "overflow-auto h-[75vh]" : "overflow-x-hidden min-h-[500px] sm:min-h-[900px]"}`}>
      {/* Botón de Zoom Flotante para Móvil */}
      {!isPrinting && (
        <div className="fixed bottom-6 right-6 z-[110] sm:hidden">
          <Button
            onClick={() => setIsZoomed(!isZoomed)}
            size="icon"
            className="h-14 w-14 rounded-full shadow-2xl bg-[#2e3c7e] text-white border-2 border-white/20"
          >
            {isZoomed ? <ZoomOut className="h-6 w-6" /> : <ZoomIn className="h-6 w-6" />}
          </Button>
        </div>
      )}

      <div 
        id="presupuesto-document" 
        className={`bg-white text-slate-900 p-6 sm:p-12 w-[800px] overflow-hidden flex flex-col font-sans origin-top transition-all duration-500 shrink-0 relative mx-auto ${
          isPrinting
            ? "scale-100 mb-0 translate-x-0 left-0 border-none shadow-none"
            : isZoomed 
              ? "scale-100 mb-10 z-50 shadow-[0_0_100px_rgba(0,0,0,0.5)] translate-x-0 left-0 min-h-[1100px] border border-slate-100" 
              : "scale-[0.38] sm:scale-75 md:scale-90 lg:scale-100 mb-[-650px] sm:mb-[-250px] md:mb-[-100px] lg:mb-0 min-h-[500px] border border-slate-100 shadow-2xl"
        }`}
        style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-2">
            <img src="/logo.png" alt="Hoja SpA Logo" className="h-16 w-auto object-contain" />
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold" style={{ color: '#94a3b8' }}>
              Servicios Informáticos Hoja SpA
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-0.5" style={{ color: '#0f172a' }}>PRESUPUESTO</h1>
            <div className="font-bold text-lg mb-2" style={{ color: '#abaafd' }}>N° {data.numero || "XXXX"}</div>
            <div className="space-y-0.5 text-[10px] text-slate-500" style={{ color: '#64748b' }}>
              <p><span className="font-bold text-slate-700" style={{ color: '#334155' }}>Fecha:</span> {data.fecha ? formatDate(data.fecha) : ""}</p>
              <p><span className="font-bold text-slate-700" style={{ color: '#334155' }}>Válido por:</span> 15 días</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 mb-8">
          <div className="space-y-3">
            <h3 className="text-[9px] uppercase tracking-widest text-slate-400 font-bold border-b pb-1.5 mb-1" style={{ color: '#94a3b8', borderBottomColor: '#e2e8f0' }}>CLIENTE</h3>
            <div className="space-y-1">
              <p className="font-black text-slate-900 text-base" style={{ color: '#0f172a' }}>{data.cliente_nombre || "Nombre del Cliente"}</p>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-[9px] uppercase tracking-widest text-slate-400 font-bold border-b pb-1.5 mb-1" style={{ color: '#94a3b8', borderBottomColor: '#e2e8f0' }}>PROYECTO</h3>
            <div className="space-y-1">
              {data.nombre_proyecto && <p className="font-bold text-slate-900 text-sm" style={{ color: '#0f172a' }}>{data.nombre_proyecto}</p>}
              <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap" style={{ color: '#475569' }}>
                {data.descripcion_proyecto || (data.nombre_proyecto ? "" : "Descripción general del proyecto y servicios a prestar.")}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-grow">
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b-2 border-slate-900" style={{ borderBottomColor: '#0f172a' }}>
                <th className="py-2 text-left text-[9px] font-black uppercase tracking-widest text-slate-900" style={{ color: '#0f172a' }}>Descripción del Servicio</th>
                <th className="py-2 text-center text-[9px] font-black uppercase tracking-widest text-slate-900 w-16" style={{ color: '#0f172a' }}>Cant.</th>
                <th className="py-2 text-right text-[9px] font-black uppercase tracking-widest text-slate-900 w-28" style={{ color: '#0f172a' }}>Precio Unit.</th>
                <th className="py-2 text-right text-[9px] font-black uppercase tracking-widest text-slate-900 w-28" style={{ color: '#0f172a' }}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.items || []).map((item, index) => (
                <tr key={index}>
                  <td className="py-3 pr-4">
                    <p className="text-xs font-bold text-slate-800" style={{ color: '#1e293b' }}>{item.descripcion}</p>
                  </td>
                  <td className="py-3 text-center text-xs text-slate-500 font-medium" style={{ color: '#64748b' }}>{item.cantidad}</td>
                  <td className="py-3 text-right text-xs text-slate-500 font-medium" style={{ color: '#64748b' }}>
                    {formatCurrencyShort(item.precio)}
                  </td>
                  <td className="py-3 text-right text-xs font-bold text-slate-900" style={{ color: '#0f172a' }}>
                    {formatCurrencyShort(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Breakdown Totals */}
          <div className="flex justify-end mb-6 break-inside-avoid" style={{ breakInside: 'avoid' }}>
            <div className="w-72 space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium" style={{ color: '#64748b' }}>
                <span>Neto</span>
                <span className="font-semibold" style={{ color: '#1e293b' }}>
                  {formatCurrencyShort(calculatedNeto)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium" style={{ color: '#64748b' }}>
                <span>IVA (19%)</span>
                <span className="font-semibold" style={{ color: '#1e293b' }}>
                  {formatCurrencyShort(calculatedIva)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900" style={{ borderTopColor: '#0f172a' }}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900" style={{ color: '#0f172a' }}>Total Final</span>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900" style={{ color: '#0f172a' }}>
                    {formatCurrencyShort(calculatedTotal)}
                  </span>
                  {isUF && (
                    <p className="text-[10px] text-slate-500 font-semibold" style={{ color: '#64748b' }}>
                      ≈ ${(calculatedTotal * valorUF).toLocaleString('es-CL')} CLP (UF Ref: ${valorUF.toLocaleString('es-CL')})
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 1: Condiciones de Pago Desarrollo (50% / 50%) */}
          <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/70 break-inside-avoid" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', breakInside: 'avoid' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[9px] uppercase tracking-widest font-black text-indigo-700" style={{ color: '#4338ca' }}>
                BLOQUE 1: DESARROLLO E IMPLEMENTACIÓN
              </h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                Modalidad 50% / 50%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500" style={{ color: '#64748b' }}>1. Anticipo Inicial (50%)</p>
                <p className="text-sm font-black text-slate-900 mt-0.5" style={{ color: '#0f172a' }}>
                  {formatCurrencyShort(montoAnticipo)}
                </p>
                <p className="text-[9px] text-slate-500 mt-1" style={{ color: '#64748b' }}>Para inicio de arquitectura, diseño y configuración de entorno.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500" style={{ color: '#64748b' }}>2. Saldo contra Entrega (50%)</p>
                <p className="text-sm font-black text-slate-900 mt-0.5" style={{ color: '#0f172a' }}>
                  {formatCurrencyShort(montoEntrega)}
                </p>
                <p className="text-[9px] text-slate-500 mt-1" style={{ color: '#64748b' }}>Contra puesta en producción y entrega de accesos definitivos.</p>
              </div>
            </div>
          </div>

          {/* Bloque 2: Continuidad, Hosting y Soporte */}
          <div className="mb-6 p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 break-inside-avoid" style={{ backgroundColor: '#eef2ff', borderColor: '#c7d2fe', breakInside: 'avoid' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[9px] uppercase tracking-widest font-black text-indigo-900" style={{ color: '#312e81' }}>
                BLOQUE 2: CONTINUIDAD, HOSTING Y SOPORTE
              </h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-200 text-indigo-900" style={{ backgroundColor: '#c7d2fe', color: '#1e1b4b' }}>
                {modalidadContinuidad === 'incluido_ano1' ? 'Año 1 Incluido' : modalidadContinuidad === 'mensual' ? 'Cobro Mensual' : 'Cobro Anual'}
              </span>
            </div>
            {modalidadContinuidad === 'incluido_ano1' ? (
              <div className="p-3 bg-white rounded-lg border border-indigo-100" style={{ backgroundColor: '#ffffff', borderColor: '#e0e7ff' }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-800" style={{ color: '#1e293b' }}>
                    Hosting y Soporte Técnico Primer Año: <span className="text-emerald-600 font-black" style={{ color: '#059669' }}>INCLUIDO SIN COSTO ($0)</span>
                  </p>
                </div>
                <p className="text-[10px] text-slate-600 mt-1" style={{ color: '#475569' }}>
                  {data.bloqueContinuidad?.detalle || "Incluye servidores Cloud de alto rendimiento, certificados SSL automáticos, casillas de correo corporativo, copias de seguridad semanales y soporte técnico ante incidencias durante los primeros 12 meses."}
                </p>
                <p className="text-[9px] text-slate-400 mt-1.5 font-medium" style={{ color: '#94a3b8' }}>
                  * A contar del mes 13, la renovación anual se coordina con 30 días de anticipación según el plan acordado.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-lg border border-indigo-100" style={{ backgroundColor: '#ffffff', borderColor: '#e0e7ff' }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-800" style={{ color: '#1e293b' }}>
                    Monto Recurrente: <span className="text-indigo-700 font-black" style={{ color: '#4338ca' }}>
                      {formatCurrencyShort(data.bloqueContinuidad?.monto || 0)} / {modalidadContinuidad === 'mensual' ? 'mes' : 'año'}
                    </span>
                  </p>
                </div>
                <p className="text-[10px] text-slate-600 mt-1" style={{ color: '#475569' }}>
                  {data.bloqueContinuidad?.detalle || "Servicio de hosting administrado, soporte técnico prioritario, casillas de correo y copias de seguridad continuas a contar de la entrega del proyecto."}
                </p>
              </div>
            )}
          </div>

          {/* Optional Services / Recurring extras */}
          {data.servicios_opcionales && data.servicios_opcionales.length > 0 && (
            <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-slate-200 break-inside-avoid" style={{ backgroundColor: '#ffffff', breakInside: 'avoid' }}>
              <h3 className="text-[9px] uppercase tracking-widest text-slate-500 font-black mb-3" style={{ color: '#64748b' }}>SERVICIOS RECURRENTES ADICIONALES</h3>
              <div className="space-y-2">
                {data.servicios_opcionales.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <div>
                      <p className="text-xs font-bold text-slate-700" style={{ color: '#334155' }}>{item.descripcion}</p>
                      <span className="text-[8px] uppercase font-bold text-slate-400" style={{ color: '#94a3b8' }}>Frecuencia: {item.frecuencia}</span>
                    </div>
                    <p className="text-sm font-black text-slate-900" style={{ color: '#0f172a' }}>
                      {formatCurrencyShort(item.precio)} <span className="text-[9px] text-slate-400 font-medium" style={{ color: '#94a3b8' }}>+ IVA /{item.frecuencia}</span>
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[8px] text-slate-400 italic leading-none" style={{ color: '#94a3b8' }}>* Estos valores son netos (+ IVA) y no se incluyen en el total del proyecto inicial.</p>
            </div>
          )}

          {/* Conditions */}
          {data.parametros_personalizados && Object.keys(data.parametros_personalizados).length > 0 && (
            <div className="mb-6 p-4 rounded-xl break-inside-avoid" style={{ backgroundColor: '#f8fafc', breakInside: 'avoid' }}>
              <h3 className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-3" style={{ color: '#94a3b8' }}>CONDICIONES COMERCIALES</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {Object.entries(data.parametros_personalizados).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase" style={{ color: '#94a3b8' }}>{key}</span>
                    <span className="text-[10px] font-bold text-slate-700" style={{ color: '#334155' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer / Banking Info */}
        <div className="border-t pt-6 mt-8 break-inside-avoid" style={{ borderTopColor: '#e2e8f0', breakInside: 'avoid' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[9px]">
            <div className="space-y-1.5">
              <h4 className="font-black text-slate-900 uppercase tracking-wider" style={{ color: '#0f172a' }}>Datos de Transferencia</h4>
              <div className="text-slate-500 space-y-0.5 font-medium" style={{ color: '#64748b' }}>
                <p className="font-bold text-slate-800" style={{ color: '#1e293b' }}>{config?.nombre_titular || "SERVICIOS INFORMATICOS HOJA SPA"}</p>
                <p>RUT: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>78.364.078-3</span></p>
                <p>Banco: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>{config?.banco || "---"}</span></p>
                <p>Tipo: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>{config?.tipo_cuenta || "---"}</span></p>
                <p>N° Cuenta: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>{config?.numero_cuenta || "---"}</span></p>
                <p>Email: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>{config?.email_pago || "---"}</span></p>
              </div>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-black text-slate-900 uppercase tracking-wider" style={{ color: '#0f172a' }}>Contacto</h4>
              <div className="text-slate-500 space-y-0.5 font-medium" style={{ color: '#64748b' }}>
                <p>Email: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>{config?.email_contacto || "---"}</span></p>
                <p>Web: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>{config?.web || "---"}</span></p>
                <p>Tel: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>+56 9 5416 9597</span></p>
              </div>
            </div>
            <div className="flex flex-col justify-end text-right">
              <p className="text-slate-400 font-medium" style={{ color: '#94a3b8' }}>Este presupuesto tiene una validez de 15 días corridos a contar de la fecha de emisión.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
