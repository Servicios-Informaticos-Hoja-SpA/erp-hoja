import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { 
  doc, 
  getDoc, 
  updateDoc 
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { periodo = "anual" } = await request.json();

    const docRef = doc(db, "subscriptions", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
    }

    const data = snap.data();
    const currentCorte = new Date(data.fechaCorte || Date.now());
    
    // Si ya venció hace mucho, renovar a partir de hoy, de lo contrario extender fechaCorte existente
    const baseDate = currentCorte.getTime() < Date.now() ? new Date() : currentCorte;

    if (periodo === "mensual") {
      baseDate.setMonth(baseDate.getMonth() + 1);
    } else {
      baseDate.setFullYear(baseDate.getFullYear() + 1);
    }

    const newFechaCorte = baseDate.toISOString().split("T")[0];

    await updateDoc(docRef, {
      fechaCorte: newFechaCorte,
      estado: "activo",
      ultimaRenovacion: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      message: "Suscripción renovada con éxito", 
      nuevaFechaCorte: newFechaCorte 
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al renovar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
