import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { doc, getDoc, updateDoc } from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { z } from "zod";

const resumeSessionSchema = z.object({
  sessionId: z.string().min(1, "SessionId requerido"),
});

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = resumeSessionSchema.parse(body);

    const sessionRef = doc(db, "prospecting_sessions", validated.sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    const current = sessionSnap.data();
    const nowIso = new Date().toISOString();

    await updateDoc(sessionRef, {
      estado: "activa",
      updatedAt: nowIso,
    });

    return NextResponse.json({
      session: {
        id: sessionSnap.id,
        ...current,
        estado: "activa",
        updatedAt: nowIso,
      },
      message: "Sesión reanudada exitosamente",
    });
  } catch (error: unknown) {
    console.error("ERROR EN RESUME SESSION:", error);
    const message = error instanceof Error ? error.message : "Error al reanudar sesión";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
