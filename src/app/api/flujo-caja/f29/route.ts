import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc,
  getDoc
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { DeclaracionF29 } from "@/lib/types";
import { NOMBRES_MESES } from "@/lib/tributario-utils";

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const snap = await getDocs(collection(db, "f29_declaraciones"));
    const declaraciones: DeclaracionF29[] = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as DeclaracionF29));

    return NextResponse.json(declaraciones);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener declaraciones F29";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { periodo, montoPagado = 0, sinMovimiento = false, folioSII = "", notas = "" } = body;

    if (!periodo || typeof periodo !== "string" || !/^\d{4}-\d{2}$/.test(periodo)) {
      return NextResponse.json(
        { error: "El formato de período debe ser YYYY-MM (ej. 2026-09)" },
        { status: 400 }
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const [pYear, pMonth] = periodo.split("-").map(Number);

    // REGLA ESTRICTA: Solo se permite marcar como declarado el F29 de meses ya vencidos
    const isPastPeriod = pYear < currentYear || (pYear === currentYear && pMonth < currentMonth);
    if (!isPastPeriod) {
      const mesActualNombre = NOMBRES_MESES[currentMonth - 1];
      return NextResponse.json(
        { 
          error: `Solo se puede marcar como declarado el F29 de un mes ya vencido (períodos cerrados anteriores a ${mesActualNombre} ${currentYear}). El mes en curso acumula facturación hasta el último día y vence el mes siguiente.` 
        },
        { status: 400 }
      );
    }

    const mesDeclaradoNombre = `${NOMBRES_MESES[pMonth - 1]} ${pYear}`;
    const mesPagoStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

    const nuevaDeclaracion: DeclaracionF29 = {
      periodo,
      periodoNombre: mesDeclaradoNombre,
      mesPago: mesPagoStr,
      fechaDeclaracion: now.toISOString(),
      montoPagado: sinMovimiento ? 0 : Number(montoPagado || 0),
      sinMovimiento: Boolean(sinMovimiento || Number(montoPagado || 0) === 0),
      folioSII: folioSII.trim(),
      estado: "declarado",
      notas: notas.trim(),
      declaradoPor: "Operador Autorizado",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const docRef = doc(db, "f29_declaraciones", periodo);
    await setDoc(docRef, nuevaDeclaracion);

    return NextResponse.json({ 
      success: true, 
      declaracion: nuevaDeclaracion 
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al registrar declaración F29";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo");

    if (!periodo) {
      return NextResponse.json({ error: "Parámetro periodo requerido" }, { status: 400 });
    }

    const docRef = doc(db, "f29_declaraciones", periodo);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
      return NextResponse.json({ error: "Declaración no encontrada" }, { status: 404 });
    }

    await deleteDoc(docRef);
    return NextResponse.json({ success: true, message: `Declaración del período ${periodo} desmarcada` });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar declaración F29";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
