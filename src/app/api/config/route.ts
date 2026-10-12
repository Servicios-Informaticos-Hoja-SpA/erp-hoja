import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { doc, getDoc, setDoc } from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";

export async function GET() {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const docRef = doc(db, "configuracion_global", "hoja_dev_config");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return NextResponse.json(docSnap.data());
    }
    return NextResponse.json({ error: "Configuración no encontrada" }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const docRef = doc(db, "configuracion_global", "hoja_dev_config");
    await setDoc(docRef, body);
    return NextResponse.json({ message: "Configuración actualizada" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
