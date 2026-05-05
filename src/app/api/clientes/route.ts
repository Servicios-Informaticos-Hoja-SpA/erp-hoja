import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { 
  collection, 
  getDocs, 
  addDoc, 
  orderBy, 
  query 
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { z } from "zod";

const clienteSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  rut: z.string().optional(),
  telefono: z.string().optional(),
  contacto: z.string().optional(),
  social_web: z.string().optional(),
  social_instagram: z.string().optional(),
  social_linkedin: z.string().optional(),
  social_otro: z.string().optional(),
});

export async function GET() {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const q = query(collection(db, "clientes"), orderBy("nombre", "asc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    
    // Validación con Zod
    const result = clienteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: "Datos inválidos", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, "clientes"), {
      ...result.data,
      createdAt: new Date().toISOString()
    });
    
    return NextResponse.json({ id: docRef.id, message: "Cliente creado" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
