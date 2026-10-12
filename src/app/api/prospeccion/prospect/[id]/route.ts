import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { doc, getDoc, updateDoc } from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { z } from "zod";

const updateProspectSchema = z.object({
  estado: z.enum(["por_contactar", "contactado", "respondio", "cotizado", "cerrado", "descartado"]).optional(),
  notas: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateProspectSchema.parse(body);

    const prospectRef = doc(db, "prospects", id);
    const snap = await getDoc(prospectRef);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Prospecto no encontrado" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      ...validated,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(prospectRef, updates);

    return NextResponse.json({
      prospect: {
        id: snap.id,
        ...snap.data(),
        ...updates,
      },
    });
  } catch (error: unknown) {
    console.error("ERROR EN UPDATE PROSPECT:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar prospecto";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
