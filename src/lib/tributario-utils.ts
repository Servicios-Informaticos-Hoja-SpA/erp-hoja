import { EventoFinanciero, ProyeccionTributariaF29 } from "@/lib/types";

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

      // Por defecto en Hoja SpA, las ventas y servicios son con factura afecta a menos que se indique lo contrario
      const esAfecta = e.aplicaFactura !== false;

      if (esAfecta) {
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
      } else {
        ventasNetasTotal += valorPrincipal;
        totalFacturadoVentas += valorPrincipal;
      }
    } else if (e.tipo === "egreso") {
      totalEgresosMes += valorPrincipal;

      // Compras locales con factura chilena deducible de IVA (Crédito fiscal)
      if (e.deducibleIva) {
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

  // Alerta de Calendario SII (El día 20 vence el F29 electrónico)
  const diaActual = fechaReferencia.getDate();
  const mesActualRef = fechaReferencia.getMonth() + 1;
  const anioActualRef = fechaReferencia.getFullYear();

  // El período a pagar en el día 20 del mes en curso corresponde a las operaciones del mes anterior
  // o si estamos calculando para el mes en curso, verificamos si aplica la ventana de alerta (días 10 al 20)
  const activaVentana = diaActual >= 10 && diaActual <= 20;
  const diasRestantes = activaVentana ? 20 - diaActual : 0;
  const esCritica = activaVentana && diasRestantes <= 3; // Menos de 3 días para el día 20 (días 17 al 20)

  const nombreMesActual = NOMBRES_MESES[fechaReferencia.getMonth()];
  const fechaVence = `20 de ${nombreMesActual}`;

  const alertaVencimiento = activaVentana
    ? {
        activa: true,
        esCritica,
        fechaVence,
        diasRestantes,
        mensaje: `Atención: Declaración y pago F29 vence el ${fechaVence}. Provisión a pagar estimada: ${formatCLP(f29Estimado)} CLP`,
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
 */
export function obtenerAlertaCalendarioSII(
  eventos: EventoFinanciero[],
  fechaActual: Date = new Date()
): {
  activa: boolean;
  esCritica: boolean;
  diasRestantes: number;
  f29Estimado: number;
  periodoDeclarado: string;
  mensaje: string;
  fechaVence: string;
} | null {
  const dia = fechaActual.getDate();
  if (dia < 10 || dia > 20) {
    return null;
  }

  // En el SII de Chile, el día 20 de cada mes se declara y paga el F29 de las operaciones del mes inmediatamente anterior.
  // Ejemplo: el 20 de Octubre se paga el F29 de Septiembre.
  // Sin embargo, si aún no hay compras/ventas cargadas en el mes anterior, evaluamos también el mes en curso para no mostrar $0 si los registros se imputan al mes actual.
  let mesAtras = fechaActual.getMonth(); // 0-based: mes anterior (ej. si Octubre es 9, mesAtras = 8 -> Septiembre)
  let anioAtras = fechaActual.getFullYear();
  if (mesAtras === 0) {
    mesAtras = 12;
    anioAtras -= 1;
  }

  const proyeccionMesAnterior = calcularF29Mes(eventos, anioAtras, mesAtras, fechaActual);
  const proyeccionMesActual = calcularF29Mes(eventos, fechaActual.getFullYear(), fechaActual.getMonth() + 1, fechaActual);

  // Tomamos la estimación relevante (si el mes anterior tiene ventas/F29 se usa ese, sino el mes en curso)
  const proyeccionRelevante =
    proyeccionMesAnterior.f29Estimado > 0 ? proyeccionMesAnterior : proyeccionMesActual;

  const diasRestantes = 20 - dia;
  const esCritica = diasRestantes <= 3;
  const nombreMesPago = NOMBRES_MESES[fechaActual.getMonth()];
  const fechaVence = `20 de ${nombreMesPago}`;
  const f29Estimado = proyeccionRelevante.f29Estimado;

  return {
    activa: true,
    esCritica,
    diasRestantes,
    f29Estimado,
    periodoDeclarado: proyeccionRelevante.nombreMes,
    fechaVence,
    mensaje: `Atención: Declaración y pago F29 vence el ${fechaVence}. Provisión a pagar estimada: ${formatCLP(f29Estimado)} CLP`,
  };
}
