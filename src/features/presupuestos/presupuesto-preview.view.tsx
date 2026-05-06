"use client";

import React from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Presupuesto, ConfiguracionGlobal } from "@/lib/types";

interface PresupuestoPreviewProps {
  data: Partial<Presupuesto>;
  config: ConfiguracionGlobal | null;
  isPrinting?: boolean;
}

export const PresupuestoPreview: React.FC<PresupuestoPreviewProps> = ({ data, config, isPrinting = false }) => {
  const [isZoomed, setIsZoomed] = React.useState(false);
  if (!data) return null;

  const formatDate = (date: any) => {
    if (!date) return "";
    try {
      const d = typeof date === 'string' ? new Date(date) : (date.seconds ? new Date(date.seconds * 1000) : new Date(date));
      return d.toLocaleDateString('es-CL');
    } catch (e) {
      return "";
    }
  };

  const calculatedNeto = data.items?.reduce((acc, curr) => acc + curr.total, 0) || 0;
  const calculatedIva = Math.round(calculatedNeto * 0.19);
  const calculatedTotal = calculatedNeto + calculatedIva;

  return (
    <div className={`w-full relative pb-10 ${isPrinting ? "" : isZoomed ? "overflow-auto h-[75vh]" : "overflow-x-hidden min-h-[500px] sm:min-h-[900px]"}`}>
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
                    ${item.precio.toLocaleString('es-CL')}
                  </td>
                  <td className="py-3 text-right text-xs font-bold text-slate-900" style={{ color: '#0f172a' }}>
                    ${item.total.toLocaleString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Breakdown Totals */}
          <div className="flex justify-end mb-6 break-inside-avoid" style={{ breakInside: 'avoid' }}>
            <div className="w-56 space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-500 font-medium" style={{ color: '#64748b' }}>
                <span>Neto</span>
                <span style={{ color: '#1e293b' }}>
                  ${calculatedNeto.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-medium" style={{ color: '#64748b' }}>
                <span>IVA (19%)</span>
                <span style={{ color: '#1e293b' }}>
                  ${calculatedIva.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900" style={{ borderTopColor: '#0f172a' }}>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-900" style={{ color: '#0f172a' }}>Total Final</span>
                <span className="text-xl font-black text-slate-900" style={{ color: '#0f172a' }}>
                  ${calculatedTotal.toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Services / Recurring */}
          {data.servicios_opcionales && data.servicios_opcionales.length > 0 && (
            <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-slate-100 break-inside-avoid" style={{ backgroundColor: '#ffffff', breakInside: 'avoid' }}>
              <h3 className="text-[9px] uppercase tracking-widest text-primary font-black mb-3" style={{ color: '#abaafd' }}>SERVICIOS RECURRENTES / OPCIONALES</h3>
              <div className="space-y-2">
                {data.servicios_opcionales.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                    <div>
                      <p className="text-xs font-bold text-slate-700" style={{ color: '#334155' }}>{item.descripcion}</p>
                      <span className="text-[8px] uppercase font-bold text-slate-400" style={{ color: '#94a3b8' }}>Frecuencia: {item.frecuencia}</span>
                    </div>
                    <p className="text-sm font-black text-slate-900" style={{ color: '#0f172a' }}>
                      ${item.precio.toLocaleString('es-CL')} <span className="text-[9px] text-slate-400 font-medium" style={{ color: '#94a3b8' }}>+ IVA /{item.frecuencia}</span>
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
