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
  nombre: z.string().min(1, "Nombre del servicio o gasto es requerido"),
  proveedor: z.string().min(1, "Proveedor es requerido"),
  categoria: z.enum([
    "bancario_tarjetas", 
    "hosting_propio", 
    "software_saas", 
    "dominios_propios", 
    "conectividad", 
    "otro"
  ]).default("otro"),
  cicloFacturacion: z.enum(["mensual", "anual", "semestral", "trimestral"]).default("mensual"),
  monto: z.number().nonnegative("Monto debe ser mayor o igual a 0"),
  moneda: z.enum(["CLP", "USD", "UF"]).default("CLP"),
  diaPago: z.number().min(1).max(31).optional(),
  montoEstimadoMensualCLP: z.number().optional(),
  fechaInicio: z.string().default(() => new Date().toISOString().split("T")[0]),
  fechaCorte: z.string().min(1, "Fecha de corte o próximo vencimiento es requerida"),
  estado: z.enum(["activo", "por_vencer", "vencido", "pausado", "suspendido"]).optional(),
  metodoPago: z.enum(["tarjeta_credito", "debito_automatico", "transferencia", "paypal", "otro"]).optional(),
  tarjetaOCuenta: z.string().optional(),
  aplicaFactura: z.boolean().optional(),
  deducibleIva: z.boolean().optional(),
  enlaceGestion: z.string().optional(),
  notas: z.string().optional(),
  historialPagos: z.array(z.object({
    id: z.string().optional(),
    fechaPago: z.string(),
    monto: z.number(),
    moneda: z.enum(["CLP", "USD", "UF"]),
    periodoCubierto: z.string().optional(),
    comprobanteRef: z.string().optional(),
    notas: z.string().optional(),
  })).optional(),
  // Compatibilidad legacy
  clienteId: z.string().optional(),
  clienteNombre: z.string().optional(),
  clienteTelefono: z.string().optional(),
  clienteEmail: z.string().optional(),
  dominio: z.string().optional(),
  tipoServicio: z.string().optional(),
  valorUFRef: z.number().optional(),
});

function calcularEstimadoMensualCLP(monto: number, moneda: string, ciclo: string): number {
  let multMoneda = 1;
  if (moneda === "UF") multMoneda = 38000;
  else if (moneda === "USD") multMoneda = 950;

  const montoEnCLP = monto * multMoneda;
  if (ciclo === "anual") return Math.round(montoEnCLP / 12);
  if (ciclo === "semestral") return Math.round(montoEnCLP / 6);
  if (ciclo === "trimestral") return Math.round(montoEnCLP / 3);
  return Math.round(montoEnCLP);
}

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
      let diasRestantes: number | undefined = undefined;

      // Cálculo reactivo de estado por fecha de corte
      if (estado !== "suspendido" && estado !== "pausado" && sub.fechaCorte) {
        const corteMs = new Date(sub.fechaCorte).getTime();
        diasRestantes = Math.ceil((corteMs - now) / (1000 * 60 * 60 * 24));
        if (diasRestantes < 0) {
          estado = "vencido";
        } else if (diasRestantes <= 7) {
          estado = "por_vencer";
        } else {
          estado = "activo";
        }
      }

      const estimadoCLP = sub.montoEstimadoMensualCLP || 
        calcularEstimadoMensualCLP(sub.monto || 0, sub.moneda || "CLP", sub.cicloFacturacion || "mensual");

      return {
        id: doc.id,
        nombre: sub.nombre || sub.dominio || sub.tipoServicio || "Servicio",
        proveedor: sub.proveedor || "Hoja SpA",
        categoria: sub.categoria || "otro",
        ...sub,
        estado,
        diasRestantes,
        montoEstimadoMensualCLP: estimadoCLP,
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
    const rawBody = await request.json();

    // Fallbacks inteligentes para datos heredados si faltan
    const body = {
      ...rawBody,
      nombre: rawBody.nombre || rawBody.dominio || rawBody.tipoServicio || "Servicio Recurrente",
      proveedor: rawBody.proveedor || "Proveedor General",
      categoria: rawBody.categoria || "otro",
      cicloFacturacion: rawBody.cicloFacturacion || "mensual",
      moneda: rawBody.moneda || "CLP",
      monto: typeof rawBody.monto === "number" ? rawBody.monto : Number(rawBody.monto || 0),
      fechaInicio: rawBody.fechaInicio || new Date().toISOString().split("T")[0],
      fechaCorte: rawBody.fechaCorte || new Date().toISOString().split("T")[0],
    };

    const result = subscriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ 
        error: "Datos de servicio recurrente inválidos", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const data = result.data;
    const now = Date.now();
    const corteMs = new Date(data.fechaCorte).getTime();
    const diffDays = Math.ceil((corteMs - now) / (1000 * 60 * 60 * 24));

    let estado = data.estado || "activo";
    if (estado !== "suspendido" && estado !== "pausado") {
      if (diffDays < 0) estado = "vencido";
      else if (diffDays <= 7) estado = "por_vencer";
      else estado = "activo";
    }

    const montoEstimadoMensualCLP = data.montoEstimadoMensualCLP || 
      calcularEstimadoMensualCLP(data.monto, data.moneda, data.cicloFacturacion);

    const docRef = await addDoc(collection(db, "subscriptions"), {
      ...data,
      estado,
      montoEstimadoMensualCLP,
      diasRestantes: diffDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ id: docRef.id, message: "Servicio recurrente registrado con éxito" });
  } catch (error: unknown) {
    console.error("POST SUBSCRIPTION ERROR:", error);
    const msg = error instanceof Error ? error.message : "Error al crear servicio recurrente";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
