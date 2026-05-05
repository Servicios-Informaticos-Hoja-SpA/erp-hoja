"use client";

import React from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Presupuesto, ConfiguracionGlobal } from "@/lib/types";

interface PresupuestoPreviewProps {
  data: Partial<Presupuesto>;
  config: ConfiguracionGlobal | null;
}

export const PresupuestoPreview: React.FC<PresupuestoPreviewProps> = ({ data, config }) => {
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
    <div className="w-full relative pb-10 min-h-[500px] sm:min-h-[900px]">
      {/* Botón de Zoom Flotante para Móvil */}
      <div className="fixed bottom-6 right-6 z-[110] sm:hidden">
        <Button
          onClick={() => setIsZoomed(!isZoomed)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-2xl bg-[#2e3c7e] text-white border-2 border-white/20"
        >
          {isZoomed ? <ZoomOut className="h-6 w-6" /> : <ZoomIn className="h-6 w-6" />}
        </Button>
      </div>

      <div 
        id="presupuesto-document" 
        className={`bg-white text-slate-900 p-8 sm:p-16 w-[800px] min-h-[1100px] shadow-2xl absolute left-1/2 -translate-x-1/2 top-0 overflow-hidden border border-slate-100 flex flex-col font-sans origin-top transition-all duration-500 shrink-0 ${
          isZoomed 
            ? "scale-100 mb-0 z-50 shadow-[0_0_100px_rgba(0,0,0,0.5)]" 
            : "scale-[0.38] sm:scale-75 md:scale-90 lg:scale-100"
        }`}
        style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div className="space-y-4">
            <img src="/logo.png" alt="Hoja SpA Logo" className="h-16 w-auto object-contain" />
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold" style={{ color: '#94a3b8' }}>
              Servicios Informáticos Hoja SpA
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-1" style={{ color: '#0f172a' }}>PRESUPUESTO</h1>
            <div className="font-bold text-xl mb-4" style={{ color: '#abaafd' }}>N° {data.numero || "XXXX"}</div>
            <div className="space-y-1 text-xs text-slate-500" style={{ color: '#64748b' }}>
              <p><span className="font-bold text-slate-700" style={{ color: '#334155' }}>Fecha:</span> {data.fecha ? formatDate(data.fecha) : ""}</p>
              <p><span className="font-bold text-slate-700" style={{ color: '#334155' }}>Válido por:</span> 15 días</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-10">
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b pb-1" style={{ color: '#94a3b8', borderBottomColor: '#e2e8f0' }}>CLIENTE</h3>
            <div className="space-y-1">
              <p className="font-black text-slate-900 text-lg" style={{ color: '#0f172a' }}>{data.cliente_nombre || "Nombre del Cliente"}</p>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b pb-1" style={{ color: '#94a3b8', borderBottomColor: '#e2e8f0' }}>PROYECTO</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed" style={{ color: '#475569' }}>
              {data.descripcion_proyecto || "Descripción general del proyecto y servicios a prestar."}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-grow">
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-slate-900" style={{ borderBottomColor: '#0f172a' }}>
                <th className="py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-900" style={{ color: '#0f172a' }}>Descripción del Servicio</th>
                <th className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-900 w-20" style={{ color: '#0f172a' }}>Cant.</th>
                <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-900 w-32" style={{ color: '#0f172a' }}>Precio Unit.</th>
                <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-900 w-32" style={{ color: '#0f172a' }}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.items || []).map((item, index) => (
                <tr key={index}>
                  <td className="py-4 pr-4">
                    <p className="text-sm font-bold text-slate-800" style={{ color: '#1e293b' }}>{item.descripcion}</p>
                  </td>
                  <td className="py-4 text-center text-sm text-slate-500 font-medium" style={{ color: '#64748b' }}>{item.cantidad}</td>
                  <td className="py-4 text-right text-sm text-slate-500 font-medium" style={{ color: '#64748b' }}>
                    ${item.precio.toLocaleString('es-CL')}
                  </td>
                  <td className="py-4 text-right text-sm font-bold text-slate-900" style={{ color: '#0f172a' }}>
                    ${item.total.toLocaleString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Breakdown Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-medium" style={{ color: '#64748b' }}>
                <span>Neto</span>
                <span style={{ color: '#1e293b' }}>
                  ${calculatedNeto.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-medium" style={{ color: '#64748b' }}>
                <span>IVA (19%)</span>
                <span style={{ color: '#1e293b' }}>
                  ${calculatedIva.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900" style={{ borderTopColor: '#0f172a' }}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900" style={{ color: '#0f172a' }}>Total Final</span>
                <span className="text-2xl font-black text-slate-900" style={{ color: '#0f172a' }}>
                  ${calculatedTotal.toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Services / Recurring */}
          {data.servicios_opcionales && data.servicios_opcionales.length > 0 && (
            <div className="mb-10 p-6 rounded-2xl border-2 border-dashed border-slate-100" style={{ backgroundColor: '#ffffff' }}>
              <h3 className="text-[10px] uppercase tracking-widest text-primary font-black mb-4" style={{ color: '#abaafd' }}>SERVICIOS RECURRENTES / OPCIONALES</h3>
              <div className="space-y-4">
                {data.servicios_opcionales.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-700" style={{ color: '#334155' }}>{item.descripcion}</p>
                      <span className="text-[10px] uppercase font-bold text-slate-400" style={{ color: '#94a3b8' }}>Frecuencia: {item.frecuencia}</span>
                    </div>
                    <p className="text-sm font-black text-slate-900" style={{ color: '#0f172a' }}>
                      ${item.precio.toLocaleString('es-CL')} <span className="text-[10px] text-slate-400 font-medium" style={{ color: '#94a3b8' }}>+ IVA /{item.frecuencia}</span>
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[9px] text-slate-400 italic" style={{ color: '#94a3b8' }}>* Estos valores son netos (+ IVA) y no se incluyen en el total del proyecto inicial.</p>
            </div>
          )}

          {/* Conditions */}
          {data.parametros_personalizados && Object.keys(data.parametros_personalizados).length > 0 && (
            <div className="mb-10 p-6 rounded-2xl" style={{ backgroundColor: '#f8fafc' }}>
              <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4" style={{ color: '#94a3b8' }}>CONDICIONES COMERCIALES</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {Object.entries(data.parametros_personalizados).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase" style={{ color: '#94a3b8' }}>{key}</span>
                    <span className="text-xs font-bold text-slate-700" style={{ color: '#334155' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer / Banking Info */}
        <div className="border-t pt-8 mt-auto" style={{ borderTopColor: '#e2e8f0' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-[10px]">
            <div className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase tracking-wider" style={{ color: '#0f172a' }}>Datos de Transferencia</h4>
              <div className="text-slate-500 space-y-1 font-medium" style={{ color: '#64748b' }}>
                <p className="font-bold text-slate-800" style={{ color: '#1e293b' }}>{config?.nombre_titular || "SERVICIOS INFORMATICOS HOJA SPA"}</p>
                <p>RUT: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>{config?.rut || "78.364.078-3"}</span></p>
                <p>Banco: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>{config?.banco || "---"}</span></p>
                <p>Tipo: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>{config?.tipo_cuenta || "---"}</span></p>
                <p>N° Cuenta: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>{config?.numero_cuenta || "---"}</span></p>
                <p>Email: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>{config?.email_pago || "---"}</span></p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase tracking-wider" style={{ color: '#0f172a' }}>Contacto</h4>
              <div className="text-slate-500 space-y-1 font-medium" style={{ color: '#64748b' }}>
                <p>Email: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>{config?.email_contacto || "---"}</span></p>
                <p>Web: <span className="text-slate-700 font-bold" style={{ color: '#334155' }}>{config?.web || "---"}</span></p>
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
