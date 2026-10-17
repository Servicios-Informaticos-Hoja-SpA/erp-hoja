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
    "gasto_operativo"
  ]),
  referenciaId: z.string().optional(),
  referenciaNombre: z.string().optional(),
  concepto: z.string().min(2, "El concepto es obligatorio"),
  monto: z.number().min(0, "El monto debe ser positivo"),
  montoNeto: z.number().optional(),
  ivaMonto: z.number().optional(),
  montoTotal: z.number().optional(),
  aplicaFactura: z.boolean().optional(),
  deducibleIva: z.boolean().optional(),
  numeroFactura: z.string().optional(),
  fechaFactura: z.string().optional(),
  rutContraparte: z.string().optional(),
  razonSocialContraparte: z.string().optional(),
  tipoComprobante: z.enum(["factura", "boleta", "honorarios", "sin_comprobante"]).optional(),
  proyectoId: z.string().optional(),
  proyectoNombre: z.string().optional(),
  clienteId: z.string().optional(),
  clienteNombre: z.string().optional(),
  clienteRut: z.string().optional(),
  hitoPagoId: z.string().optional(),
  fechaVencimiento: z.string().min(4, "La fecha de vencimiento es obligatoria"),
  fechaPago: z.string().optional(),
  estado: z.enum(["pendiente", "cobrado", "pagado", "vencido"]).default("pendiente"),
  esRecurrente: z.boolean().optional().default(false),
  frecuencia: z.enum(["mensual", "anual"]).optional(),
  recordatorioDiasAntes: z.number().optional().default(5),
  notas: z.string().optional(),
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

    const itemData = { ...result.data };
    const valorBase = itemData.montoTotal ?? itemData.monto;

    const conceptoLower = (itemData.concepto || "").toLowerCase();
    const esSaldoInicial = 
      (itemData.categoria as string) === "saldo_inicial" ||
      conceptoLower.includes("saldo inicial") ||
      conceptoLower.includes("caja inicial") ||
      conceptoLower.includes("aporte de capital") ||
      conceptoLower.includes("ingreso inicial") ||
      itemData.tipoComprobante === "sin_comprobante";

    // Solo es venta con factura si tiene número de factura o es comprobante factura y NO es saldo inicial
    const esVentaConFactura = 
      itemData.tipo === "ingreso" &&
      !esSaldoInicial &&
      Boolean(
        (itemData.numeroFactura && itemData.numeroFactura.trim().length > 0) ||
        itemData.tipoComprobante === "factura" ||
        itemData.aplicaFactura === true
      );

    // Regla de Negocio: En egresos/gastos, SOLO generan Crédito Fiscal IVA si
    // están asociados a un proyecto Y tienen factura asociada.
    const esGastoProyectoConFactura = 
      itemData.tipo === "egreso" && 
      !esSaldoInicial &&
      Boolean((itemData.proyectoId && itemData.proyectoId !== "ninguno") || itemData.referenciaId) && 
      Boolean(
        (itemData.numeroFactura && itemData.numeroFactura.trim().length > 0) || 
        itemData.tipoComprobante === "factura"
      ) &&
      itemData.tipoComprobante !== "sin_comprobante" &&
      itemData.tipoComprobante !== "boleta" &&
      itemData.deducibleIva !== false;

    if (esVentaConFactura) {
      // Venta afecta a IVA 19% con factura
      itemData.montoTotal = valorBase;
      itemData.montoNeto = itemData.montoNeto ?? Math.round(valorBase / 1.19);
      itemData.ivaMonto = itemData.ivaMonto ?? (valorBase - itemData.montoNeto);
      itemData.aplicaFactura = true;
      itemData.deducibleIva = false;
    } else if (esGastoProyectoConFactura) {
      // Gasto de proyecto con factura: Crédito fiscal IVA deducible
      itemData.montoTotal = valorBase;
      itemData.montoNeto = itemData.montoNeto ?? Math.round(valorBase / 1.19);
      itemData.ivaMonto = itemData.ivaMonto ?? (valorBase - itemData.montoNeto);
      itemData.deducibleIva = true;
    } else {
      // Saldo inicial, aportes, boletas, ingresos no facturados o gastos generales sin factura de proyecto (No deducibles de IVA)
      itemData.montoTotal = valorBase;
      itemData.montoNeto = valorBase;
      itemData.ivaMonto = 0;
      itemData.aplicaFactura = false;
      itemData.deducibleIva = false;
      if (esSaldoInicial) {
        itemData.tipoComprobante = "sin_comprobante";
        itemData.numeroFactura = undefined;
      }
    }

    // Asegurar que monto siempre sea el total
    itemData.monto = itemData.montoTotal ?? valorBase;

    const docRef = await addDoc(collection(db, "flujo_caja"), {
      ...itemData,
      createdAt: new Date().toISOString()
    });
    
    return NextResponse.json({ id: docRef.id, message: "Evento financiero registrado con éxito" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al registrar evento financiero";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
