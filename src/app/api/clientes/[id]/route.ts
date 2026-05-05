import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { 
  doc, 
  deleteDoc, 
  getDoc,
  updateDoc
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { z } from "zod";

const clienteUpdateSchema = z.object({
  nombre: z.string().min(3).optional(),
  email: z.string().email().optional().or(z.literal("")),
  rut: z.string().optional(),
  telefono: z.string().optional(),
  contacto: z.string().optional(),
  social_web: z.string().optional(),
  social_instagram: z.string().optional(),
  social_linkedin: z.string().optional(),
  social_otro: z.string().optional(),
}).partial();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const docRef = doc(db, "clientes", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
    }
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    
    // Validación con Zod
    const result = clienteUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: "Datos de actualización inválidos", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const docRef = doc(db, "clientes", id);
    
    await updateDoc(docRef, {
      ...result.data,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ message: "Cliente actualizado" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    console.log("Attempting to delete client:", id);
    const docRef = doc(db, "clientes", id);
    await deleteDoc(docRef);
    return NextResponse.json({ message: "Cliente eliminado correctamente" });
  } catch (error: any) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
