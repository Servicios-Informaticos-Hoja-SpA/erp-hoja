import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query 
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { sanitizeData } from "@/lib/sanitize";
import { z } from "zod";

const ticketCreateSchema = z.object({
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  descripcion: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  severidad: z.enum(["Baja", "Media", "Alta", "Recomendación/Sugerencia"]),
  estado: z.enum(["abierto", "en_progreso", "resuelto", "cerrado"]).optional(),
  productoOItemId: z.string().optional(),
  resolucionNotas: z.string().optional(),
  autor: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const ticketsRef = collection(db, "clientes", id, "tickets");
    const q = query(ticketsRef);
    const snapshot = await getDocs(q);
    
    const tickets = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // Ordenar secuencialmente por número de ticket ascendente
    tickets.sort((a, b) => ((a as { numero?: number }).numero || 0) - ((b as { numero?: number }).numero || 0));

    return NextResponse.json(tickets);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener tickets";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id: clienteId } = await params;
    const rawBody = await request.json();
    const sanitizedBody = sanitizeData(rawBody);

    const result = ticketCreateSchema.safeParse(sanitizedBody);
    if (!result.success) {
      return NextResponse.json({
        error: "Datos de ticket inválidos",
        details: result.error.format(),
      }, { status: 400 });
    }

    const ticketsRef = collection(db, "clientes", clienteId, "tickets");
    
    // Obtener tickets existentes para calcular el identificador secuencial scoped por cliente (Ticket #1, #2...)
    const snapshot = await getDocs(ticketsRef);
    let maxNumero = 0;
    snapshot.docs.forEach((d) => {
      const data = d.data();
      if (typeof data.numero === "number" && data.numero > maxNumero) {
        maxNumero = data.numero;
      }
    });

    const siguienteNumero = maxNumero + 1;
    const nowIso = new Date().toISOString();

    const ticketData = {
      ...result.data,
      numero: siguienteNumero,
      clienteId,
      estado: result.data.estado || "abierto",
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const docRef = await addDoc(ticketsRef, ticketData);

    return NextResponse.json({
      id: docRef.id,
      ...ticketData,
      message: `Ticket #${siguienteNumero} creado correctamente`,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al crear ticket";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
