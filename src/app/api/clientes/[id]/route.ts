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

const proximoContactoSchema = z.object({
  fecha: z.string(),
  motivo: z.string(),
  estado: z.enum(["pendiente", "realizado", "cancelado"]).optional(),
}).optional();

const accesoSchema = z.object({
  id: z.string().optional(),
  tipo: z.string(),
  identificador: z.string(),
  usuario: z.string(),
  claveONotas: z.string().optional(),
});

const infraestructuraSchema = z.object({
  dominio: z.object({
    nombre: z.string().optional(),
    proveedor: z.string().optional(),
    fechaRenovacion: z.string().optional(),
    costoAnual: z.number().optional(),
  }).optional(),
  dns: z.object({
    proveedor: z.string().optional(),
    registrosClave: z.string().optional(),
  }).optional(),
  hosting: z.object({
    proveedor: z.string().optional(),
    plan: z.string().optional(),
    fechaRenovacion: z.string().optional(),
    costoMensualOAnual: z.number().optional(),
  }).optional(),
  accesos: z.array(accesoSchema).optional(),
}).optional();

const notaSchema = z.object({
  id: z.string().optional(),
  autorNombre: z.string(),
  autorEmail: z.string().optional(),
  fecha: z.string(),
  texto: z.string(),
  tipo: z.enum(["reunion", "llamada", "whatsapp", "acuerdo"]).optional(),
});

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
  estado: z.enum(["prospecto", "activo", "recurrente", "inactivo"]).optional(),
  sintomaPrincipal: z.enum([
    "Google Maps desactualizado / sin botón WhatsApp",
    "Web lenta / sin certificado SSL",
    "Usa correos gratuitos (@gmail / @hotmail)",
    "Gestión manual de pedidos por redes",
    "Sin pasarela de pagos automatizada"
  ]).optional(),
  etapaPipeline: z.enum([
    "Detectado",
    "Contactado",
    "En Diagnóstico",
    "Cotización Presentada",
    "Cerrado Ganado",
    "Perdido"
  ]).optional(),
  fechaProximoSeguimiento: z.string().optional(),
  proximoContacto: proximoContactoSchema,
  infraestructura: infraestructuraSchema,
  historialNotas: z.array(notaSchema).optional(),
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
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener cliente";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
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
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar cliente";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
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
    const docRef = doc(db, "clientes", id);
    await deleteDoc(docRef);
    return NextResponse.json({ message: "Cliente eliminado correctamente" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar cliente";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
