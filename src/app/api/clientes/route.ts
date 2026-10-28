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

const clienteSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  rut: z.string().optional(),
  telefono: z.string().optional(),
  contacto: z.string().optional(),
  social_web: z.string().optional(),
  social_instagram: z.string().optional(),
  social_linkedin: z.string().optional(),
  social_otro: z.string().optional(),

  // Modelo unificado comercial
  tipo_registro: z.enum(["prospecto", "cliente"]).optional(),
  sub_estado: z.enum(["sin_contacto", "contactado"]).optional(),
  proximoRecordatorio: z.string().optional(),
  recordatorioNota: z.string().optional(),
  recordatorioCompletado: z.boolean().optional(),

  // Retrocompatibilidad
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
  matrizOperativa: z.any().optional(),
});

export async function GET() {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const snapshot = await getDocs(collection(db, "clientes"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    data.sort((a: any, b: any) => {
      const nameA = (a.nombre || "").toString().toLowerCase();
      const nameB = (b.nombre || "").toString().toLowerCase();
      return nameA.localeCompare(nameB);
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("GET /api/clientes error:", error);
    const errorMsg = error instanceof Error ? error.message : "Error al obtener clientes";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const rawBody = await request.json();
    const sanitizedBody = sanitizeData(rawBody);
    
    // Validación con Zod
    const result = clienteSchema.safeParse(sanitizedBody);
    if (!result.success) {
      return NextResponse.json({ 
        error: "Datos inválidos", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const tipo_registro = result.data.tipo_registro || (result.data.estado === "prospecto" ? "prospecto" : "cliente");
    const sub_estado = tipo_registro === "prospecto" ? (result.data.sub_estado || "sin_contacto") : null;

    const rawData = {
      ...result.data,
      tipo_registro,
      sub_estado,
      activo: true,
      estado: result.data.estado || (tipo_registro === "prospecto" ? "prospecto" : "activo"),
      createdAt: new Date().toISOString()
    };

    const cleanData: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rawData)) {
      if (v !== undefined) {
        cleanData[k] = v;
      }
    }

    const docRef = await addDoc(collection(db, "clientes"), cleanData);
    
    return NextResponse.json({ id: docRef.id, message: "Cliente creado con éxito" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error al crear cliente";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

