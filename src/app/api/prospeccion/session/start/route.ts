import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { collection, addDoc } from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { z } from "zod";

const startSessionSchema = z.object({
  metaObjetivo: z.number().int().min(1).default(3),
  userId: z.string().optional().default("hoja-operador-principal"),
  userEmail: z.string().optional().default("operaciones@hoja.cl"),
});

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = startSessionSchema.parse(body);

    const now = new Date();
    const sessionData = {
      userId: validated.userId,
      userEmail: validated.userEmail,
      fecha: now.toISOString().split("T")[0],
      horaInicio: now.toISOString(),
      metaObjetivo: validated.metaObjetivo,
      contactosCompletados: 0,
      duracionMinutos: 0,
      duracionSegundos: 0,
      metaCumplida: false,
      estado: "activa",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const docRef = await addDoc(collection(db, "prospecting_sessions"), sessionData);

    return NextResponse.json({
      session: {
        id: docRef.id,
        ...sessionData,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("ERROR EN START PROSPECTING SESSION:", error);
    const message = error instanceof Error ? error.message : "Error al iniciar sesión";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
