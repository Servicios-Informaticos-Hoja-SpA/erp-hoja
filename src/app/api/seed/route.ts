import { NextResponse } from "next/server";
import { collection, addDoc } from "firebase/firestore/lite";
import { db } from "@/lib/firebase";

export async function GET() {
  console.log("--- SEEDING DATABASE (Lite SDK) ---");
  try {
    // 1. Crear Clientes de Ejemplo
    const c1 = await addDoc(collection(db, "clientes"), {
      nombre: "Cliente de Prueba 1",
      email: "prueba1@hoja.dev",
      telefono: "+56912345678",
      social: "@prueba1",
      createdAt: new Date().toISOString()
    });

    const c2 = await addDoc(collection(db, "clientes"), {
      nombre: "Empresa de Tecnología Hoja",
      email: "contacto@hoja.tech",
      telefono: "+56987654321",
      social: "hoja.tech",
      createdAt: new Date().toISOString()
    });

    // 2. Crear Presupuesto de Ejemplo
    await addDoc(collection(db, "presupuestos"), {
      numero: "0001",
      fecha: new Date().toISOString(),
      cliente_id: c1.id,
      cliente_nombre: "Cliente de Prueba 1",
      descripcion_proyecto: "Desarrollo de Aplicación Web",
      items: [
        { descripcion: "Desarrollo Frontend", precio: 1500000, cantidad: 1, total: 1500000 },
        { descripcion: "Configuración Cloud", precio: 500000, cantidad: 1, total: 500000 }
      ],
      parametros_personalizados: {
        "Plazo": "15 días",
        "Garantía": "6 meses"
      },
      totales: { subtotal: 2000000, total: 2000000 },
      version: 1,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      message: "Base de datos poblada con éxito (Lite SDK)", 
      ids: { clients: [c1.id, c2.id] } 
    });
  } catch (error: unknown) {
    console.error("SEEDING ERROR:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
