import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { doc, getDoc, deleteDoc } from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { z } from "zod";

const cancelSessionSchema = z.object({
  sessionId: z.string().min(1, "SessionId requerido"),
});

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = cancelSessionSchema.parse(body);

    const sessionRef = doc(db, "prospecting_sessions", validated.sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      // Si la sesión no tiene contactos registrados o se descarta voluntariamente,
      // la eliminamos para no ensuciar el historial como "incompleta"
      await deleteDoc(sessionRef);
    }

    return NextResponse.json({
      success: true,
      message: "Sesión descartada correctamente",
    });
  } catch (error: unknown) {
    console.error("ERROR EN CANCEL SESSION:", error);
    const message = error instanceof Error ? error.message : "Error al cancelar sesión";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
