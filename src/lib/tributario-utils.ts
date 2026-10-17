import { EventoFinanciero, ProyeccionTributariaF29, DeclaracionF29 } from "@/lib/types";

export const PPM_TASA_REFERENCIAL = 0.0025; // 0.25% sobre ventas netas afectas
export const IVA_TASA_CHILE = 0.19; // 19% IVA en Chile

export const NOMBRES_MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const formatCLP = (val: number = 0) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);

/**
 * Calcula el desglose tributario automático de Neto, IVA (19%) y Total
 */
export function calcularDesgloseIva(monto: number, base: "neto" | "total"): {
  montoNeto: number;
  ivaMonto: number;
  montoTotal: number;
} {
  if (base === "neto") {
    const montoNeto = Math.max(0, Math.round(monto));
    const ivaMonto = Math.round(montoNeto * IVA_TASA_CHILE);
    const montoTotal = montoNeto + ivaMonto;
    return { montoNeto, ivaMonto, montoTotal };
  } else {
    const montoTotal = Math.max(0, Math.round(monto));
    const montoNeto = Math.round(montoTotal / (1 + IVA_TASA_CHILE));
    const ivaMonto = montoTotal - montoNeto;
    return { montoNeto, ivaMonto, montoTotal };
  }
}

/**
 * Calcula la proyección tributaria mensual del F29 (SII Chile) para un año y mes específico
 */
export function calcularF29Mes(
  eventos: EventoFinanciero[],
  anio: number,
  mes: number, // 1 a 12
  fechaReferencia: Date = new Date()
): ProyeccionTributariaF29 {
  const mesStr = String(mes).padStart(2, "0");
  const periodoStr = `${anio}-${mesStr}`;
  const nombreMes = `${NOMBRES_MESES[mes - 1]} ${anio}`;

  // Filtrar eventos del mes seleccionado según su fecha de vencimiento o registro
  const eventosMes = eventos.filter((e) => {
    if (!e.fechaVencimiento) return false;
    const [evAnio, evMes] = e.fechaVencimiento.split("-").map(Number);
    return evAnio === anio && evMes === mes;
  });

  let ventasNetasTotal = 0;
  let ivaDebitoTotal = 0;
  let totalFacturadoVentas = 0;
  let totalIngresosMes = 0;

  let comprasNetasDeducibles = 0;
  let ivaCreditoTotal = 0;
  let totalEgresosMes = 0;

  eventosMes.forEach((e) => {
    const valorPrincipal = e.montoTotal ?? e.monto ?? 0;

    if (e.tipo === "ingreso") {
      totalIngresosMes += valorPrincipal;

      // REGLA ESTRICTA: Ventas facturadas debe ser SOLO lo que efectivamente tiene factura emitida
      // NUNCA saldos iniciales, aportes de capital ni ingresos sin factura
      const conceptoLower = (e.concepto || "").toLowerCase();
      const esSaldoInicial = 
        (e.categoria as string) === "saldo_inicial" ||
        conceptoLower.includes("saldo inicial") ||
        conceptoLower.includes("caja inicial") ||
        conceptoLower.includes("aporte de capital") ||
        conceptoLower.includes("ingreso inicial") ||
        e.tipoComprobante === "sin_comprobante" ||
        e.aplicaFactura === false;

      const tieneFactura = !esSaldoInicial && Boolean(
        (e.numeroFactura && e.numeroFactura.trim().length > 0) ||
        e.tipoComprobante === "factura" ||
        (e.aplicaFactura === true && e.tipoComprobante !== "sin_comprobante" && e.tipoComprobante !== "boleta")
      );

      if (tieneFactura) {
        let neto = e.montoNeto;
        let iva = e.ivaMonto;

        if (neto === undefined || iva === undefined) {
          const calc = calcularDesgloseIva(valorPrincipal, "total");
          neto = calc.montoNeto;
          iva = calc.ivaMonto;
        }

        ventasNetasTotal += neto;
        ivaDebitoTotal += iva;
        totalFacturadoVentas += valorPrincipal;
      }
      // Los ingresos no facturados (saldo inicial, aportes, boletas exentas) solo forman parte
      // de la caja disponible (totalIngresosMes), sin generar débito fiscal F29.
    } else if (e.tipo === "egreso") {
      totalEgresosMes += valorPrincipal;

      // REGLA ESTRICTA: Solo compras con factura asociada a proyecto y deducibles computan crédito fiscal
      const tieneProyecto = Boolean((e.proyectoId && e.proyectoId !== "ninguno") || e.referenciaId);
      const tieneFactura = Boolean(
        (e.numeroFactura && e.numeroFactura.trim().length > 0) ||
        e.tipoComprobante === "factura"
      ) && e.tipoComprobante !== "sin_comprobante" && e.tipoComprobante !== "boleta";
      const esDeducible = e.deducibleIva !== false;

      const esGastoFacturableProyecto = tieneProyecto && tieneFactura && esDeducible;

      if (esGastoFacturableProyecto) {
        let neto = e.montoNeto;
        let iva = e.ivaMonto;

        if (neto === undefined || iva === undefined) {
          const calc = calcularDesgloseIva(valorPrincipal, "total");
          neto = calc.montoNeto;
          iva = calc.ivaMonto;
        }

        comprasNetasDeducibles += neto;
        ivaCreditoTotal += iva;
      }
    }
  });

  // Cálculo de IVA a pagar o remanente a favor
  const ivaDiferencia = ivaDebitoTotal - ivaCreditoTotal;
  const ivaAPagar = Math.max(0, ivaDiferencia);
  const remanenteAFavor = ivaDiferencia < 0 ? Math.abs(ivaDiferencia) : 0;

  // Cálculo de PPM (0.25% sobre ventas netas)
  const ppmTotal = Math.round(ventasNetasTotal * PPM_TASA_REFERENCIAL);

  // Estimación total F29
  const f29Estimado = ivaAPagar + ppmTotal;

  // Caja Líquida Real Disponible = Ingresos - Egresos - Provisión F29
  const saldoOperativo = totalIngresosMes - totalEgresosMes;
  const cajaLiquidaRealDisponible = Math.max(0, saldoOperativo - f29Estimado);

  // Alerta de Calendario SII (El día 20 vence el F29 electrónico a mes vencido)
  const diaActual = fechaReferencia.getDate();
  const mesActualRef = fechaReferencia.getMonth() + 1;
  const anioActualRef = fechaReferencia.getFullYear();

  // En Chile, el IVA de las operaciones del mes M (del 1 al último día de M) se declara y paga entre el 10 y 20 de M+1
  let mesPagoNum = mes + 1;
  let anioPagoNum = anio;
  if (mesPagoNum > 12) {
    mesPagoNum = 1;
    anioPagoNum += 1;
  }
  const nombreMesPago = NOMBRES_MESES[mesPagoNum - 1];
  const fechaVence = `20 de ${nombreMesPago}`;

  const esMesDePago = anioActualRef === anioPagoNum && mesActualRef === mesPagoNum;
  const activaVentana = esMesDePago && diaActual >= 10 && diaActual <= 20;
  const diasRestantes = activaVentana ? 20 - diaActual : 0;
  const esCritica = activaVentana && diasRestantes <= 3;

  const sinFacturacion = f29Estimado === 0 && totalFacturadoVentas === 0;
  const mensajeAlerta = sinFacturacion
    ? `Atención: Sin facturación en ${nombreMes}. Recuerda completar el F29 sin movimiento antes del ${fechaVence} para evitar multas del SII.`
    : `Atención: Declaración y pago F29 vence el ${fechaVence} (período ${nombreMes}). Provisión a pagar estimada: ${formatCLP(f29Estimado)} CLP.`;

  const alertaVencimiento = activaVentana
    ? {
        activa: true,
        esCritica,
        fechaVence,
        diasRestantes,
        mensaje: mensajeAlerta,
      }
    : undefined;

  return {
    periodo: periodoStr,
    nombreMes,
    ventasNetasTotal,
    ivaDebitoTotal,
    comprasNetasDeducibles,
    ivaCreditoTotal,
    ivaAPagar,
    remanenteAFavor,
    ppmTasa: PPM_TASA_REFERENCIAL,
    ppmTotal,
    f29Estimado,
    totalFacturadoVentas,
    cajaLiquidaRealDisponible,
    alertaVencimiento,
  };
}

/**
 * Obtiene la alerta global del F29 si estamos en el rango de calendario del SII (días 10 al 20)
 * REGLA TRIBUTARIA SII: El pago de IVA es a mes vencido.
 * Lo facturado en el mes anterior (hasta su último día) se declara y paga entre el 10 y 20 del mes en curso.
 * Si no hubo facturación, es obligatorio declarar el F29 sin movimiento para evitar multas del SII.
 */
export function obtenerAlertaCalendarioSII(
  eventos: EventoFinanciero[],
  fechaActual: Date = new Date(),
  declaracionesF29: DeclaracionF29[] = []
): {
  activa: boolean;
  esCritica: boolean;
  diasRestantes: number;
  f29Estimado: number;
  periodoDeclarado: string;
  periodoFiscalVencido: string;
  fechaVence: string;
  mensaje: string;
  sinMovimiento: boolean;
  yaDeclarado: boolean;
  declaracionRegistrada?: DeclaracionF29;
  proyeccionMesEnCurso: {
    periodo: string;
    nombreMes: string;
    mesPago: string;
    fechaVence: string;
    f29Estimado: number;
    totalFacturadoVentas: number;
    ventasNetas: number;
    ivaDebito: number;
    ivaCredito: number;
    ppm: number;
  };
} | null {
  const dia = fechaActual.getDate();
  if (dia < 10 || dia > 20) {
    return null;
  }

  // 1. Período vencido que corresponde declarar en la ventana del 10 al 20
  let mesAtras = fechaActual.getMonth(); // 0-based: si es Octubre (9), mesAtras = 8 (Septiembre -> mes 9 en 1-based)
  let anioAtras = fechaActual.getFullYear();
  if (mesAtras === 0) {
    mesAtras = 12;
    anioAtras -= 1;
  }

  const periodoFiscalVencido = `${anioAtras}-${String(mesAtras).padStart(2, "0")}`;
  const proyeccionMesAnterior = calcularF29Mes(eventos, anioAtras, mesAtras, fechaActual);

  // 2. Comprobar si este período vencido ya fue marcado como declarado ante el SII
  const declaracionRegistrada = declaracionesF29.find((d) => d.periodo === periodoFiscalVencido);
  const yaDeclarado = Boolean(declaracionRegistrada);

  // 3. Proyección del mes en curso (ej. Octubre, que vence el 20 de Noviembre)
  const mesActualNum = fechaActual.getMonth() + 1;
  const anioActualNum = fechaActual.getFullYear();
  const periodoActualStr = `${anioActualNum}-${String(mesActualNum).padStart(2, "0")}`;
  const proyeccionMesActual = calcularF29Mes(eventos, anioActualNum, mesActualNum, fechaActual);

  let mesPagoSiguiente = mesActualNum + 1;
  let anioPagoSiguiente = anioActualNum;
  if (mesPagoSiguiente > 12) {
    mesPagoSiguiente = 1;
    anioPagoSiguiente += 1;
  }
  const nombreMesPagoSiguiente = NOMBRES_MESES[mesPagoSiguiente - 1];
  const fechaVenceSiguiente = `20 de ${nombreMesPagoSiguiente}`;

  const proyeccionMesEnCurso = {
    periodo: periodoActualStr,
    nombreMes: proyeccionMesActual.nombreMes,
    mesPago: `${anioPagoSiguiente}-${String(mesPagoSiguiente).padStart(2, "0")}`,
    fechaVence: fechaVenceSiguiente,
    f29Estimado: proyeccionMesActual.f29Estimado,
    totalFacturadoVentas: proyeccionMesActual.totalFacturadoVentas,
    ventasNetas: proyeccionMesActual.ventasNetasTotal,
    ivaDebito: proyeccionMesActual.ivaDebitoTotal,
    ivaCredito: proyeccionMesActual.ivaCreditoTotal,
    ppm: proyeccionMesActual.ppmTotal,
  };

  const diasRestantes = 20 - dia;
  const nombreMesPago = NOMBRES_MESES[fechaActual.getMonth()];
  const fechaVence = `20 de ${nombreMesPago}`;
  const f29Estimado = proyeccionMesAnterior.f29Estimado;
  const periodoDeclarado = proyeccionMesAnterior.nombreMes;
  const sinMovimiento = f29Estimado === 0 && proyeccionMesAnterior.totalFacturadoVentas === 0;

  let mensaje = "";
  if (yaDeclarado) {
    mensaje = `✓ F29 de ${periodoDeclarado} ya fue emitido y declarado ante el SII. Próxima declaración: ${proyeccionMesEnCurso.nombreMes} (vence el ${fechaVenceSiguiente}). Proyección con facturación acumulada actual: ${formatCLP(proyeccionMesEnCurso.f29Estimado)} CLP.`;
  } else if (sinMovimiento) {
    mensaje = `Sin facturación registrada en ${periodoDeclarado}. Recuerda completar y declarar el F29 sin movimiento antes del ${fechaVence} para evitar multas del SII.`;
  } else {
    mensaje = `Declaración y pago F29 vence el ${fechaVence} (período ${periodoDeclarado}). Provisión a pagar estimada: ${formatCLP(f29Estimado)} CLP.`;
  }

  return {
    activa: !yaDeclarado,
    esCritica: !yaDeclarado && diasRestantes <= 3,
    diasRestantes,
    f29Estimado,
    periodoDeclarado,
    periodoFiscalVencido,
    fechaVence,
    mensaje,
    sinMovimiento,
    yaDeclarado,
    declaracionRegistrada,
    proyeccionMesEnCurso,
  };
}
