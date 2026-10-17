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

    const existing = snap.data();
    const updated = { ...existing, ...body };

    // Recalcular estado reactivo si no está suspendido ni pausado
    let estado = updated.estado || "activo";
    let diasRestantes = updated.diasRestantes;
    if (estado !== "suspendido" && estado !== "pausado" && updated.fechaCorte) {
      const corteMs = new Date(updated.fechaCorte).getTime();
      diasRestantes = Math.ceil((corteMs - Date.now()) / (1000 * 60 * 60 * 24));
      if (diasRestantes < 0) estado = "vencido";
      else if (diasRestantes <= 7) estado = "por_vencer";
      else estado = "activo";
    }

    let multMoneda = 1;
    if (updated.moneda === "UF") multMoneda = 38000;
    else if (updated.moneda === "USD") multMoneda = 950;
    const montoCLP = (Number(updated.monto) || 0) * multMoneda;
    let montoEstimadoMensualCLP = montoCLP;
    if (updated.cicloFacturacion === "anual") montoEstimadoMensualCLP = Math.round(montoCLP / 12);
    else if (updated.cicloFacturacion === "semestral") montoEstimadoMensualCLP = Math.round(montoCLP / 6);
    else if (updated.cicloFacturacion === "trimestral") montoEstimadoMensualCLP = Math.round(montoCLP / 3);

    await updateDoc(docRef, {
      ...body,
      estado,
      diasRestantes,
      montoEstimadoMensualCLP,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ message: "Servicio recurrente actualizado" });
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
