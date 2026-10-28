"use client";

import React, { useState, useMemo } from "react";
import { ZoomIn, ZoomOut, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Presupuesto, PresupuestoItem, ConfiguracionGlobal } from "@/lib/types";

interface PresupuestoPreviewProps {
  id?: string;
  data: Partial<Presupuesto>;
  config: ConfiguracionGlobal | null;
  isPrinting?: boolean;
}

interface ItemPageData {
  pageIndex: number;
  isFirstPage: boolean;
  items: PresupuestoItem[];
  showTotales: boolean;
  startIndex: number;
}

// Estima con precisión la altura en píxeles de un ítem en la tabla del PDF
function estimateItemHeight(item: PresupuestoItem): number {
  let height = 38; // padding y altura base de la fila

  // Estimación de líneas del título (aprox 45 caracteres por línea con ancho útil ~420px)
  const titleLen = (item.descripcion || "").length;
  const titleLines = Math.max(1, Math.ceil(titleLen / 45));
  height += (titleLines - 1) * 18;

  // Estimación de líneas de la descripción detallada
  if (item.detalle && item.detalle.trim()) {
    height += 10; // margen superior y borde vertical
    const paragraphs = item.detalle.split("\n");
    let detailLines = 0;
    for (const p of paragraphs) {
      // promedio ~65 caracteres por línea con tipografía text-[10.5px]
      detailLines += Math.max(1, Math.ceil((p.length || 1) / 65));
    }
    height += detailLines * 16;
  }

  return Math.max(48, height);
}

// Algoritmo de particionado inteligente de ítems en páginas Carta
function paginatePresupuesto(
  items: PresupuestoItem[] = [],
  descripcionProyecto: string = "",
  hasServiciosOpcionales: boolean = false,
  numServiciosOpcionales: number = 0
): ItemPageData[] {
  if (!items || items.length === 0) {
    return [{
      pageIndex: 0,
      isFirstPage: true,
      items: [],
      showTotales: true,
      startIndex: 0,
    }];
  }

  // Altura adicional por descripción general del proyecto
  const descLines = descripcionProyecto ? Math.ceil(descripcionProyecto.length / 55) : 0;
  const clientCardExtra = Math.min(50, descLines * 16);
  const clientCardHeight = 80 + clientCardExtra;

  // Altura del bloque de totales y servicios opcionales
  const opcionalesHeight = hasServiciosOpcionales ? (40 + numServiciosOpcionales * 22) : 0;
  const totalesBlockHeight = 135 + opcionalesHeight;

  // Presupuesto de altura disponible por página (altura neta 955px tras descontar 80px de padding vertical)
  // Página 1: Membrete (95px) + Ficha Cliente/Proyecto (clientCardHeight) + Encabezado Tabla (36px) + Footer (32px)
  const page1TopOverhead = 95 + clientCardHeight + 36;
  const page1AvailableNoTotals = 955 - page1TopOverhead - 32; // ~670px para tabla
  const page1AvailableWithTotals = page1AvailableNoTotals - totalesBlockHeight; // ~535px

  // Páginas de continuación: Encabezado Continuación (45px) + Encabezado Tabla (36px) + Footer (32px)
  const contTopOverhead = 45 + 36;
  const contAvailableNoTotals = 955 - contTopOverhead - 32; // ~842px
  const contAvailableWithTotals = contAvailableNoTotals - totalesBlockHeight; // ~707px

  const itemHeights = items.map(estimateItemHeight);
  const totalAllItemsHeight = itemHeights.reduce((a, b) => a + b, 0);

  // Escenario 1: Todos los ítems caben holgadamente en la Página 1 con los totales
  if (totalAllItemsHeight <= page1AvailableWithTotals) {
    return [{
      pageIndex: 0,
      isFirstPage: true,
      items,
      showTotales: true,
      startIndex: 0,
    }];
  }

  // Escenario 2: Distribución inteligente en múltiples páginas
  const pages: ItemPageData[] = [];
  let currentIndex = 0;
  let pageIdx = 0;

  while (currentIndex < items.length) {
    const isFirst = pageIdx === 0;
    const availableNoTotals = isFirst ? page1AvailableNoTotals : contAvailableNoTotals;
    const availableWithTotals = isFirst ? page1AvailableWithTotals : contAvailableWithTotals;

    // Calcular altura restante desde currentIndex
    let remainingHeight = 0;
    for (let i = currentIndex; i < items.length; i++) {
      remainingHeight += itemHeights[i];
    }

    // ¿Caben todos los ítems restantes en esta página junto con los Totales?
    if (remainingHeight <= availableWithTotals) {
      pages.push({
        pageIndex: pageIdx,
        isFirstPage: isFirst,
        items: items.slice(currentIndex),
        showTotales: true,
        startIndex: currentIndex,
      });
      break;
    }

    // Si los ítems caben sin totales pero NO con totales, dejamos al menos 1 ítem para la siguiente página
    // para que la página de totales no quede vacía de ítems
    let accumulated = 0;
    let pageItemsCount = 0;
    const maxItemsOnThisPage = (remainingHeight <= availableNoTotals)
      ? Math.max(1, (items.length - currentIndex) - 1)
      : items.length - currentIndex;

    for (let i = currentIndex; i < currentIndex + maxItemsOnThisPage; i++) {
      const h = itemHeights[i];
      if (accumulated + h <= availableNoTotals || pageItemsCount === 0) {
        accumulated += h;
        pageItemsCount++;
      } else {
        break;
      }
    }

    pages.push({
      pageIndex: pageIdx,
      isFirstPage: isFirst,
      items: items.slice(currentIndex, currentIndex + pageItemsCount),
      showTotales: false,
      startIndex: currentIndex,
    });

    currentIndex += pageItemsCount;
    pageIdx++;
  }

  // Asegurar que la última página de ítems tenga el bloque de totales activado
  if (pages.length > 0 && !pages[pages.length - 1].showTotales) {
    const lastPage = pages[pages.length - 1];
    const lastPageItemsHeight = lastPage.items.reduce((sum, item) => sum + estimateItemHeight(item), 0);
    const availableWithTot = lastPage.isFirstPage ? page1AvailableWithTotals : contAvailableWithTotals;
    if (lastPageItemsHeight <= availableWithTot) {
      lastPage.showTotales = true;
    } else {
      pages.push({
        pageIndex: pageIdx,
        isFirstPage: false,
        items: [],
        showTotales: true,
        startIndex: items.length,
      });
    }
  }

  return pages;
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

  // Condiciones comerciales por defecto
  const defaultCondiciones = [
    "Forma de Pago: 50% de anticipo al inicio de los trabajos y 50% contra entrega conforme y paso a producción.",
    "Plazo de Entrega: Acordado según cronograma de desarrollo tras la confirmación del anticipo.",
    "Validez de la Propuesta: 15 días corridos a contar de la fecha de emisión del documento.",
    "Garantía y Continuidad: Incluye soporte técnico, hosting administrado y respaldo ante incidencias.",
  ];

  const condicionesTexto = data.condiciones_comerciales?.trim() 
    ? data.condiciones_comerciales.split("\n").filter(line => line.trim().length > 0)
    : defaultCondiciones;

  // Particionado dinámico de páginas
  const itemPages = useMemo(() => {
    return paginatePresupuesto(
      data.items || [],
      data.descripcion_proyecto || "",
      Boolean(data.servicios_opcionales && data.servicios_opcionales.length > 0),
      data.servicios_opcionales?.length || 0
    );
  }, [data.items, data.descripcion_proyecto, data.servicios_opcionales]);

  // Total de páginas = páginas de ítems + 1 página final de Cierre y Formalización
  const totalPages = itemPages.length + 1;

  return (
    <div id={id} className={`w-full relative pb-10 ${isPrinting ? "" : "min-h-[500px]"}`}>
      {/* Barra de Controles de Zoom Superior (solo en pantalla) */}
      {!isPrinting && (
        <div className="flex items-center justify-between gap-2 mb-4 px-2 select-none">
          <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>Formato Carta ({totalPages} {totalPages === 1 ? "Página" : "Páginas"}): {isZoomed ? "100% (Tamaño Real)" : "Ajuste Óptimo"}</span>
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
        {/* PÁGINAS DINÁMICAS DE PROPUESTA ECONÓMICA E ÍTEMS */}
        {/* ========================================================= */}
        {itemPages.map((page, pIdx) => {
          const currentPageNum = pIdx + 1;

          return (
            <div 
              key={`page-${pIdx}`}
              data-pdf-page="true"
              className="bg-white text-slate-900 w-[800px] h-[1035px] max-h-[1035px] p-10 overflow-hidden flex flex-col justify-between font-sans relative mx-auto rounded-xl border border-slate-200 shadow-xl"
              style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
            >
              {/* Parte Superior de la Página */}
              <div>
                {page.isFirstPage ? (
                  /* Membrete Completo Hoja SpA en Página 1 */
                  <>
                    <div className="flex justify-between items-start pb-5 border-b-2 border-slate-900">
                      <div className="space-y-1">
                        <img 
                          src="/logo.png" 
                          alt="Hoja SpA Logo" 
                          className="h-13 w-auto object-contain" 
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
                    <div className="grid grid-cols-2 gap-5 my-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
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
                          <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed whitespace-pre-wrap mt-0.5 line-clamp-3">
                            {data.descripcion_proyecto}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Encabezado Compacto de Continuación en Páginas Siguientes */
                  <div className="flex justify-between items-center pb-3 border-b-2 border-slate-900 mb-4">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src="/logo.png" 
                        alt="Hoja SpA Logo" 
                        className="h-7 w-auto object-contain" 
                        onError={(e) => { (e.target as HTMLImageElement).src = "/favicon.ico"; }}
                      />
                      <div>
                        <span className="font-black text-xs tracking-tight text-slate-900 uppercase">
                          SERVICIOS INFORMÁTICOS HOJA SPA
                        </span>
                        <span className="text-[9px] text-slate-400 ml-2 font-mono">RUT: 78.364.078-3</span>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-xs text-indigo-600">
                      PRESUPUESTO N° {data.numero || "0001"} &bull; CONTINUACIÓN ({currentPageNum}/{totalPages})
                    </div>
                  </div>
                )}

                {/* Tabla de Servicios / Ítems de esta página */}
                <div className="mt-2">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-900 text-left">
                        <th className="py-2 text-[9px] font-black uppercase tracking-wider text-slate-900">
                          Descripción y Alcance del Servicio
                        </th>
                        <th className="py-2 text-center text-[9px] font-black uppercase tracking-wider text-slate-900 w-16">
                          Cant.
                        </th>
                        <th className="py-2 text-right text-[9px] font-black uppercase tracking-wider text-slate-900 w-28">
                          Precio Unit.
                        </th>
                        <th className="py-2 text-right text-[9px] font-black uppercase tracking-wider text-slate-900 w-28">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {page.items.length > 0 ? (
                        page.items.map((item, index) => (
                          <tr key={index} className="align-top">
                            <td className="py-2.5 pr-4">
                              <p className="font-bold text-slate-900 leading-snug">
                                {item.descripcion}
                              </p>
                              {item.detalle && item.detalle.trim() && (
                                <div className="mt-1 text-[10px] text-slate-600 font-normal leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-indigo-200">
                                  {item.detalle}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 text-center font-medium text-slate-600">
                              {item.cantidad || 1}
                            </td>
                            <td className="py-2.5 text-right font-medium text-slate-600 font-mono">
                              {formatCurrencyShort(item.precio)}
                            </td>
                            <td className="py-2.5 text-right font-bold text-slate-900 font-mono">
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

                {/* Servicios Opcionales (solo si corresponden en esta página con totales) */}
                {page.showTotales && data.servicios_opcionales && data.servicios_opcionales.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] uppercase tracking-widest font-black text-slate-500">
                        Servicios Opcionales / Adicionales Sugeridos
                      </span>
                      <span className="text-[8.5px] font-bold text-slate-400">
                        * No incluidos en el total inicial
                      </span>
                    </div>
                    <div className="space-y-1">
                      {data.servicios_opcionales.map((opt, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10.5px] text-slate-700">
                          <span className="font-medium">• {opt.descripcion} <span className="text-[9.5px] text-slate-500">({opt.frecuencia || "Adicional"})</span></span>
                          <span className="font-bold text-slate-900 font-mono">{formatCurrencyShort(opt.precio)} + IVA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Parte Inferior: Totales y Pie de Página */}
              <div className="pt-3 border-t border-slate-200">
                {page.showTotales ? (
                  <div className="flex justify-end mb-3">
                    <div className="w-72 space-y-1">
                      <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>Subtotal Neto</span>
                        <span className="font-bold text-slate-900 font-mono">{formatCurrencyShort(calculatedNeto)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>IVA (19%)</span>
                        <span className="font-bold text-slate-900 font-mono">{formatCurrencyShort(calculatedIva)}</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-1.5 border-t-2 border-slate-900">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Total Propuesta
                        </span>
                        <div className="text-right">
                          <span className="text-xl font-black text-indigo-700 font-mono">
                            {formatCurrencyShort(calculatedTotal)}
                          </span>
                          {isUF && (
                            <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                              ≈ ${(calculatedTotal * valorUF).toLocaleString("es-CL")} CLP (UF: ${valorUF.toLocaleString("es-CL")})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-right text-[10px] text-indigo-600 font-bold mb-2">
                    &bull; Continúa detalle de servicios en página {currentPageNum + 1} &rarr;
                  </div>
                )}

                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold pt-2 border-t border-slate-100 uppercase tracking-widest">
                  <span>Página {currentPageNum} de {totalPages} &bull; Propuesta Económica &bull; Hoja SpA</span>
                  <span>
                    {page.showTotales 
                      ? `Continúa en Página ${totalPages} con Condiciones y Cuentas Bancarias \u2192`
                      : `Página ${currentPageNum} de ${totalPages} \u2022 Detalle de Ítems`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* ========================================================= */}
        {/* PÁGINA FINAL: CONDICIONES, DATOS BANCARIOS Y CONTACTO */}
        {/* ========================================================= */}
        <div 
          data-pdf-page="true"
          className="bg-white text-slate-900 w-[800px] h-[1035px] max-h-[1035px] p-10 overflow-hidden flex flex-col justify-between font-sans relative mx-auto rounded-xl border border-slate-200 shadow-xl"
          style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
        >
          {/* Encabezado Superior Página Final */}
          <div>
            <div className="flex justify-between items-center pb-4 border-b-2 border-slate-900 mb-5">
              <div className="flex items-center gap-2">
                <img 
                  src="/logo.png" 
                  alt="Hoja SpA Logo" 
                  className="h-8 w-auto object-contain" 
                  onError={(e) => { (e.target as HTMLImageElement).src = "/favicon.ico"; }}
                />
                <span className="font-black text-xs tracking-tight text-slate-900 uppercase">
                  SERVICIOS INFORMÁTICOS HOJA SPA
                </span>
              </div>
              <div className="font-mono font-bold text-xs text-indigo-600">
                PRESUPUESTO N° {data.numero || "0001"} &bull; TÉRMINOS Y CONDICIONES
              </div>
            </div>

            {/* 1. Condiciones Comerciales del Presupuesto */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="h-5 w-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[10px]">
                  1
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Condiciones Comerciales y Términos del Servicio
                </h3>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                {condicionesTexto.map((linea, index) => (
                  <div key={index} className="flex items-start gap-2 text-[11px] text-slate-700 leading-relaxed">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
                    <span>{linea}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Cuentas de Transferencia Bancaria */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="h-5 w-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[10px]">
                  2
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Datos para Transferencia Bancaria
                </h3>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Razón Social</span>
                    <span className="font-bold text-slate-900">{config?.nombre_titular || "SERVICIOS INFORMATICOS HOJA SPA"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">RUT</span>
                    <span className="font-mono font-bold text-slate-900">{config?.rut || "78.364.078-3"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Banco</span>
                    <span className="font-bold text-slate-900">{config?.banco || "Banco Falabella"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Tipo de Cuenta</span>
                    <span className="font-bold text-slate-900">{config?.tipo_cuenta || "Cuenta Corriente"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">N° de Cuenta</span>
                    <span className="font-mono font-bold text-slate-900">{config?.numero_cuenta || "1-983-101480-2"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Email para Comprobante</span>
                    <span className="font-bold text-indigo-600">{config?.email_pago || "devhoja@gmail.com"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Canales de Contacto Directo */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2.5">
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

          {/* Parte Inferior: Recuadro de Aceptación / Firma y Pie de Página Final */}
          <div>
            <div className="p-4 rounded-xl border border-slate-300 bg-white mb-3">
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
              <span>Página {totalPages} de {totalPages} &bull; Hoja SpA &bull; Documento Institucional</span>
              <span>Validez 15 días corridos desde su emisión</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
