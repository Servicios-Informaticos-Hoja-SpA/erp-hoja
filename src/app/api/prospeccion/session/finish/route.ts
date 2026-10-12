import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc 
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { z } from "zod";
import { UserStreak } from "@/lib/types";

const finishSessionSchema = z.object({
  sessionId: z.string().min(1, "SessionId requerido"),
  duracionSegundos: z.number().int().min(0),
  userId: z.string().optional().default("hoja-operador-principal"),
});

function getDaysDifference(d1Str: string, d2Str: string): number {
  try {
    const d1 = new Date(d1Str + "T00:00:00Z");
    const d2 = new Date(d2Str + "T00:00:00Z");
    const diff = Math.abs(d2.getTime() - d1.getTime());
    return Math.round(diff / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

export async function POST(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = finishSessionSchema.parse(body);

    const sessionRef = doc(db, "prospecting_sessions", validated.sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    const sessionCurrent = sessionSnap.data();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const horaFin = now.toISOString();

    const duracionSegundos = validated.duracionSegundos;
    const duracionMinutos = Math.max(1, Math.round(duracionSegundos / 60));
    const metaCumplida = (sessionCurrent.contactosCompletados || 0) >= (sessionCurrent.metaObjetivo || 3);

    // Actualizar sesión
    await updateDoc(sessionRef, {
      horaFin,
      duracionSegundos,
      duracionMinutos,
      metaCumplida,
      estado: "finalizada",
      updatedAt: horaFin,
    });

    const finishedSession = {
      id: sessionSnap.id,
      ...sessionCurrent,
      horaFin,
      duracionSegundos,
      duracionMinutos,
      metaCumplida,
      estado: "finalizada",
    };

    // Actualizar Racha Diaria del Usuario en 'user_streaks'
    const userId = validated.userId || sessionCurrent.userId || "hoja-operador-principal";
    const streakRef = doc(db, "user_streaks", userId);
    const streakSnap = await getDoc(streakRef);

    let updatedStreak: UserStreak = {
      userId,
      rachaActual: 1,
      rachaMaxima: 1,
      ultimoDiaActivo: todayStr,
      totalSesionesCompletadas: 1,
      totalContactosHistoricos: sessionCurrent.contactosCompletados || 0,
      updatedAt: horaFin,
    };

    if (streakSnap.exists()) {
      const currentStreak = streakSnap.data() as UserStreak;
      const ultimo = currentStreak.ultimoDiaActivo || "";

      let rachaActual = currentStreak.rachaActual || 0;
      let rachaMaxima = currentStreak.rachaMaxima || 0;

      if (metaCumplida) {
        if (!ultimo) {
          rachaActual = 1;
        } else if (ultimo === todayStr) {
          // Ya prospectó hoy, mantiene la racha
          rachaActual = Math.max(1, rachaActual);
        } else {
          const diffDays = getDaysDifference(ultimo, todayStr);
          if (diffDays === 1) {
            // Día consecutivo: racha aumenta en 1
            rachaActual += 1;
          } else {
            // Se rompió la racha: reinicia en 1
            rachaActual = 1;
          }
        }
        rachaMaxima = Math.max(rachaMaxima, rachaActual);
      }

      updatedStreak = {
        userId,
        rachaActual,
        rachaMaxima,
        ultimoDiaActivo: metaCumplida ? todayStr : ultimo,
        totalSesionesCompletadas: (currentStreak.totalSesionesCompletadas || 0) + (metaCumplida ? 1 : 0),
        totalContactosHistoricos: (currentStreak.totalContactosHistoricos || 0) + (sessionCurrent.contactosCompletados || 0),
        updatedAt: horaFin,
      };

      await setDoc(streakRef, updatedStreak, { merge: true });
    } else {
      if (metaCumplida) {
        await setDoc(streakRef, updatedStreak);
      }
    }

    return NextResponse.json({
      session: finishedSession,
      streak: updatedStreak,
    });
  } catch (error: unknown) {
    console.error("ERROR EN FINISH SESSION:", error);
    const message = error instanceof Error ? error.message : "Error al finalizar sesión";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
