import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const docRef = doc(db, "subscriptions", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ id: snap.id, ...snap.data() });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

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
    const docRef = doc(db, "subscriptions", id);

    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
    }

    await updateDoc(docRef, {
      ...body,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ message: "Suscripción actualizada" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const docRef = doc(db, "subscriptions", id);
    await deleteDoc(docRef);

    return NextResponse.json({ message: "Suscripción eliminada" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
