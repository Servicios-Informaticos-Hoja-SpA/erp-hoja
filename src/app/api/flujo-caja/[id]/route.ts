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
  concepto: z.string().optional(),
  monto: z.number().optional(),
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
  fechaVencimiento: z.string().optional(),
  fechaPago: z.string().optional(),
  estado: z.enum(["pendiente", "cobrado", "pagado", "vencido"]).optional(),
  esRecurrente: z.boolean().optional(),
  frecuencia: z.enum(["mensual", "anual"]).optional(),
  recordatorioDiasAntes: z.number().optional(),
  notas: z.string().optional(),
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
    const body = await request.json();
    
    const result = eventoUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: "Datos de actualización inválidos", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const docRef = doc(db, "flujo_caja", id);
    await updateDoc(docRef, {
      ...result.data,
      updatedAt: new Date().toISOString()
    });
    
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
    const docRef = doc(db, "flujo_caja", id);
    await deleteDoc(docRef);
    return NextResponse.json({ message: "Evento financiero eliminado" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar evento financiero";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
