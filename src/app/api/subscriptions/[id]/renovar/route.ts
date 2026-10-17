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
    const body = await request.json().catch(() => ({}));
    const { 
      periodo, 
      monto, 
      notas, 
      comprobanteRef 
    } = body;

    const docRef = doc(db, "subscriptions", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Servicio recurrente no encontrado" }, { status: 404 });
    }

    const data = snap.data();
    const cycle = periodo || data.cicloFacturacion || "mensual";
    const currentCorte = new Date(data.fechaCorte || Date.now());
    
    // Si ya venció, renovar a partir de hoy, de lo contrario extender fechaCorte existente
    const baseDate = isNaN(currentCorte.getTime()) || currentCorte.getTime() < Date.now() 
      ? new Date() 
      : currentCorte;

    if (cycle === "mensual") {
      baseDate.setMonth(baseDate.getMonth() + 1);
    } else if (cycle === "trimestral") {
      baseDate.setMonth(baseDate.getMonth() + 3);
    } else if (cycle === "semestral") {
      baseDate.setMonth(baseDate.getMonth() + 6);
    } else {
      baseDate.setFullYear(baseDate.getFullYear() + 1);
    }

    const newFechaCorte = baseDate.toISOString().split("T")[0];
    const diffDays = Math.ceil((baseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const nuevoPago = {
      id: `pago-${Date.now()}`,
      fechaPago: new Date().toISOString(),
      monto: Number(monto !== undefined ? monto : data.monto || 0),
      moneda: data.moneda || "CLP",
      periodoCubierto: `Renovación ${cycle} hasta ${newFechaCorte}`,
      comprobanteRef: comprobanteRef || "",
      notas: notas || `Renovación de ciclo (${cycle})`,
    };

    const historialPrevio = Array.isArray(data.historialPagos) ? data.historialPagos : [];

    await updateDoc(docRef, {
      fechaCorte: newFechaCorte,
      estado: "activo",
      diasRestantes: diffDays,
      ultimaRenovacion: new Date().toISOString(),
      historialPagos: [nuevoPago, ...historialPrevio],
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      message: "Ciclo de servicio renovado y registrado con éxito", 
      nuevaFechaCorte: newFechaCorte,
      pago: nuevoPago
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al renovar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
