import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { 
  doc, 
  deleteDoc, 
  getDoc,
  updateDoc 
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { sanitizeData } from "@/lib/sanitize";
import { z } from "zod";

const ticketUpdateSchema = z.object({
  titulo: z.string().min(3).optional(),
  descripcion: z.string().min(5).optional(),
  severidad: z.enum(["Baja", "Media", "Alta", "Recomendación/Sugerencia"]).optional(),
  estado: z.enum(["abierto", "en_progreso", "resuelto", "cerrado"]).optional(),
  productoOItemId: z.string().optional(),
  resolucionNotas: z.string().optional(),
}).partial();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id: clienteId, ticketId } = await params;
    const ticketRef = doc(db, "clientes", clienteId, "tickets", ticketId);
    const docSnap = await getDoc(ticketRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener ticket";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id: clienteId, ticketId } = await params;
    const rawBody = await request.json();
    const sanitizedBody = sanitizeData(rawBody);

    const result = ticketUpdateSchema.safeParse(sanitizedBody);
    if (!result.success) {
      return NextResponse.json({
        error: "Datos de actualización de ticket inválidos",
        details: result.error.format(),
      }, { status: 400 });
    }

    const ticketRef = doc(db, "clientes", clienteId, "tickets", ticketId);
    await updateDoc(ticketRef, {
      ...result.data,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Ticket actualizado correctamente" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar ticket";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id: clienteId, ticketId } = await params;
    const ticketRef = doc(db, "clientes", clienteId, "tickets", ticketId);
    await deleteDoc(ticketRef);

    return NextResponse.json({ message: "Ticket eliminado correctamente" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar ticket";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
