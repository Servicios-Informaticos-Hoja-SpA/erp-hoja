import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { collection, getDocs, orderBy, query } from "firebase/firestore/lite";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    const q = query(collection(db, "catalogo_servicios"), orderBy("descripcion", "asc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
