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

const documentoSchema = z.object({
  tipo: z.enum([
    "acta_inicio", 
    "acta_entrega_conformidad", 
    "resumen_tecnico",
    "propuesta_sla",
    "solicitud_cambio",
    "traspaso_accesos",
    "informe_mantencion"
  ]),
  version: z.number().default(1),
  titulo: z.string().min(2),
  fechaEmision: z.string().default(() => new Date().toISOString().split("T")[0]),
  datosGenerados: z.object({
    proyectoNombre: z.string(),
    clienteNombre: z.string(),
    clienteRut: z.string().optional(),
    alcance: z.array(z.string()).default([]),
    acuerdosComerciales: z.string().optional(),
    fechasClave: z.object({
      inicio: z.string(),
      entrega: z.string(),
    }),
    entregablesTecnicos: z.array(z.string()).optional(),
    credencialesOAccesos: z.array(z.string()).optional(),
    clausulasGarantia: z.string().optional(),
    observaciones: z.string().optional(),
    slaDetalle: z.string().optional(),
    crDetalles: z.any().optional(),
    metricasPostventa: z.any().optional(),
  }),
  estado: z.enum(["borrador", "emitido", "firmado"]).default("emitido"),
  firmanteCliente: z.object({
    nombre: z.string(),
    rut: z.string(),
    fechaFirma: z.string().optional(),
  }).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const subcollRef = collection(db, "proyectos", id, "documentos");
    const q = query(subcollRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener documentos del proyecto";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(
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
    const result = documentoSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: "Datos inválidos del documento operativo", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const subcollRef = collection(db, "proyectos", id, "documentos");
    const docRef = await addDoc(subcollRef, {
      ...result.data,
      proyectoId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ id: docRef.id, message: "Documento operativo registrado con éxito" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al guardar documento operativo";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
