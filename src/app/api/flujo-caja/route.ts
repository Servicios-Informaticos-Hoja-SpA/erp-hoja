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
  fechaVencimiento: z.string().min(4, "La fecha de vencimiento es obligatoria"),
  estado: z.enum(["pendiente", "cobrado", "pagado", "vencido"]).default("pendiente"),
  esRecurrente: z.boolean().optional().default(false),
  frecuencia: z.enum(["mensual", "anual"]).optional(),
  recordatorioDiasAntes: z.number().optional().default(5),
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

    // Si no vienen calculados los campos tributarios, calcularlos coherentemente
    if (itemData.montoNeto === undefined || itemData.ivaMonto === undefined) {
      if (itemData.tipo === "ingreso" && itemData.aplicaFactura !== false) {
        // Venta afecta a IVA 19%
        itemData.montoTotal = valorBase;
        itemData.montoNeto = Math.round(valorBase / 1.19);
        itemData.ivaMonto = valorBase - itemData.montoNeto;
        itemData.aplicaFactura = true;
      } else if (itemData.tipo === "egreso" && itemData.deducibleIva) {
        // Compra local deducible de IVA
        itemData.montoTotal = valorBase;
        itemData.montoNeto = Math.round(valorBase / 1.19);
        itemData.ivaMonto = valorBase - itemData.montoNeto;
      } else {
        itemData.montoTotal = valorBase;
        itemData.montoNeto = valorBase;
        itemData.ivaMonto = 0;
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
