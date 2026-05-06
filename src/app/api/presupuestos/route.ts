import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { 
  collection, 
  getDocs, 
  addDoc, 
  orderBy, 
  query,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { z } from "zod";

const presupuestoItemSchema = z.object({
  descripcion: z.string(),
  precio: z.number(),
  cantidad: z.number(),
  total: z.number(),
  frecuencia: z.string().optional(),
});

const presupuestoSchema = z.object({
  numero: z.string(),
  cliente_id: z.string(),
  cliente_nombre: z.string(),
  nombre_proyecto: z.string().optional(),
  descripcion_proyecto: z.string().optional(),
  items: z.array(presupuestoItemSchema),
  servicios_opcionales: z.array(presupuestoItemSchema).optional(),
  parametros_personalizados: z.record(z.string(), z.string()).optional(),
  totales: z.object({
    neto: z.number(),
    iva: z.number(),
    total: z.number(),
  }).optional(),
  version: z.number().optional(),
});

export async function GET(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
       const docRef = doc(db, "presupuestos", id);
       const docSnap = await getDoc(docRef);
       if (docSnap.exists()) {
         return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
       }
       return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const q = query(collection(db, "presupuestos"), orderBy("numero", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET PRESUPUESTO ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, ...rest } = body;

    // Validación con Zod
    const result = presupuestoSchema.safeParse(rest);
    if (!result.success) {
      return NextResponse.json({ 
        error: "Datos de presupuesto inválidos", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const data = result.data;

    if (id) {
      const docRef = doc(db, "presupuestos", id);
      const currentSnap = await getDoc(docRef);
      
      if (!currentSnap.exists()) {
        return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
      }

      const currentData = currentSnap.data();
      const nextVersion = (currentData?.version || 1) + 1;

      await updateDoc(docRef, {
        ...data,
        version: nextVersion,
        updatedAt: new Date().toISOString()
      });
      return NextResponse.json({ message: "Presupuesto actualizado", version: nextVersion });
    } else {
      const docRef = await addDoc(collection(db, "presupuestos"), {
        ...data,
        version: 1,
        fecha: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      return NextResponse.json({ id: docRef.id, message: "Presupuesto creado" });
    }
  } catch (error: any) {
    console.error("POST PRESUPUESTO ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
