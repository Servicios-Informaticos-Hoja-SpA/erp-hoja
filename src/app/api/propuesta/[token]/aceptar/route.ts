import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc,
  updateDoc 
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));

    // 1. Buscar presupuesto por tokenPublico
    const q = query(
      collection(db, "presupuestos"), 
      where("tokenPublico", "==", token)
    );
    const snap = await getDocs(q);

    let docRef = null;

    if (!snap.empty) {
      docRef = doc(db, "presupuestos", snap.docs[0].id);
    } else {
      const fallbackRef = doc(db, "presupuestos", token);
      const fallbackSnap = await getDoc(fallbackRef);
      if (fallbackSnap.exists()) {
        docRef = fallbackRef;
      }
    }

    if (!docRef) {
      return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 });
    }

    const fechaAceptacion = new Date().toISOString();
    await updateDoc(docRef, {
      estado: "aprobado",
      alertaSilenciada: true,
      propuestaAceptadaEn: fechaAceptacion,
      propuestaAceptadaPor: body.nombreCliente || "Cliente vía enlace web",
      updatedAt: fechaAceptacion,
    });

    return NextResponse.json({ 
      message: "¡Propuesta aceptada con éxito! Procediendo a coordinar con el equipo de Hoja SpA.",
      fechaAceptacion
    });
  } catch (error: unknown) {
    console.error("ACEPTAR PROPUESTA ERROR:", error);
    const msg = error instanceof Error ? error.message : "Error al procesar la aceptación";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
