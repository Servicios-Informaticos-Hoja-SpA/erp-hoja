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

const hitoPagoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  porcentaje: z.number(),
  monto: z.number(),
  fechaEstimada: z.string(),
  estado: z.enum(["pendiente", "cobrado", "vencido"]),
  fechaCobroReal: z.string().optional(),
  comprobanteRef: z.string().optional(),
});

const checklistItemSchema = z.object({
  id: z.string().optional(),
  orden: z.number(),
  categoria: z.string(),
  titulo: z.string(),
  descripcion: z.string().optional(),
  completada: z.boolean(),
  completadaPor: z.string().optional(),
  completadaEn: z.string().optional(),
  estadoKanban: z.enum(["por_hacer", "en_desarrollo", "bloqueado", "pruebas_qa", "completado"]).optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  prioridad: z.enum(["baja", "media", "alta"]).optional(),
  responsable: z.string().optional(),
  ticketIdRelacionado: z.string().optional(),
});

const proyectoUpdateSchema = z.object({
  nombre: z.string().optional(),
  descripcion: z.string().optional(),
  tipoServicio: z.enum([
    "desarrollo_web", 
    "soporte_nube", 
    "ciberseguridad", 
    "inventario_hardware", 
    "consultoria", 
    "otro"
  ]).optional(),
  fase: z.enum([
    "planificacion", 
    "desarrollo", 
    "revision_qa", 
    "entregado", 
    "pausado", 
    "cancelado"
  ]).optional(),
  fechaInicio: z.string().optional(),
  fechaEntregaComprometida: z.string().optional(),
  fechaEntregaReal: z.string().optional(),
  montos: z.object({
    neto: z.number(),
    iva: z.number(),
    total: z.number(),
  }).optional(),
  hitosPago: z.array(hitoPagoSchema).optional(),
  progresoPorcentaje: z.number().optional(),
  checklist: z.array(checklistItemSchema).optional(),
  solicitudesCambio: z.array(z.any()).optional(),
  slaDetalle: z.string().optional(),
  especificacionesCierre: z.any().optional(),
  propuestaFormalizada: z.boolean().optional(),
  actaEntregaFormalizada: z.boolean().optional(),
  alcanceItems: z.array(z.string()).optional(),
  clienteEmail: z.string().optional(),
  reuniones: z.array(z.any()).optional(),
  credenciales: z.array(z.any()).optional(),
  garantia: z.any().optional(),
  archivosAdjuntos: z.array(z.any()).optional(),
  pendientes: z.array(z.any()).optional(),
  condicionesComerciales: z.any().optional(),
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
    const docRef = doc(db, "proyectos", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
    }
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener proyecto";
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
    const result = proyectoUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: "Datos de actualización de proyecto inválidos", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const docRef = doc(db, "proyectos", id);
    
    await updateDoc(docRef, {
      ...result.data,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ message: "Proyecto actualizado correctamente" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar proyecto";
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
    const docRef = doc(db, "proyectos", id);
    await deleteDoc(docRef);
    return NextResponse.json({ message: "Proyecto eliminado" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar proyecto";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
