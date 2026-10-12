import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { doc, getDoc, updateDoc } from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { z } from "zod";

const pauseSessionSchema = z.object({
  sessionId: z.string().min(1, "SessionId requerido"),
  duracionSegundos: z.number().int().min(0).default(0),
});

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = pauseSessionSchema.parse(body);

    const sessionRef = doc(db, "prospecting_sessions", validated.sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    const current = sessionSnap.data();
    const nowIso = new Date().toISOString();
    const duracionSegundos = validated.duracionSegundos;
    const duracionMinutos = Math.max(0, Math.round(duracionSegundos / 60));

    await updateDoc(sessionRef, {
      estado: "pausada",
      duracionSegundos,
      duracionMinutos,
      updatedAt: nowIso,
    });

    return NextResponse.json({
      session: {
        id: sessionSnap.id,
        ...current,
        estado: "pausada",
        duracionSegundos,
        duracionMinutos,
        updatedAt: nowIso,
      },
      message: "Sesión pausada exitosamente",
    });
  } catch (error: unknown) {
    console.error("ERROR EN PAUSE SESSION:", error);
    const message = error instanceof Error ? error.message : "Error al pausar sesión";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
