import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { z } from "zod";

const updateProspectSchema = z.object({
  estado: z.enum(["por_contactar", "contactado", "respondio", "cotizado", "cerrado", "descartado"]).optional(),
  notas: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateProspectSchema.parse(body);

    const prospectRef = doc(db, "prospects", id);
    const snap = await getDoc(prospectRef);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Prospecto no encontrado" }, { status: 404 });
    }

    const currentProspect = snap.data();
    const nowIso = new Date().toISOString();

    const updates: Record<string, unknown> = {
      ...validated,
      updatedAt: nowIso,
    };

    await updateDoc(prospectRef, updates);

    // Sincronizar actualización de notas con la colección 'clientes'
    if (validated.notas !== undefined) {
      try {
        const telefono = currentProspect.telefono?.trim();
        const email = currentProspect.email?.trim();
        const nombre = currentProspect.nombreNegocio?.trim();

        let matchedClienteId: string | null = null;
        let matchedClienteData: any = null;

        if (telefono) {
          const q = query(collection(db, "clientes"), where("telefono", "==", telefono));
          const s = await getDocs(q);
          if (!s.empty) {
            matchedClienteId = s.docs[0].id;
            matchedClienteData = s.docs[0].data();
          }
        }
        if (!matchedClienteId && email) {
          const q = query(collection(db, "clientes"), where("email", "==", email));
          const s = await getDocs(q);
          if (!s.empty) {
            matchedClienteId = s.docs[0].id;
            matchedClienteData = s.docs[0].data();
          }
        }
        if (!matchedClienteId && nombre) {
          const q = query(collection(db, "clientes"), where("nombre", "==", nombre));
          const s = await getDocs(q);
          if (!s.empty) {
            matchedClienteId = s.docs[0].id;
            matchedClienteData = s.docs[0].data();
          }
        }

        if (matchedClienteId && matchedClienteData) {
          const notaTexto = validated.notas.trim();
          const existingNotas = Array.isArray(matchedClienteData.historialNotas) ? matchedClienteData.historialNotas : [];
          
          const nuevaEntrada = notaTexto ? [{
            id: `nota-${Date.now()}`,
            autorNombre: "Prospección Comercial",
            fecha: nowIso,
            texto: `Nota de Prospección: ${notaTexto}`,
            tipo: "llamada" as const,
          }] : [];

          await updateDoc(doc(db, "clientes", matchedClienteId), {
            notas: notaTexto,
            historialNotas: [...nuevaEntrada, ...existingNotas],
            updatedAt: nowIso,
          });
        }
      } catch (syncErr) {
        console.warn("Aviso al sincronizar notas de prospecto con clientes:", syncErr);
      }
    }

    return NextResponse.json({
      prospect: {
        id: snap.id,
        ...currentProspect,
        ...updates,
      },
    });
  } catch (error: unknown) {
    console.error("ERROR EN UPDATE PROSPECT:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar prospecto";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
