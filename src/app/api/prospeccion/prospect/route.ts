import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc,
  query,
  where,
  getDocs
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { z } from "zod";
import { ProspectSintoma, ClienteSintomaPrincipal } from "@/lib/types";

const createProspectSchema = z.object({
  sessionId: z.string().min(1, "SessionId requerido"),
  userId: z.string().optional().default("hoja-operador-principal"),
  userEmail: z.string().optional().default("operaciones@hoja.cl"),
  nombreNegocio: z.string().min(1, "Nombre del negocio requerido"),
  telefono: z.string().optional().default(""),
  email: z.string().optional().default(""),
  canal: z.enum(["whatsapp", "telefono", "correo", "no_contactar"]).optional().default("whatsapp"),
  sintoma: z.enum([
    "Sin página web",
    "Web lenta / Sin certificado SSL",
    "Usa correo gratuito (@gmail / @hotmail)",
    "Ficha de Google Maps abandonada",
    "Venta manual por redes / Sin pasarela"
  ]),
  mensajeEnviado: z.string().optional().default(""),
  estado: z.enum(["por_contactar", "contactado", "respondio", "cotizado", "cerrado", "descartado"]).optional(),
  notas: z.string().optional().default(""),
});

// Mapeo de síntomas de prospección a síntomas principales de clientes CRM
function mapSintomaToCliente(sintoma: ProspectSintoma): ClienteSintomaPrincipal {
  switch (sintoma) {
    case "Ficha de Google Maps abandonada":
      return "Google Maps desactualizado / sin botón WhatsApp";
    case "Web lenta / Sin certificado SSL":
      return "Web lenta / sin certificado SSL";
    case "Usa correo gratuito (@gmail / @hotmail)":
      return "Usa correos gratuitos (@gmail / @hotmail)";
    case "Venta manual por redes / Sin pasarela":
      return "Gestión manual de pedidos por redes";
    case "Sin página web":
    default:
      return "Google Maps desactualizado / sin botón WhatsApp";
  }
}

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createProspectSchema.parse(body);

    const now = new Date();
    const fechaIso = now.toISOString();

    const estadoFinal = validated.estado || (validated.canal === "no_contactar" ? "por_contactar" : "contactado");

    // 1. Guardar Prospecto en la colección 'prospects'
    const prospectData = {
      sessionId: validated.sessionId,
      userId: validated.userId,
      userEmail: validated.userEmail,
      nombreNegocio: validated.nombreNegocio.trim(),
      telefono: validated.telefono?.trim() || "",
      email: validated.email?.trim() || "",
      canal: validated.canal,
      sintoma: validated.sintoma,
      mensajeEnviado: validated.mensajeEnviado?.trim() || "",
      fechaContacto: fechaIso,
      estado: estadoFinal,
      notas: validated.notas?.trim() || "",
      createdAt: fechaIso,
      updatedAt: fechaIso,
    };

    const prospectRef = await addDoc(collection(db, "prospects"), prospectData);

    // 2. Actualizar sesión actual incrementando contactos
    const sessionRef = doc(db, "prospecting_sessions", validated.sessionId);
    const sessionSnap = await getDoc(sessionRef);
    let sessionData = null;

    if (sessionSnap.exists()) {
      const current = sessionSnap.data();
      const nuevosContactos = (current.contactosCompletados || 0) + 1;
      const metaCumplida = nuevosContactos >= (current.metaObjetivo || 3);

      await updateDoc(sessionRef, {
        contactosCompletados: nuevosContactos,
        metaCumplida,
        updatedAt: fechaIso,
      });

      sessionData = {
        id: sessionSnap.id,
        ...current,
        contactosCompletados: nuevosContactos,
        metaCumplida,
      };
    }

    // 3. Crear o actualizar contacto en 'clientes' para que quede sincronizado en el CRM
    try {
      const telTrim = validated.telefono?.trim() || "";
      const emailTrim = validated.email?.trim() || "";

      let clienteExiste = false;
      if (telTrim) {
        const clientesQuery = query(
          collection(db, "clientes"),
          where("telefono", "==", telTrim)
        );
        const clienteSnap = await getDocs(clientesQuery);
        if (!clienteSnap.empty) clienteExiste = true;
      }

      if (!clienteExiste && emailTrim) {
        const clientesQueryEmail = query(
          collection(db, "clientes"),
          where("email", "==", emailTrim)
        );
        const emailSnap = await getDocs(clientesQueryEmail);
        if (!emailSnap.empty) clienteExiste = true;
      }

      if (!clienteExiste) {
        const nextContactDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        const etapaPipeline = validated.canal === "no_contactar" ? "Detectado" : "Contactado";
        const canalTexto = 
          validated.canal === "whatsapp" ? "Primer contacto enviado por WhatsApp" :
          validated.canal === "telefono" ? "Contacto por llamada telefónica directa (sin WhatsApp)" :
          validated.canal === "correo" ? "Primer contacto enviado por Correo Electrónico" :
          "Prospecto registrado en sesión guiada (pendiente de primer contacto)";

        await addDoc(collection(db, "clientes"), {
          nombre: validated.nombreNegocio.trim(),
          telefono: telTrim,
          email: emailTrim,
          tipo_registro: "prospecto",
          sub_estado: validated.canal === "no_contactar" ? "sin_contacto" : "contactado",
          estado: "prospecto",
          notas: validated.notas?.trim() || "",
          sintomaPrincipal: mapSintomaToCliente(validated.sintoma),
          etapaPipeline,
          fechaProximoSeguimiento: nextContactDate,
          proximoContacto: {
            fecha: nextContactDate,
            motivo: validated.canal === "no_contactar"
              ? `Primer contacto pendiente: ${validated.sintoma}`
              : `Seguimiento de prospección: ${validated.sintoma}`,
            estado: "pendiente",
          },
          historialNotas: [
            ...(validated.notas?.trim() ? [{
              id: `nota-${Date.now()}-obs`,
              autorNombre: "Prospección Guiada",
              autorEmail: validated.userEmail,
              fecha: fechaIso,
              texto: validated.notas.trim(),
              tipo: "llamada" as const,
            }] : []),
            {
              id: `nota-${Date.now()}`,
              autorNombre: "Prospección Guiada",
              autorEmail: validated.userEmail,
              fecha: fechaIso,
              texto: `${canalTexto}. Síntoma: ${validated.sintoma}`,
              tipo: validated.canal === "whatsapp" ? "whatsapp" : validated.canal === "telefono" ? "llamada" : validated.canal === "correo" ? "acuerdo" : "reunion",
            },
          ],
          createdAt: fechaIso,
          updatedAt: fechaIso,
        });
      } else {
        // Si el cliente/prospecto ya existe en CRM, anexar nota a su historial
        try {
          const matchQuery = telTrim 
            ? query(collection(db, "clientes"), where("telefono", "==", telTrim))
            : query(collection(db, "clientes"), where("email", "==", emailTrim));
          const existingSnap = await getDocs(matchQuery);
          if (!existingSnap.empty) {
            const existingDoc = existingSnap.docs[0];
            const existingData = existingDoc.data();
            const existingNotas = Array.isArray(existingData.historialNotas) ? existingData.historialNotas : [];
            const nuevaEntrada = {
              id: `nota-${Date.now()}`,
              autorNombre: "Prospección Guiada",
              autorEmail: validated.userEmail,
              fecha: fechaIso,
              texto: `${validated.canal === "whatsapp" ? "WhatsApp" : validated.canal === "telefono" ? "Llamada" : validated.canal === "correo" ? "Correo" : "Contacto"}: ${validated.sintoma}.${validated.notas ? ` Nota: ${validated.notas}` : ""}`,
              tipo: validated.canal === "whatsapp" ? "whatsapp" : validated.canal === "telefono" ? "llamada" : validated.canal === "correo" ? "acuerdo" : "reunion",
            };
            await updateDoc(doc(db, "clientes", existingDoc.id), {
              historialNotas: [nuevaEntrada, ...existingNotas],
              ...(validated.notas ? { notas: validated.notas.trim() } : {}),
              updatedAt: fechaIso,
            });
          }
        } catch (crmAppendErr) {
          console.warn("Aviso al anexar nota a cliente existente:", crmAppendErr);
        }
      }
    } catch (crmErr) {
      console.warn("Advertencia al sincronizar con CRM clientes:", crmErr);
    }

    return NextResponse.json({
      prospect: {
        id: prospectRef.id,
        ...prospectData,
      },
      session: sessionData,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("ERROR EN POST PROSPECT:", error);
    const message = error instanceof Error ? error.message : "Error al registrar prospecto";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
