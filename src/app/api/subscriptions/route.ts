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

const subscriptionSchema = z.object({
  clienteId: z.string().min(1, "Cliente es requerido"),
  clienteNombre: z.string().min(1, "Nombre de cliente requerido"),
  clienteTelefono: z.string().optional(),
  clienteEmail: z.string().optional(),
  dominio: z.string().min(2, "Dominio requerido"),
  tipoServicio: z.enum([
    "Solo Correos", 
    "Web Corporativa", 
    "E-Commerce WooCommerce", 
    "Web App"
  ]),
  proveedor: z.enum([
    "Bluehosting cPanel", 
    "Vercel", 
    "Hetzner"
  ]),
  cicloFacturacion: z.enum(["mensual", "anual"]),
  monto: z.number().positive("Monto debe ser mayor a 0"),
  moneda: z.enum(["CLP", "UF"]),
  valorUFRef: z.number().optional(),
  fechaInicio: z.string(),
  fechaCorte: z.string(),
  estado: z.enum(["activo", "por_vencer", "vencido", "suspendido"]).optional(),
  notas: z.string().optional(),
});

export async function GET() {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const q = query(collection(db, "subscriptions"), orderBy("fechaCorte", "asc"));
    const snapshot = await getDocs(q);
    const now = Date.now();

    const data = snapshot.docs.map(doc => {
      const sub = doc.data();
      let estado = sub.estado || "activo";

      // Cálculo reactivo de estado por fecha de corte
      if (estado !== "suspendido" && sub.fechaCorte) {
        const corteMs = new Date(sub.fechaCorte).getTime();
        const diffDays = Math.ceil((corteMs - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          estado = "vencido";
        } else if (diffDays <= 7) {
          estado = "por_vencer";
        } else {
          estado = "activo";
        }
      }

      return {
        id: doc.id,
        ...sub,
        estado,
      };
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("GET SUBSCRIPTIONS ERROR:", error);
    const msg = error instanceof Error ? error.message : "Error al obtener suscripciones";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = subscriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ 
        error: "Datos de suscripción inválidos", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const data = result.data;
    const now = Date.now();
    const corteMs = new Date(data.fechaCorte).getTime();
    const diffDays = Math.ceil((corteMs - now) / (1000 * 60 * 60 * 24));

    let estado = data.estado || "activo";
    if (estado !== "suspendido") {
      if (diffDays < 0) estado = "vencido";
      else if (diffDays <= 7) estado = "por_vencer";
      else estado = "activo";
    }

    const docRef = await addDoc(collection(db, "subscriptions"), {
      ...data,
      estado,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ id: docRef.id, message: "Suscripción creada" });
  } catch (error: unknown) {
    console.error("POST SUBSCRIPTION ERROR:", error);
    const msg = error instanceof Error ? error.message : "Error al crear suscripción";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
