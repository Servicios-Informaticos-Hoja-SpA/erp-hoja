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

const proyectoSchema = z.object({
  presupuestoId: z.string().optional(),
  presupuestoNumero: z.string().optional(),
  clienteId: z.string(),
  clienteNombre: z.string(),
  clienteRut: z.string().optional(),
  clienteTelefono: z.string().optional(),
  clienteEmail: z.string().optional(),
  nombre: z.string().min(2, "El nombre del proyecto es obligatorio"),
  descripcion: z.string().optional().default(""),
  tipoServicio: z.enum([
    "desarrollo_web", 
    "soporte_nube", 
    "ciberseguridad", 
    "inventario_hardware", 
    "consultoria", 
    "otro"
  ]),
  fase: z.enum([
    "planificacion", 
    "desarrollo", 
    "revision_qa", 
    "entregado", 
    "pausado", 
    "cancelado"
  ]).default("planificacion"),
  fechaInicio: z.string().optional().default(() => new Date().toISOString().split("T")[0]),
  fechaEntregaComprometida: z.string().optional().default(""),
  fechaEntregaReal: z.string().optional(),
  montos: z.object({
    neto: z.number(),
    iva: z.number(),
    total: z.number(),
  }),
  hitosPago: z.array(hitoPagoSchema).default([]),
  progresoPorcentaje: z.number().default(0),
  checklist: z.array(checklistItemSchema).default([]),
  solicitudesCambio: z.array(z.any()).optional().default([]),
  slaDetalle: z.string().optional(),
  especificacionesCierre: z.any().optional(),
  propuestaFormalizada: z.boolean().optional().default(false),
  actaEntregaFormalizada: z.boolean().optional().default(false),
  alcanceItems: z.array(z.string()).optional().default([]),
  reuniones: z.array(z.any()).optional().default([]),
  credenciales: z.array(z.any()).optional().default([]),
  garantia: z.any().optional(),
  archivosAdjuntos: z.array(z.any()).optional().default([]),
  pendientes: z.array(z.any()).optional().default([]),
  condicionesComerciales: z.any().optional(),
});

export async function GET() {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const q = query(collection(db, "proyectos"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener proyectos";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    
    // Validación con Zod
    const result = proyectoSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: "Datos inválidos de proyecto", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, "proyectos"), {
      ...result.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ id: docRef.id, message: "Proyecto creado exitosamente" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al crear proyecto";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
