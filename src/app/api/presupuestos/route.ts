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
  id: z.string().optional(),
  descripcion: z.string().default(""),
  detalle: z.string().optional().default(""),
  precio: z.coerce.number().default(0),
  cantidad: z.coerce.number().default(1),
  total: z.coerce.number().default(0),
  frecuencia: z.string().optional(),
});

const presupuestoSchema = z.object({
  numero: z.string().default("0001"),
  cliente_id: z.string().min(1, "El cliente es obligatorio"),
  cliente_nombre: z.string().default(""),
  nombre_proyecto: z.string().optional().or(z.literal("")),
  descripcion_proyecto: z.string().optional().or(z.literal("")),
  items: z.array(presupuestoItemSchema).default([]),
  servicios_opcionales: z.array(presupuestoItemSchema).optional().default([]),
  parametros_personalizados: z.record(z.string(), z.any()).optional(),
  forma_pago: z.string().optional(),
  plazo_entrega: z.string().optional(),
  condiciones_comerciales: z.string().optional(),
  totales: z.object({
    neto: z.coerce.number().default(0),
    iva: z.coerce.number().default(0),
    total: z.coerce.number().default(0),
  }).optional(),
  moneda: z.enum(["CLP", "UF"]).optional().default("CLP"),
  valorUFReferencial: z.coerce.number().optional(),
  bloqueDesarrollo: z.object({
    titulo: z.string().optional(),
    monto: z.coerce.number().optional().default(0),
    anticipoPorcentaje: z.coerce.number().default(50),
    entregaPorcentaje: z.coerce.number().default(50),
    anticipoMonto: z.coerce.number().optional(),
    entregaMonto: z.coerce.number().optional(),
    montoAnticipo: z.coerce.number().optional(),
    montoEntrega: z.coerce.number().optional(),
  }).optional(),
  bloqueContinuidad: z.object({
    modalidad: z.enum([
      "ano_1_incluido",
      "recurrente_mensual",
      "recurrente_anual",
      "incluido_ano1",
      "mensual",
      "anual"
    ]).optional().default("ano_1_incluido"),
    monto: z.coerce.number().optional(),
    montoRecurrente: z.coerce.number().optional(),
    monedaRecurrente: z.enum(["CLP", "UF"]).optional(),
    detalle: z.string().optional(),
  }).optional(),
  tokenPublico: z.string().optional(),
  propuestaAceptadaEn: z.string().optional(),
  propuestaAceptadaPor: z.string().optional(),
  version: z.coerce.number().optional(),
  estado: z.enum(["borrador", "enviado", "emitido", "en_negociacion", "aprobado", "rechazado", "vencido"]).optional().default("borrador"),
  proyecto_id: z.string().optional(),
  fechaEnvio: z.string().optional(),
  ultimoSeguimiento: z.any().optional(),
  alertaSilenciada: z.boolean().optional(),
  motivoRechazo: z.string().optional(),
  historialSeguimientos: z.array(z.any()).optional(),
  fecha: z.any().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
}).passthrough();

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
  } catch (error: unknown) {
    console.error("GET PRESUPUESTO ERROR:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, ...rest } = body;
    const isEdit = typeof id === "string" && id.trim().length > 0;

    // Validación con Zod: si es creación requiere esquema completo, si es edición permite parcial
    const result = isEdit ? presupuestoSchema.partial().safeParse(rest) : presupuestoSchema.safeParse(rest);
    if (!result.success) {
      console.error("Zod Validation Error in Presupuestos:", JSON.stringify(result.error.format(), null, 2));
      return NextResponse.json({ 
        error: "Datos de presupuesto inválidos", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const data = result.data;

    if (isEdit) {
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
      const tokenPublico = data.tokenPublico || crypto.randomUUID();
      const docRef = await addDoc(collection(db, "presupuestos"), {
        ...data,
        tokenPublico,
        estado: data.estado || "borrador",
        version: 1,
        fecha: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      return NextResponse.json({ id: docRef.id, tokenPublico, message: "Presupuesto creado" });
    }
  } catch (error: unknown) {
    console.error("POST PRESUPUESTO ERROR:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de presupuesto requerido" }, { status: 400 });
    }

    const docRef = doc(db, "presupuestos", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ message: "Presupuesto actualizado con éxito" });
  } catch (error: unknown) {
    console.error("PATCH PRESUPUESTO ERROR:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
