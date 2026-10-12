import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { collection, getDocs, DocumentData } from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { AlertaOperativa, Cliente, Presupuesto, Proyecto, EventoFinanciero, Subscription } from "@/lib/types";
import { obtenerAlertaCalendarioSII } from "@/lib/tributario-utils";

export async function GET() {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const [presupuestosSnap, clientesSnap, proyectosSnap, flujoSnap, subscriptionsSnap] = await Promise.all([
      getDocs(collection(db, "presupuestos")),
      getDocs(collection(db, "clientes")),
      getDocs(collection(db, "proyectos")).catch(() => ({ docs: [] as DocumentData[] })),
      getDocs(collection(db, "flujo_caja")).catch(() => ({ docs: [] as DocumentData[] })),
      getDocs(collection(db, "subscriptions")).catch(() => ({ docs: [] as DocumentData[] })),
    ]);

    const presupuestos = presupuestosSnap.docs.map(d => ({ id: d.id, ...d.data() } as Presupuesto));
    const clientes = clientesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Cliente));
    const proyectos = proyectosSnap.docs.map(d => ({ id: d.id, ...d.data() } as Proyecto));
    const flujoEventos = flujoSnap.docs.map(d => ({ id: d.id, ...d.data() } as EventoFinanciero));
    const subscriptions = subscriptionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subscription));

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const alertas: AlertaOperativa[] = [];

    // Clientes
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
            titulo: `${isOverdue ? "⚠️ Seguimiento atrasado:" : "📅 Llamada/Reunión hoy:"} ${c.nombre}`,
            descripcion: c.proximoContacto.motivo || "Contacto comercial agendado",
            fechaRef: contactDateStr,
            enlaceAccion: `/clientes?id=${c.id}`,
            textoAccion: "Ver Ficha",
            telefonoWhatsApp: c.telefono,
            mensajeWhatsApp: `Hola ${c.nombre}, te contacto desde Servicios Informáticos Hoja SpA respecto a: ${c.proximoContacto.motivo || "nuestro seguimiento pendiente"}.`
          });
        }
      }

      if (c.fechaProximoSeguimiento && c.etapaPipeline !== "Cerrado Ganado" && c.etapaPipeline !== "Perdido") {
        const segDate = c.fechaProximoSeguimiento.split("T")[0];
        if (segDate <= todayStr) {
          alertas.push({
            id: `crm-seg-${c.id}`,
            tipo: "cliente",
            prioridad: segDate < todayStr ? "alta" : "media",
            titulo: `🎯 CRM: Seguimiento a ${c.nombre} (${c.etapaPipeline || "Prospecto"})`,
            descripcion: `Síntoma detectado: ${c.sintomaPrincipal || "Oportunidad activa"}. Fecha pactada: ${segDate}`,
            fechaRef: segDate,
            enlaceAccion: `/clientes?id=${c.id}`,
            textoAccion: "Ver Ficha",
            telefonoWhatsApp: c.telefono,
            mensajeWhatsApp: `Hola ${c.nombre}, te contacto desde Servicios Informáticos Hoja SpA para continuar coordinando la solución a los requerimientos de tu empresa.`
          });
        }
      }
    });

    // Suscripciones y Renovaciones (Hosting, Correos, Web)
    subscriptions.forEach((sub: Subscription) => {
      if (sub.estado !== "suspendido" && sub.fechaCorte) {
        const corteDate = new Date(sub.fechaCorte);
        if (!isNaN(corteDate.getTime())) {
          const diffDays = Math.ceil((corteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const clienteMatch = clientes.find((c) => c.id === sub.clienteId || c.nombre === sub.clienteNombre);
          const telefonoWhatsApp = sub.clienteTelefono || clienteMatch?.telefono || "";

          if (diffDays < 0) {
            // Vencido
            alertas.push({
              id: `sub-vencida-${sub.id}`,
              tipo: "suscripcion",
              prioridad: "alta",
              severidad: "alta",
              monto: sub.monto,
              titulo: `🚨 Servicio Vencido: ${sub.dominio} (${sub.clienteNombre})`,
              descripcion: `El servicio de ${sub.tipoServicio} para ${sub.dominio} venció el ${sub.fechaCorte}. Monto: ${sub.monto.toLocaleString('es-CL')} ${sub.moneda}.`,
              fechaRef: sub.fechaCorte,
              enlaceAccion: `/suscripciones`,
              textoAccion: "Cobranza",
              telefonoWhatsApp,
              mensajeWhatsApp: `Estimado/a ${sub.clienteNombre}, el servicio para ${sub.dominio} se encuentra vencido. Para evitar la interrupción de correos corporativos y del sitio web, por favor confirma tu comprobante a la brevedad.`
            });
          } else if (diffDays <= 7) {
            // Por vencer
            alertas.push({
              id: `sub-aviso-${sub.id}`,
              tipo: "suscripcion",
              prioridad: diffDays <= 3 ? "alta" : "media",
              severidad: "media",
              monto: sub.monto,
              titulo: `⏳ Renovación en ${diffDays} días: ${sub.dominio} (${sub.clienteNombre})`,
              descripcion: `Plan ${sub.tipoServicio} (${sub.proveedor}) vence el ${sub.fechaCorte}. Renovación: ${sub.monto.toLocaleString('es-CL')} ${sub.moneda}.`,
              fechaRef: sub.fechaCorte,
              enlaceAccion: `/suscripciones`,
              textoAccion: "Ver Servicio",
              telefonoWhatsApp,
              mensajeWhatsApp: `Hola ${sub.clienteNombre}, te recordamos desde Servicios Informáticos Hoja SpA que el servicio de hosting y casillas corporativas para ${sub.dominio} vence el ${sub.fechaCorte}. Monto a renovar: ${sub.monto.toLocaleString('es-CL')} ${sub.moneda}. Si requieres los datos de transferencia, avísanos por este medio.`
            });
          }
        }
      }
    });

    // Presupuestos enviados sin respuesta > 7 días (excluye borradores, aprobados, en negociación o silenciados)
    presupuestos.forEach((pr: Presupuesto) => {
      const isEnviado = pr.estado === "enviado" || pr.estado === "emitido";
      if (isEnviado && !pr.alertaSilenciada && !pr.proyecto_id) {
        let pDate: Date | null = null;
        const refDate = pr.ultimoSeguimiento?.fecha || pr.fechaEnvio || pr.fecha;
        if (typeof refDate === "string") {
          pDate = new Date(refDate);
        } else if (refDate && typeof refDate === "object" && "seconds" in refDate) {
          pDate = new Date((refDate as { seconds: number }).seconds * 1000);
        }

        if (pDate && !isNaN(pDate.getTime())) {
          const diffDays = Math.floor((now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 7) {
            const clienteMatch = clientes.find((c) => c.id === pr.cliente_id || c.nombre === pr.cliente_nombre);
            const telefonoWhatsApp = clienteMatch?.telefono || "";

            alertas.push({
              id: `pre-${pr.id}`,
              tipo: "presupuesto",
              prioridad: diffDays >= 14 ? "alta" : "media",
              titulo: `Cotización N° ${pr.numero} sin respuesta (${diffDays}d)`,
              descripcion: `${diffDays} días sin respuesta de ${pr.cliente_nombre}. Monto: $${pr.totales?.total?.toLocaleString('es-CL') || 0}.`,
              fechaRef: pDate.toISOString().split("T")[0],
              enlaceAccion: `/presupuestos`,
              textoAccion: "Gestionar",
              telefonoWhatsApp,
              mensajeWhatsApp: `Hola ${pr.cliente_nombre}, te escribo de Servicios Informáticos Hoja SpA para consultar si pudiste revisar la propuesta N° ${pr.numero} que te enviamos.`
            });
          }
        }
      }
    });

    // Proyectos fecha límite próxima
    proyectos.forEach((p: Proyecto) => {
      if (p.fase !== "entregado" && p.fase !== "cancelado" && p.fechaEntregaComprometida) {
        const entregaDate = new Date(p.fechaEntregaComprometida);
        if (!isNaN(entregaDate.getTime())) {
          const diffDays = Math.ceil((entregaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 3) {
            alertas.push({
              id: `proy-${p.id}`,
              tipo: "proyecto",
              prioridad: "alta",
              titulo: diffDays < 0 ? `🚨 Proyecto sobrepasado: ${p.nombre}` : `⏳ Entrega en ${diffDays} días: ${p.nombre}`,
              descripcion: `Cliente: ${p.clienteNombre}. Fecha límite: ${p.fechaEntregaComprometida}`,
              fechaRef: p.fechaEntregaComprometida,
              enlaceAccion: `/proyectos?id=${p.id}`,
              textoAccion: "Ver Proyecto",
            });
          }
        }
      }
    });

    // Flujo de caja
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
              titulo: fe.tipo === "ingreso" ? `💰 Cobro pendiente: ${fe.concepto}` : `💳 Vencimiento: ${fe.concepto}`,
              descripcion: `Monto: $${new Intl.NumberFormat('es-CL').format(fe.monto)} | Fecha: ${fe.fechaVencimiento}`,
              fechaRef: fe.fechaVencimiento,
              enlaceAccion: `/flujo-caja`,
              textoAccion: "Ver Finanzas",
            });
          }
        }
      }
    });

    // Alerta de Calendario Tributario SII (F29 - días 10 al 20 de cada mes)
    const alertaF29 = obtenerAlertaCalendarioSII(flujoEventos, now);
    if (alertaF29 && alertaF29.activa) {
      alertas.push({
        id: `f29-calendario-sii-${now.getFullYear()}-${now.getMonth() + 1}`,
        tipo: "flujo_caja",
        prioridad: alertaF29.esCritica ? "alta" : "media",
        severidad: alertaF29.esCritica ? "alta" : "media",
        titulo: alertaF29.esCritica 
          ? `🚨 Declaración F29 (SII) Vence en ${alertaF29.diasRestantes} días` 
          : `⚖️ Declaración y Pago F29 (${alertaF29.fechaVence})`,
        descripcion: alertaF29.mensaje,
        monto: alertaF29.f29Estimado,
        fechaRef: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-20`,
        enlaceAccion: `/flujo-caja`,
        textoAccion: "Ver Flujo de Caja",
      });
    }

    alertas.sort((a, b) => {
      const pOrder = { alta: 0, media: 1, info: 2 };
      return (pOrder[a.prioridad] ?? 2) - (pOrder[b.prioridad] ?? 2);
    });

    return NextResponse.json(alertas);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al procesar alertas";
    console.error("ERROR ALERTAS:", error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
