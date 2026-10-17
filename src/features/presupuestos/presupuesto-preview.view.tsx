"use client";

import React, { useState } from "react";
import { ZoomIn, ZoomOut, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Presupuesto, ConfiguracionGlobal } from "@/lib/types";

interface PresupuestoPreviewProps {
  id?: string;
  data: Partial<Presupuesto>;
  config: ConfiguracionGlobal | null;
  isPrinting?: boolean;
}

export const PresupuestoPreview: React.FC<PresupuestoPreviewProps> = ({ 
  id, 
  data, 
  config, 
  isPrinting = false 
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  if (!data) return null;

  const formatDate = (date: unknown) => {
    if (!date) return new Date().toLocaleDateString("es-CL");
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

  const isUF = data.moneda === "UF";
  const valorUF = data.valorUFReferencial || 38000;

  const formatCurrencyShort = (amount: number = 0) => {
    if (isUF) {
      return `${amount.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} UF`;
    }
    return `$${Math.round(amount).toLocaleString("es-CL")}`;
  };

  const calculatedNeto = data.items?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;
  const calculatedIva = Math.round(calculatedNeto * 0.19);
  const calculatedTotal = calculatedNeto + calculatedIva;

  // Condiciones comerciales por defecto estructuradas si no se especificaron personalizadas
  const defaultCondiciones = [
    "Forma de Pago: 50% de anticipo al inicio de los trabajos y 50% contra entrega conforme y paso a producción.",
    "Plazo de Entrega: Acordado según cronograma de desarrollo tras la confirmación del anticipo.",
    "Validez de la Propuesta: 15 días corridos a contar de la fecha de emisión del documento.",
    "Garantía y Continuidad: Incluye 12 meses de soporte técnico, hosting administrado y respaldo ante incidencias.",
  ];

  const condicionesTexto = data.condiciones_comerciales?.trim() 
    ? data.condiciones_comerciales.split("\n").filter(line => line.trim().length > 0)
    : defaultCondiciones;

  return (
    <div id={id} className={`w-full relative pb-10 ${isPrinting ? "" : "min-h-[500px]"}`}>
      {/* Barra de Controles de Zoom Superior (solo en pantalla) */}
      {!isPrinting && (
        <div className="flex items-center justify-between gap-2 mb-4 px-2 select-none">
          <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>Formato Carta (2 Páginas): {isZoomed ? "100% (Tamaño Real)" : "Ajuste Óptimo"}</span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsZoomed(!isZoomed)}
            className="h-8 px-3 text-xs font-bold rounded-xl gap-1.5 border-border bg-card shadow-xs cursor-pointer"
          >
            {isZoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
            <span>{isZoomed ? "Ajustar Pantalla" : "Zoom 100%"}</span>
          </Button>
        </div>
      )}

      {/* Contenedor Principal de Documentos Carta */}
      <div 
        id="presupuesto-document" 
        className={`flex flex-col gap-8 transition-all duration-300 origin-top mx-auto ${
          isPrinting
            ? "scale-100"
            : isZoomed 
              ? "scale-100" 
              : "scale-[0.58] sm:scale-75 md:scale-90 lg:scale-100 mb-[-360px] sm:mb-[-180px] md:mb-[-80px] lg:mb-0"
        }`}
      >
        {/* ========================================================= */}
        {/* PÁGINA 1: PROPUESTA ECONÓMICA Y DETALLE DE SERVICIOS */}
        {/* ========================================================= */}
        <div 
          data-pdf-page="true"
          className="bg-white text-slate-900 w-[800px] min-h-[1035px] p-10 sm:p-12 overflow-hidden flex flex-col justify-between font-sans relative mx-auto rounded-xl border border-slate-200 shadow-xl"
          style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
        >
          {/* Parte Superior: Membrete + Cliente/Proyecto */}
          <div>
            {/* Header / Membrete */}
            <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
              <div className="space-y-1.5">
                <img 
                  src="/logo.png" 
                  alt="Hoja SpA Logo" 
                  className="h-14 w-auto object-contain" 
                  onError={(e) => { (e.target as HTMLImageElement).src = "/favicon.ico"; }}
                />
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Servicios Informáticos Hoja SpA &bull; RUT: 78.364.078-3
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                  PRESUPUESTO
                </h1>
                <div className="font-mono font-black text-base text-indigo-600 mt-1">
                  N° {data.numero || "0001"}
                </div>
                <div className="mt-1 space-y-0.5 text-[10px] text-slate-500 font-medium">
                  <p><span className="font-bold text-slate-700">Fecha de Emisión:</span> {formatDate(data.fecha)}</p>
                  <p><span className="font-bold text-slate-700">Validez:</span> 15 días corridos</p>
                </div>
              </div>
            </div>

            {/* Datos del Cliente y Proyecto */}
            <div className="grid grid-cols-2 gap-6 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black block">
                  CLIENTE / EMPRESA
                </span>
                <p className="font-black text-slate-900 text-sm">
                  {data.cliente_nombre || "Cliente no especificado"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black block">
                  PROYECTO / ASUNTO
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {data.nombre_proyecto || "Servicios Digitales y Desarrollo Tecnológico"}
                </p>
                {data.descripcion_proyecto && (
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed whitespace-pre-wrap mt-0.5">
                    {data.descripcion_proyecto}
                  </p>
                )}
              </div>
            </div>

            {/* Tabla de Servicios / Ítems */}
            <div className="mt-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-left">
                    <th className="py-2.5 text-[9px] font-black uppercase tracking-wider text-slate-900">
                      Descripción del Servicio
                    </th>
                    <th className="py-2.5 text-center text-[9px] font-black uppercase tracking-wider text-slate-900 w-16">
                      Cant.
                    </th>
                    <th className="py-2.5 text-right text-[9px] font-black uppercase tracking-wider text-slate-900 w-28">
                      Precio Unit.
                    </th>
                    <th className="py-2.5 text-right text-[9px] font-black uppercase tracking-wider text-slate-900 w-28">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {(data.items && data.items.length > 0) ? (
                    data.items.map((item, index) => (
                      <tr key={index} className="align-top">
                        <td className="py-2.5 pr-4">
                          <p className="font-bold text-slate-900 leading-snug">{item.descripcion}</p>
                        </td>
                        <td className="py-2.5 text-center font-medium text-slate-600">
                          {item.cantidad || 1}
                        </td>
                        <td className="py-2.5 text-right font-medium text-slate-600">
                          {formatCurrencyShort(item.precio)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">
                          {formatCurrencyShort(item.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                        No se han añadido ítems a la propuesta.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Servicios Opcionales (si existen, de forma muy compacta) */}
            {data.servicios_opcionales && data.servicios_opcionales.length > 0 && (
              <div className="mt-4 p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
                <span className="text-[9px] uppercase tracking-widest font-black text-slate-500 block mb-1.5">
                  Servicios Opcionales / Adicionales
                </span>
                <div className="space-y-1">
                  {data.servicios_opcionales.map((opt, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] text-slate-700">
                      <span>• {opt.descripcion} ({opt.frecuencia || "Adicional"})</span>
                      <span className="font-bold">{formatCurrencyShort(opt.precio)} + IVA</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Parte Inferior: Totales y Pie de Página 1 */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex justify-end mb-4">
              <div className="w-72 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Subtotal Neto</span>
                  <span className="font-bold text-slate-900">{formatCurrencyShort(calculatedNeto)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>IVA (19%)</span>
                  <span className="font-bold text-slate-900">{formatCurrencyShort(calculatedIva)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-900">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Total Propuesta
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-700">
                      {formatCurrencyShort(calculatedTotal)}
                    </span>
                    {isUF && (
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        ≈ ${(calculatedTotal * valorUF).toLocaleString("es-CL")} CLP (UF: ${valorUF.toLocaleString("es-CL")})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold pt-2 border-t border-slate-100 uppercase tracking-widest">
              <span>Página 1 de 2 &bull; Propuesta Económica &bull; Hoja SpA</span>
              <span>Continúa en Página 2 con Condiciones y Cuentas Bancarias &rarr;</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PÁGINA 2: CONDICIONES, DATOS BANCARIOS Y CONTACTO */}
        {/* ========================================================= */}
        <div 
          data-pdf-page="true"
          className="bg-white text-slate-900 w-[800px] min-h-[1035px] p-10 sm:p-12 overflow-hidden flex flex-col justify-between font-sans relative mx-auto rounded-xl border border-slate-200 shadow-xl"
          style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
        >
          {/* Encabezado Superior Página 2 */}
          <div>
            <div className="flex justify-between items-center pb-4 border-b-2 border-slate-900 mb-6">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-slate-900 uppercase">
                  SERVICIOS INFORMÁTICOS HOJA SPA
                </span>
              </div>
              <div className="font-mono font-bold text-xs text-indigo-600">
                PRESUPUESTO N° {data.numero || "0001"} &bull; TÉRMINOS Y CONDICIONES
              </div>
            </div>

            {/* 1. Condiciones Comerciales del Presupuesto */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[10px]">
                  1
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Condiciones Comerciales y Términos del Servicio
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                {condicionesTexto.map((linea, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
                    <span>{linea}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Cuentas de Transferencia Bancaria */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[10px]">
                  2
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Datos para Transferencia Bancaria
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Razón Social</span>
                    <span className="font-bold text-slate-900">{config?.nombre_titular || "SERVICIOS INFORMATICOS HOJA SPA"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">RUT</span>
                    <span className="font-mono font-bold text-slate-900">{config?.rut || "78.364.078-3"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Banco</span>
                    <span className="font-bold text-slate-900">{config?.banco || "Banco Falabella"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Tipo de Cuenta</span>
                    <span className="font-bold text-slate-900">{config?.tipo_cuenta || "Cuenta Corriente"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">N° de Cuenta</span>
                    <span className="font-mono font-bold text-slate-900">{config?.numero_cuenta || "1-983-101480-2"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Email para Comprobante</span>
                    <span className="font-bold text-indigo-600">{config?.email_pago || "devhoja@gmail.com"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Canales de Contacto Directo */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[10px]">
                  3
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Canales de Contacto y Asistencia
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Teléfono / WhatsApp</span>
                  <span className="font-bold text-slate-800">{config?.telefono || "+56 9 5416 9597"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Email Comercial</span>
                  <span className="font-bold text-slate-800">{config?.email_contacto || "contacto@hojaspa.cl"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Sitio Web</span>
                  <span className="font-bold text-slate-800">{config?.web || "www.hojaspa.cl"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parte Inferior: Recuadro de Aceptación / Firma y Pie de Página 2 */}
          <div>
            <div className="p-4 rounded-xl border border-slate-300 bg-white mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-4 text-center">
                Aceptación y Aprobación de la Propuesta Comercial
              </span>
              <div className="grid grid-cols-2 gap-8 pt-4 items-end">
                <div className="border-t border-slate-400 pt-2 text-center">
                  <p className="text-xs font-black text-slate-900">Servicios Informáticos Hoja SpA</p>
                  <p className="text-[10px] text-slate-500">Emisor Autorizado</p>
                </div>
                <div className="border-t border-slate-400 pt-2 text-center">
                  <p className="text-xs font-black text-slate-900">
                    {data.cliente_nombre || "Firma y Nombre del Cliente / Representante"}
                  </p>
                  <p className="text-[10px] text-slate-500">Aceptado y Conforme &bull; Fecha: ___ / ___ / 202___</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold pt-2 border-t border-slate-100 uppercase tracking-widest">
              <span>Página 2 de 2 &bull; Hoja SpA &bull; Documento Institucional</span>
              <span>Validez 15 días corridos desde su emisión</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
