import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { doc, deleteDoc, getDoc } from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const docRef = doc(db, "expenses", id);
    await deleteDoc(docRef);
    return NextResponse.json({ message: "Gasto eliminado" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al eliminar gasto";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
