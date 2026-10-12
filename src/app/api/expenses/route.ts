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

const expenseSchema = z.object({
  proveedor: z.string().min(1, "Proveedor es requerido"),
  concepto: z.string().min(1, "Concepto es requerido"),
  categoria: z.enum([
    "hosting_servidores",
    "dominios",
    "licencias_software",
    "conectividad_oficina",
    "otro"
  ]),
  monto: z.number().positive("Monto debe ser mayor a 0"),
  moneda: z.enum(["CLP", "USD", "UF"]),
  fecha: z.string(),
  esFijoRecurrente: z.boolean().default(false),
  frecuencia: z.enum(["mensual", "anual"]).optional(),
  notas: z.string().optional(),
});

export async function GET() {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const q = query(collection(db, "expenses"), orderBy("fecha", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("GET EXPENSES ERROR:", error);
    const msg = error instanceof Error ? error.message : "Error al obtener gastos";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = expenseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ 
        error: "Datos de gasto inválidos", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, "expenses"), {
      ...result.data,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ id: docRef.id, message: "Gasto operativo guardado" });
  } catch (error: unknown) {
    console.error("POST EXPENSE ERROR:", error);
    const msg = error instanceof Error ? error.message : "Error al guardar gasto";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
