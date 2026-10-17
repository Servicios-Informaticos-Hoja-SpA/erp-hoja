import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { collection, getDocs, DocumentData } from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { AlertaOperativa, Cliente, Presupuesto, Proyecto, EventoFinanciero, HitoPago, Subscription, GastoOperativo, FechaRegistro, DeclaracionF29 } from "@/lib/types";
import { obtenerAlertaCalendarioSII } from "@/lib/tributario-utils";

let serverMetricsCache: { data: any; timestamp: number } | null = null;
const SERVER_METRICS_CACHE_TTL = 15 * 1000;

export async function GET(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const noCache = searchParams.get("nocache") === "true";

    if (!noCache && serverMetricsCache && (Date.now() - serverMetricsCache.timestamp < SERVER_METRICS_CACHE_TTL)) {
      return NextResponse.json(serverMetricsCache.data, {
        headers: { "X-Cache": "HIT" }
      });
    }

    // 1. Obtener datos de Firestore en paralelo
    const [presupuestosSnap, clientesSnap, proyectosSnap, flujoSnap, subscriptionsSnap, expensesSnap, f29Snap] = await Promise.all([
      getDocs(collection(db, "presupuestos")),
      getDocs(collection(db, "clientes")),
      getDocs(collection(db, "proyectos")).catch(() => ({ docs: [] as DocumentData[] })),
      getDocs(collection(db, "flujo_caja")).catch(() => ({ docs: [] as DocumentData[] })),
      getDocs(collection(db, "subscriptions")).catch(() => ({ docs: [] as DocumentData[] })),
      getDocs(collection(db, "expenses")).catch(() => ({ docs: [] as DocumentData[] })),
      getDocs(collection(db, "f29_declaraciones")).catch(() => ({ docs: [] as DocumentData[] })),
    ]);

    const presupuestos = presupuestosSnap.docs.map(d => ({ id: d.id, ...d.data() } as Presupuesto));
    const clientes = clientesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Cliente));
    const proyectos = proyectosSnap.docs.map(d => ({ id: d.id, ...d.data() } as Proyecto));
    const flujoEventos = flujoSnap.docs.map(d => ({ id: d.id, ...d.data() } as EventoFinanciero));
    const subscriptions = subscriptionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subscription));
    const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() } as GastoOperativo));
    const declaracionesF29 = f29Snap.docs.map(d => ({ id: d.id, ...d.data() } as DeclaracionF29));

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 2. Calcular Ingresos del Mes (Cobrado vs Por Cobrar)
    let cobradoMes = 0;
    let porCobrarMes = 0;

    // A) Desde hitos de pago de proyectos
    proyectos.forEach((p: Proyecto) => {
      if (Array.isArray(p.hitosPago)) {
        p.hitosPago.forEach((h: HitoPago) => {
          const hitoFecha = h.fechaCobroReal || h.fechaEstimada;
          if (hitoFecha) {
            const d = new Date(hitoFecha);
            if (!isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
              if (h.estado === "cobrado") {
                cobradoMes += Number(h.monto || 0);
              } else {
                porCobrarMes += Number(h.monto || 0);
              }
            }
          }
        });
      }
    });

    // B) Si no hay proyectos con hitos en el mes, usamos presupuestos emitidos en el mes como proyección
    if (cobradoMes === 0 && porCobrarMes === 0) {
      presupuestos.forEach((pr: Presupuesto) => {
        let pDate: Date | null = null;
        if (typeof pr.fecha === "string") {
          pDate = new Date(pr.fecha);
        } else if (pr.fecha && typeof pr.fecha === "object" && "seconds" in pr.fecha) {
          pDate = new Date(pr.fecha.seconds * 1000);
        }

        if (pDate && !isNaN(pDate.getTime()) && pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
          const totalNeto = pr.totales?.total || 0;
          if (pr.estado === "aprobado") {
            cobradoMes += totalNeto * 0.5; // Estimación base anticipo
            porCobrarMes += totalNeto * 0.5;
          } else {
            porCobrarMes += totalNeto;
          }
        }
      });
    }

    // 3. Cantidad de proyectos activos agrupados por fase
    const fasesMap: Record<string, { label: string; count: number }> = {
      planificacion: { label: "Planificación", count: 0 },
      desarrollo: { label: "En Desarrollo", count: 0 },
      revision_qa: { label: "En Revisión / QA", count: 0 },
      entregado: { label: "Entregado", count: 0 },
      pausado: { label: "Pausado", count: 0 },
    };

    let activosCount = 0;
    proyectos.forEach((p: Proyecto) => {
      const f = p.fase || "planificacion";
      if (fasesMap[f]) {
        fasesMap[f].count += 1;
      } else {
        fasesMap[f] = { label: f, count: 1 };
      }
      if (f !== "entregado" && f !== "cancelado") {
        activosCount += 1;
      }
    });

    const proyectosPorFase = Object.keys(fasesMap).map(faseKey => ({
      fase: faseKey,
      label: fasesMap[faseKey].label,
      cantidad: fasesMap[faseKey].count,
    }));

    // 4. Generación de Alertas del Día
    const alertas: AlertaOperativa[] = [];
    const todayStr = now.toISOString().split("T")[0];

    // Alertas A: Clientes con próximo contacto hoy o vencido
    clientes.forEach((c: Cliente) => {
      if (c.proximoContacto && c.proximoContacto.fecha && c.proximoContacto.estado !== "realizado") {
        const contactDateStr = c.proximoContacto.fecha.split("T")[0];
        const isToday = contactDateStr === todayStr;
        const isOverdue = contactDateStr < todayStr;

        if (isToday || isOverdue) {
          alertas.push({
            id: `cli-${c.id}`,
            tipo: "cliente",
            prioridad: isOverdue ? "alta" : "media",
            titulo: `${isOverdue ? "⚠️ Seguimiento vencido:" : "📅 Contacto hoy:"} ${c.nombre}`,
            descripcion: c.proximoContacto.motivo || "Llamada o reunión agendada de seguimiento comercial",
            fechaRef: contactDateStr,
            enlaceAccion: `/clientes?id=${c.id}`,
            textoAccion: "Ver Cliente",
            telefonoWhatsApp: c.telefono,
            mensajeWhatsApp: `Hola ${c.nombre}, te contacto desde Hoja SpA para dar seguimiento a nuestra conversación sobre ${c.proximoContacto.motivo || "tus requerimientos tecnológicos"}.`
          });
        }
      }
    });

    // Alertas B: Presupuestos sin respuesta tras más de 7 días
    presupuestos.forEach((pr: Presupuesto) => {
      if (!pr.estado || pr.estado === "emitido" || pr.estado === "borrador") {
        let pDate: Date | null = null;
        if (typeof pr.fecha === "string") {
          pDate = new Date(pr.fecha);
        } else if (pr.fecha && typeof pr.fecha === "object" && "seconds" in pr.fecha) {
          pDate = new Date(pr.fecha.seconds * 1000);
        }

        if (pDate && !isNaN(pDate.getTime())) {
          const diffDays = Math.floor((now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 7 && !pr.proyecto_id) {
            alertas.push({
              id: `pre-${pr.id}`,
              tipo: "presupuesto",
              prioridad: diffDays >= 14 ? "alta" : "media",
              titulo: `Cotización N° ${pr.numero} sin respuesta (${diffDays} días)`,
              descripcion: `Cliente: ${pr.cliente_nombre}. No se ha registrado aprobación ni rechazo.`,
              fechaRef: pDate.toISOString().split("T")[0],
              enlaceAccion: `/presupuestos`,
              textoAccion: "Ver Cotización",
              telefonoWhatsApp: "",
              mensajeWhatsApp: `Hola ${pr.cliente_nombre}, te escribo de Servicios Informáticos Hoja SpA para consultar si pudiste revisar la cotización N° ${pr.numero}. ¿Tienes alguna duda técnica o comercial?`
            });
          }
        }
      }
    });

    // Alertas C: Proyectos con fecha de entrega próxima (≤ 3 días o vencida)
    proyectos.forEach((p: Proyecto) => {
      if (p.fase !== "entregado" && p.fase !== "cancelado" && p.fechaEntregaComprometida) {
        const entregaDate = new Date(p.fechaEntregaComprometida);
        if (!isNaN(entregaDate.getTime())) {
          const diffDays = Math.ceil((entregaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 3) {
            const esVencido = diffDays < 0;
            alertas.push({
              id: `proy-${p.id}`,
              tipo: "proyecto",
              prioridad: "alta",
              titulo: esVencido 
                ? `🚨 Entrega sobrepasada: ${p.nombre}` 
                : `⏳ Entrega próxima: ${p.nombre} (${diffDays === 0 ? "HOY" : `en ${diffDays} días`})`,
              descripcion: `Cliente: ${p.clienteNombre}. Fase actual: ${fasesMap[p.fase]?.label || p.fase}.`,
              fechaRef: p.fechaEntregaComprometida,
              enlaceAccion: `/proyectos?id=${p.id}`,
              textoAccion: "Ver Proyecto",
            });
          }
        }
      }
    });

    // Alertas D: Eventos de flujo de caja (cobros recurrentes o renovaciones en 3-5 días)
    flujoEventos.forEach((fe: EventoFinanciero) => {
      if (fe.estado === "pendiente" && fe.fechaVencimiento) {
        const vDate = new Date(fe.fechaVencimiento);
        if (!isNaN(vDate.getTime())) {
          const diffDays = Math.ceil((vDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const limiteAviso = fe.recordatorioDiasAntes || 5;
          if (diffDays <= limiteAviso && diffDays >= -2) {
            alertas.push({
              id: `flujo-${fe.id}`,
              tipo: "flujo_caja",
              prioridad: diffDays <= 1 ? "alta" : "media",
              titulo: fe.tipo === "ingreso" ? `💰 Cobro pendiente: ${fe.concepto}` : `💳 Renovación técnica: ${fe.concepto}`,
              descripcion: `Monto: $${new Intl.NumberFormat('es-CL').format(fe.monto)}. Vence: ${fe.fechaVencimiento}.`,
              fechaRef: fe.fechaVencimiento,
              enlaceAccion: `/flujo-caja`,
              textoAccion: "Ver Finanzas",
            });
          }
        }
      }
    });

    // Alerta de Calendario Tributario SII (F29 - días 10 al 20 de cada mes a mes vencido)
    const alertaF29 = obtenerAlertaCalendarioSII(flujoEventos, now, declaracionesF29);
    if (alertaF29 && alertaF29.activa) {
      alertas.push({
        id: `f29-calendario-sii-${now.getFullYear()}-${now.getMonth() + 1}`,
        tipo: "flujo_caja",
        prioridad: alertaF29.esCritica ? "alta" : "media",
        severidad: alertaF29.esCritica ? "alta" : "media",
        titulo: alertaF29.sinMovimiento
          ? (alertaF29.esCritica ? `🚨 F29 sin movimiento vence en ${alertaF29.diasRestantes} días` : `⚖️ Recordatorio F29 sin movimiento (${alertaF29.fechaVence})`)
          : (alertaF29.esCritica 
            ? `🚨 Declaración F29 (SII) Vence en ${alertaF29.diasRestantes} días` 
            : `⚖️ Declaración y Pago F29 (${alertaF29.fechaVence})`),
        descripcion: alertaF29.mensaje,
        monto: alertaF29.f29Estimado,
        fechaRef: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-20`,
        enlaceAccion: `/flujo-caja`,
        textoAccion: "Ver Flujo de Caja",
      });
    }

    // 5. Cálculo de Piso Recurrente (MRR) y Suscripciones
    let mrrCLP = 0;
    let mrrUF = 0;
    let subsPorVencer = 0;
    let subsVencidas = 0;
    let subsActivasCount = 0;
    const valorUFBase = 38000;

    subscriptions.forEach((sub: Subscription) => {
      if (sub.estado !== "suspendido") {
        subsActivasCount += 1;
        const montoMensual = sub.cicloFacturacion === "anual" ? sub.monto / 12 : sub.monto;
        if (sub.moneda === "UF") {
          mrrUF += montoMensual;
          mrrCLP += montoMensual * (sub.valorUFRef || valorUFBase);
        } else {
          mrrCLP += montoMensual;
          mrrUF += montoMensual / (sub.valorUFRef || valorUFBase);
        }

        if (sub.fechaCorte) {
          const diffDays = Math.ceil((new Date(sub.fechaCorte).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            subsVencidas += 1;
          } else if (diffDays <= 7) {
            subsPorVencer += 1;
          }
        }
      }
    });

    // 6. Cálculo de Margen Bruto Real del Mes
    let costosOperativosMes = 0;
    expenses.forEach((exp: GastoOperativo) => {
      if (exp.fecha) {
        const d = new Date(exp.fecha);
        if (!isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          costosOperativosMes += exp.monto;
        }
      }
    });

    const margenBrutoMonto = Math.max(0, cobradoMes - costosOperativosMes);
    const margenPorcentaje = cobradoMes > 0 ? Math.round((margenBrutoMonto / cobradoMes) * 100) : 0;

    // 7. Contactos sin contactar (primeros 5 y contador total)
    const contactosSinContactarList = clientes
      .filter((c: Cliente) => {
        if (c.activo === false) return false;
        if (c.sub_estado === "sin_contacto") return true;
        if (c.tipo_registro === "prospecto" && !c.sub_estado) return true;
        return false;
      })
      .sort((a, b) => {
        const getMs = (val?: FechaRegistro) => {
          if (!val) return 0;
          if (typeof val === "string") return new Date(val).getTime();
          return val.seconds * 1000;
        };
        return getMs(b.createdAt) - getMs(a.createdAt);
      });

    const totalContactosSinContactar = contactosSinContactarList.length;
    const contactosSinContactar = contactosSinContactarList.slice(0, 5);

    // 8. Presupuestos en negociación (primeros 5, contador y monto total)
    const presupuestosEnNegociacionList = presupuestos
      .filter((p: Presupuesto) => p.estado === "en_negociacion")
      .sort((a, b) => {
        const getMs = (val?: FechaRegistro) => {
          if (!val) return 0;
          if (typeof val === "string") return new Date(val).getTime();
          return val.seconds * 1000;
        };
        return getMs(b.fecha) - getMs(a.fecha);
      });

    const totalPresupuestosEnNegociacion = presupuestosEnNegociacionList.length;
    const montoTotalNegociacion = presupuestosEnNegociacionList.reduce((acc, p) => {
      return acc + (p.totales?.total || p.totales?.neto || 0);
    }, 0);
    const presupuestosEnNegociacion = presupuestosEnNegociacionList.slice(0, 5);

    // 9. Proyectos en curso (fases: planificacion, desarrollo, revision_qa - max 3)
    const proyectosEnCursoList = proyectos
      .filter((p: Proyecto) => 
        p.fase === "planificacion" || 
        p.fase === "desarrollo" || 
        p.fase === "revision_qa"
      )
      .sort((a, b) => {
        const dateA = a.fechaEntregaComprometida ? new Date(a.fechaEntregaComprometida).getTime() : Infinity;
        const dateB = b.fechaEntregaComprometida ? new Date(b.fechaEntregaComprometida).getTime() : Infinity;
        return dateA - dateB;
      });

    const totalProyectosEnCurso = proyectosEnCursoList.length;
    const proyectosEnCurso = proyectosEnCursoList.slice(0, 3);

    // 10. Saldo actual de caja y cruce con servicios recurrentes a vencer
    let saldoFlujoRegistrado = 0;
    let hayEventosFlujo = false;
    flujoEventos.forEach((fe: EventoFinanciero) => {
      if (fe.estado === "cobrado" || fe.estado === "pagado") {
        hayEventosFlujo = true;
        if (fe.tipo === "ingreso") saldoFlujoRegistrado += Number(fe.monto || 0);
        if (fe.tipo === "egreso") saldoFlujoRegistrado -= Number(fe.monto || 0);
      }
    });

    const saldoCajaActual = hayEventosFlujo 
      ? Math.max(0, saldoFlujoRegistrado) 
      : Math.max(0, cobradoMes - costosOperativosMes);

    // Servicios recurrentes que están a punto de vencer ordenados por fecha de corte próxima
    const subsPorVencerList = subscriptions
      .filter((sub: Subscription) => sub.estado !== "suspendido" && sub.fechaCorte)
      .map((sub: Subscription) => {
        const corteDate = new Date(sub.fechaCorte);
        const diffDays = isNaN(corteDate.getTime()) 
          ? 999 
          : Math.ceil((corteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let costoCLP = Number(sub.monto || 0);
        if (sub.moneda === "UF") {
          costoCLP = Math.round(costoCLP * (sub.valorUFRef || valorUFBase));
        }

        const cubierto = saldoCajaActual >= costoCLP;
        const diferencia = cubierto ? 0 : costoCLP - saldoCajaActual;

        return {
          ...sub,
          diasRestantes: diffDays,
          costoCLP,
          cubiertoConFlujo: cubierto,
          diferenciaFlujoCLP: diferencia,
        };
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes);

    const serviciosRecurrentesPorVencer = subsPorVencerList.slice(0, 5);

    // Ordenar alertas: alta prioridad primero, luego fecha
    alertas.sort((a, b) => {
      const pOrder = { alta: 0, media: 1, info: 2 };
      return (pOrder[a.prioridad] ?? 2) - (pOrder[b.prioridad] ?? 2);
    });

    const metricsResponse = {
      ingresosMes: {
        cobrado: cobradoMes,
        porCobrar: porCobrarMes,
        total: cobradoMes + porCobrarMes,
      },
      proyectosPorFase,
      totalProyectosActivos: activosCount,
      totalClientes: clientes.length,
      totalCotizacionesPendientes: presupuestos.filter((p: Presupuesto) => !p.estado || p.estado === "emitido" || p.estado === "enviado").length,
      pisoRecurrenteMRR: {
        totalCLP: Math.round(mrrCLP),
        totalUF: Math.round(mrrUF * 100) / 100,
        totalSuscripcionesActivas: subsActivasCount,
      },
      suscripcionesPorVencer: subsPorVencer,
      suscripcionesVencidas: subsVencidas,
      margenBrutoMes: {
        ingresos: cobradoMes,
        costos: costosOperativosMes,
        margen: margenBrutoMonto,
        porcentaje: margenPorcentaje,
      },
      alertasDelDia: alertas,

      // Secciones compactas del nuevo Dashboard
      contactosSinContactar,
      totalContactosSinContactar,

      presupuestosEnNegociacion,
      totalPresupuestosEnNegociacion,
      montoTotalNegociacion,

      proyectosEnCurso,
      totalProyectosEnCurso,

      saldoCajaActual,
      serviciosRecurrentesPorVencer,
    };

    serverMetricsCache = {
      data: metricsResponse,
      timestamp: Date.now()
    };

    return NextResponse.json(metricsResponse, {
      headers: { "X-Cache": "MISS" }
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al procesar métricas";
    console.error("ERROR DASHBOARD METRICS:", error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
