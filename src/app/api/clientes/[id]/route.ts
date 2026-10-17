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
import { sanitizeData } from "@/lib/sanitize";
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
  recordatorio: z.string().optional(),
});

function removeUndefined(obj: unknown): unknown {
  if (obj === null || obj === undefined) return undefined;
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined).filter(v => v !== undefined);
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const cleanVal = removeUndefined(v);
      if (cleanVal !== undefined) {
        res[k] = cleanVal;
      }
    }
    return res;
  }
  return obj;
}

const clienteUpdateSchema = z.object({
  nombre: z.string().optional(),
  email: z.string().optional().nullable(),
  rut: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  social_web: z.string().optional().nullable(),
  social_instagram: z.string().optional().nullable(),
  social_linkedin: z.string().optional().nullable(),
  social_otro: z.string().optional().nullable(),

  // Modelo unificado comercial
  tipo_registro: z.string().optional().nullable(),
  sub_estado: z.string().optional().nullable(),
  proximoRecordatorio: z.string().optional().nullable(),
  recordatorioNota: z.string().optional().nullable(),
  recordatorioCompletado: z.boolean().optional().nullable(),

  // Inhabilitación / Reactivación
  activo: z.boolean().optional(),
  inhabilitadoAt: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  comuna: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),

  // Retrocompatibilidad
  estado: z.string().optional().nullable(),
  sintomaPrincipal: z.string().optional().nullable(),
  etapaPipeline: z.string().optional().nullable(),
  fechaProximoSeguimiento: z.string().optional().nullable(),
  proximoContacto: z.any().optional(),
  infraestructura: z.any().optional(),
  historialNotas: z.any().optional(),
  matrizOperativa: z.any().optional(),
}).passthrough();

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
    const rawBody = await request.json();
    const sanitizedBody = sanitizeData(rawBody);
    
    // Validación con Zod permisiva y extensible
    const result = clienteUpdateSchema.safeParse(sanitizedBody);
    if (!result.success) {
      console.error("[PUT /api/clientes/[id]] Zod validation error:", JSON.stringify(result.error.format()));
      return NextResponse.json({ 
        error: "Datos de actualización inválidos", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const docRef = doc(db, "clientes", id);

    // Filtrar estrictamente campos undefined recursivamente para compatibilidad total con Firestore
    const cleanUpdateData = (removeUndefined(result.data) || {}) as Record<string, unknown>;
    delete cleanUpdateData.id;
    
    await updateDoc(docRef, {
      ...cleanUpdateData,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ message: "Cliente actualizado con éxito" });
  } catch (error: unknown) {
    console.error("[PUT /api/clientes/[id]] Server error:", error);
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
