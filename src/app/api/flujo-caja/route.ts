import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { 
  collection, 
  getDocs, 
  addDoc, 
  orderBy, 
  query 
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { z } from "zod";

const eventoFinancieroSchema = z.object({
  tipo: z.enum(["ingreso", "egreso"]),
  categoria: z.enum([
    "cobro_proyecto", 
    "recurrente_cliente", 
    "renovacion_infraestructura", 
    "gasto_operativo",
    "saldo_inicial"
  ]).optional().nullable(),
  referenciaId: z.string().optional().nullable(),
  referenciaNombre: z.string().optional().nullable(),
  concepto: z.string().min(1, "El concepto es obligatorio"),
  monto: z.number().min(0, "El monto debe ser positivo"),
  montoNeto: z.number().optional().nullable(),
  ivaMonto: z.number().optional().nullable(),
  montoTotal: z.number().optional().nullable(),
  aplicaFactura: z.boolean().optional().nullable(),
  deducibleIva: z.boolean().optional().nullable(),
  numeroFactura: z.string().optional().nullable(),
  fechaFactura: z.string().optional().nullable(),
  rutContraparte: z.string().optional().nullable(),
  razonSocialContraparte: z.string().optional().nullable(),
  tipoComprobante: z.enum(["factura", "boleta", "honorarios", "sin_comprobante"]).optional().nullable(),
  proyectoId: z.string().optional().nullable(),
  proyectoNombre: z.string().optional().nullable(),
  clienteId: z.string().optional().nullable(),
  clienteNombre: z.string().optional().nullable(),
  clienteRut: z.string().optional().nullable(),
  hitoPagoId: z.string().optional().nullable(),
  fechaVencimiento: z.string().min(4, "La fecha de vencimiento es obligatoria"),
  fechaPago: z.string().optional().nullable(),
  estado: z.enum(["pendiente", "cobrado", "pagado", "vencido"]).optional().nullable(),
  esRecurrente: z.boolean().optional().default(false),
  frecuencia: z.enum(["mensual", "anual"]).optional().nullable(),
  recordatorioDiasAntes: z.number().optional().default(5),
  notas: z.string().optional().nullable(),
});

export async function GET() {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const q = query(collection(db, "flujo_caja"), orderBy("fechaVencimiento", "asc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener flujo de caja";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    
    // Validación con Zod
    const result = eventoFinancieroSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: "Datos inválidos de flujo de caja", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const raw = result.data;

    // Normalizar categoría
    let categoria = raw.categoria;
    if (!categoria || (raw.tipo === "egreso" && categoria === "cobro_proyecto")) {
      categoria = raw.tipo === "egreso" ? "gasto_operativo" : "cobro_proyecto";
    }

    // Normalizar estado
    let estado = raw.estado || "pendiente";
    if (raw.tipo === "egreso" && estado === "cobrado") {
      estado = "pagado";
    } else if (raw.tipo === "ingreso" && estado === "pagado") {
      estado = "cobrado";
    }

    const valorBase = raw.montoTotal ?? raw.monto;
    const conceptoLower = (raw.concepto || "").toLowerCase();
    const esSaldoInicial = 
      categoria === "saldo_inicial" ||
      conceptoLower.includes("saldo inicial") ||
      conceptoLower.includes("caja inicial") ||
      conceptoLower.includes("aporte de capital") ||
      conceptoLower.includes("ingreso inicial") ||
      raw.tipoComprobante === "sin_comprobante";

    // Solo es venta con factura si tiene número de factura o es comprobante factura y NO es saldo inicial
    const tieneNumeroFactura = Boolean(raw.numeroFactura && raw.numeroFactura.trim().length > 0);
    const esVentaConFactura = 
      raw.tipo === "ingreso" &&
      !esSaldoInicial &&
      Boolean(
        tieneNumeroFactura ||
        raw.tipoComprobante === "factura" ||
        raw.aplicaFactura === true
      );

    // Regla de Negocio: En egresos/gastos, SOLO generan Crédito Fiscal IVA si
    // están asociados a un proyecto Y tienen factura asociada.
    const tieneProyecto = Boolean(
      (raw.proyectoId && raw.proyectoId !== "ninguno") || 
      (raw.referenciaId && raw.referenciaId !== "ninguno")
    );

    const esGastoProyectoConFactura = 
      raw.tipo === "egreso" && 
      !esSaldoInicial &&
      tieneProyecto && 
      Boolean(tieneNumeroFactura || raw.tipoComprobante === "factura") &&
      raw.tipoComprobante !== "sin_comprobante" &&
      raw.tipoComprobante !== "boleta" &&
      raw.deducibleIva !== false;

    let finalMontoTotal = valorBase;
    let finalMontoNeto = valorBase;
    let finalIvaMonto = 0;
    let finalAplicaFactura = false;
    let finalDeducibleIva = false;
    let finalTipoComprobante = raw.tipoComprobante || (esSaldoInicial ? "sin_comprobante" : "factura");
    let finalNumeroFactura = esSaldoInicial ? undefined : (raw.numeroFactura?.trim() || undefined);

    if (esVentaConFactura) {
      // Venta afecta a IVA 19% con factura
      finalMontoTotal = valorBase;
      finalMontoNeto = raw.montoNeto ?? Math.round(valorBase / 1.19);
      finalIvaMonto = raw.ivaMonto ?? (valorBase - finalMontoNeto);
      finalAplicaFactura = true;
      finalDeducibleIva = false;
    } else if (esGastoProyectoConFactura) {
      // Gasto de proyecto con factura: Crédito fiscal IVA deducible
      finalMontoTotal = valorBase;
      finalMontoNeto = raw.montoNeto ?? Math.round(valorBase / 1.19);
      finalIvaMonto = raw.ivaMonto ?? (valorBase - finalMontoNeto);
      finalAplicaFactura = true;
      finalDeducibleIva = true;
    } else {
      // Gasto general, aportes, boletas, etc.
      finalMontoTotal = valorBase;
      finalMontoNeto = valorBase;
      finalIvaMonto = 0;
      finalAplicaFactura = raw.tipoComprobante === "factura";
      finalDeducibleIva = false;
      if (esSaldoInicial) {
        finalTipoComprobante = "sin_comprobante";
        finalNumeroFactura = undefined;
      }
    }

    const itemData: Record<string, unknown> = {
      tipo: raw.tipo,
      categoria,
      concepto: raw.concepto.trim(),
      monto: finalMontoTotal,
      montoTotal: finalMontoTotal,
      montoNeto: finalMontoNeto,
      ivaMonto: finalIvaMonto,
      aplicaFactura: finalAplicaFactura,
      deducibleIva: finalDeducibleIva,
      tipoComprobante: finalTipoComprobante,
      fechaVencimiento: raw.fechaVencimiento,
      estado,
      esRecurrente: raw.esRecurrente ?? false,
      recordatorioDiasAntes: raw.recordatorioDiasAntes ?? 5,
    };

    if (finalNumeroFactura) itemData.numeroFactura = finalNumeroFactura;
    if (raw.fechaFactura?.trim()) itemData.fechaFactura = raw.fechaFactura.trim();
    if (raw.fechaPago?.trim()) itemData.fechaPago = raw.fechaPago.trim();
    if (raw.referenciaId?.trim()) itemData.referenciaId = raw.referenciaId.trim();
    if (raw.referenciaNombre?.trim()) itemData.referenciaNombre = raw.referenciaNombre.trim();
    if (raw.rutContraparte?.trim()) itemData.rutContraparte = raw.rutContraparte.trim();
    if (raw.razonSocialContraparte?.trim()) itemData.razonSocialContraparte = raw.razonSocialContraparte.trim();
    if (raw.proyectoId && raw.proyectoId !== "ninguno") itemData.proyectoId = raw.proyectoId;
    if (raw.proyectoNombre?.trim()) itemData.proyectoNombre = raw.proyectoNombre.trim();
    if (raw.clienteId?.trim()) itemData.clienteId = raw.clienteId.trim();
    if (raw.clienteNombre?.trim()) itemData.clienteNombre = raw.clienteNombre.trim();
    if (raw.clienteRut?.trim()) itemData.clienteRut = raw.clienteRut.trim();
    if (raw.hitoPagoId?.trim()) itemData.hitoPagoId = raw.hitoPagoId.trim();
    if (raw.frecuencia) itemData.frecuencia = raw.frecuencia;
    if (raw.notas?.trim()) itemData.notas = raw.notas.trim();

    // Sanitización estricta: asegurar que NINGÚN campo sea undefined ni null antes de Firestore
    const cleanData: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(itemData)) {
      if (v !== undefined && v !== null) {
        cleanData[k] = v;
      }
    }

    cleanData.createdAt = new Date().toISOString();

    const docRef = await addDoc(collection(db, "flujo_caja"), cleanData);
    
    return NextResponse.json({ id: docRef.id, message: "Evento financiero registrado con éxito" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al registrar evento financiero";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
