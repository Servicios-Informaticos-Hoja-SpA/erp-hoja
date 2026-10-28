import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { 
  doc, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { z } from "zod";

const eventoUpdateSchema = z.object({
  concepto: z.string().optional().nullable(),
  monto: z.number().optional().nullable(),
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
  fechaVencimiento: z.string().optional().nullable(),
  fechaPago: z.string().optional().nullable(),
  estado: z.enum(["pendiente", "cobrado", "pagado", "vencido"]).optional().nullable(),
  esRecurrente: z.boolean().optional().nullable(),
  frecuencia: z.enum(["mensual", "anual"]).optional().nullable(),
  recordatorioDiasAntes: z.number().optional().nullable(),
  notas: z.string().optional().nullable(),
}).partial();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    if (id.startsWith("sub-") || id.startsWith("hito-")) {
      return NextResponse.json({ 
        error: "Los registros proyectados de suscripciones o hitos de proyecto deben gestionarse desde sus respectivos módulos." 
      }, { status: 400 });
    }

    const body = await request.json();
    
    const result = eventoUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: "Datos de actualización inválidos", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const cleanData: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(result.data)) {
      if (v !== undefined) {
        cleanData[k] = v;
      }
    }
    cleanData.updatedAt = new Date().toISOString();

    const docRef = doc(db, "flujo_caja", id);
    await updateDoc(docRef, cleanData);
    
    return NextResponse.json({ message: "Evento financiero actualizado" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar evento financiero";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    if (id.startsWith("sub-") || id.startsWith("hito-")) {
      return NextResponse.json({ 
        error: "Los registros proyectados de suscripciones o hitos de proyecto no se pueden eliminar desde el flujo de caja." 
      }, { status: 400 });
    }

    const docRef = doc(db, "flujo_caja", id);
    await deleteDoc(docRef);
    return NextResponse.json({ message: "Evento financiero eliminado" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar evento financiero";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
