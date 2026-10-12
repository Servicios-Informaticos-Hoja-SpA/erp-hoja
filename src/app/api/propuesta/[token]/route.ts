import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc 
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    // 1. Buscar presupuesto por tokenPublico
    const q = query(
      collection(db, "presupuestos"), 
      where("tokenPublico", "==", token)
    );
    const snap = await getDocs(q);

    let presupuestoData = null;
    let presupuestoId = null;

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      presupuestoId = docSnap.id;
      presupuestoData = docSnap.data();
    } else {
      // Fallback: Si el token es el id del documento
      const fallbackRef = doc(db, "presupuestos", token);
      const fallbackSnap = await getDoc(fallbackRef);
      if (fallbackSnap.exists()) {
        presupuestoId = fallbackSnap.id;
        presupuestoData = fallbackSnap.data();
      }
    }

    if (!presupuestoData) {
      return NextResponse.json({ error: "Propuesta comercial no encontrada o enlace expirado" }, { status: 404 });
    }

    // 2. Obtener configuración pública de Hoja SpA (banco, rut, contacto)
    let configData = null;
    try {
      const configRef = doc(db, "configuracion", "general");
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        configData = configSnap.data();
      }
    } catch {
      // fallback silencioso
    }

    return NextResponse.json({
      id: presupuestoId,
      ...presupuestoData,
      empresaConfig: configData || {
        telefono: "+56954169597",
        email_contacto: "contacto@sihoja.cl",
        web: "https://sihoja.cl"
      }
    });
  } catch (error: unknown) {
    console.error("GET PROPUESTA ERROR:", error);
    const msg = error instanceof Error ? error.message : "Error al cargar propuesta";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
