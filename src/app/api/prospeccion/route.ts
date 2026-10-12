import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  doc,
  getDoc
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { verifySession } from "@/lib/auth-server";
import { Prospect, ProspectingSession, UserStreak } from "@/lib/types";

export async function GET(request: Request) {
  if (!await verifySession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "hoja-operador-principal";

    // 1. Obtener racha del usuario
    let streak: UserStreak = {
      userId,
      rachaActual: 0,
      rachaMaxima: 0,
      ultimoDiaActivo: "",
      totalSesionesCompletadas: 0,
      totalContactosHistoricos: 0,
    };

    const streakRef = doc(db, "user_streaks", userId);
    const streakSnap = await getDoc(streakRef);
    if (streakSnap.exists()) {
      streak = { id: streakSnap.id, ...(streakSnap.data() as UserStreak) };
    }

    // 2. Obtener sesiones recientes (últimas 30)
    const sessionsQuery = query(
      collection(db, "prospecting_sessions"),
      orderBy("horaInicio", "desc"),
      limit(30)
    );
    const sessionsSnap = await getDocs(sessionsQuery);
    const rawSessions: ProspectingSession[] = sessionsSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as ProspectingSession),
    }));
    const sessions = rawSessions.filter((s) => s.estado !== "cancelada");

    // Identificar si existe una sesión en curso o pausada (activa o sin hora de fin creada recientemente)
    const activeSession = sessions.find((s) => 
      !s.horaFin && (s.estado === "activa" || s.estado === "pausada" || !s.estado)
    ) || null;

    // 3. Obtener prospectos recientes
    const prospectsQuery = query(
      collection(db, "prospects"),
      orderBy("fechaContacto", "desc"),
      limit(100)
    );
    const prospectsSnap = await getDocs(prospectsQuery);
    const prospects: Prospect[] = prospectsSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Prospect),
    }));

    // 4. Cálculos de Estadísticas (Día, Semana, Mes)
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // A) Vista Día
    const prospectsHoy = prospects.filter((p) => p.fechaContacto?.startsWith(todayStr));
    const sessionsHoy = sessions.filter((s) => s.fecha === todayStr && s.horaFin);
    const minutosHoy = sessionsHoy.reduce((acc, s) => acc + (s.duracionMinutos || 0), 0);
    const segundosHoy = sessionsHoy.reduce((acc, s) => acc + (s.duracionSegundos || 0), 0);
    const totalSegundosEfectivos = segundosHoy > 0 ? segundosHoy : minutosHoy * 60;
    const promedioMinutosPorContacto = prospectsHoy.length > 0 
      ? Number((totalSegundosEfectivos / 60 / prospectsHoy.length).toFixed(1))
      : 0;

    const statsDia = {
      contactosHoy: prospectsHoy.length,
      tiempoMinutosTotal: Math.round(totalSegundosEfectivos / 60),
      tiempoSegundosTotal: totalSegundosEfectivos,
      promedioMinutosPorContacto,
    };

    // B) Vista Semana (Lunes a Domingo de la semana actual)
    const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = Lunes, ..., 6 = Domingo
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const diasSemanaNombres = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const desgloseSemanal = Array.from({ length: 7 }).map((_, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      const dateStr = d.toISOString().split("T")[0];

      const prospectosDelDia = prospects.filter((p) => p.fechaContacto?.startsWith(dateStr));
      const respuestasDelDia = prospectosDelDia.filter((p) =>
        ["respondio", "cotizado", "cerrado"].includes(p.estado)
      );

      return {
        dia: diasSemanaNombres[index],
        fecha: dateStr,
        contactos: prospectosDelDia.length,
        respuestas: respuestasDelDia.length,
        esHoy: dateStr === todayStr,
      };
    });

    const totalContactosSemana = desgloseSemanal.reduce((acc, d) => acc + d.contactos, 0);
    const totalRespuestasSemana = desgloseSemanal.reduce((acc, d) => acc + d.respuestas, 0);

    // C) Vista Mes (Mes en curso)
    const prospectsMes = prospects.filter((p) => {
      if (!p.fechaContacto) return false;
      const d = new Date(p.fechaContacto);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const totalContactosMes = prospectsMes.length;
    const respuestasMes = prospectsMes.filter((p) =>
      ["respondio", "cotizado", "cerrado"].includes(p.estado)
    ).length;
    const cotizacionesMes = prospectsMes.filter((p) =>
      ["cotizado", "cerrado"].includes(p.estado)
    ).length;
    const cerradosMes = prospectsMes.filter((p) => p.estado === "cerrado").length;
    const tasaRespuestaMes = totalContactosMes > 0 
      ? Math.round((respuestasMes / totalContactosMes) * 100) 
      : 0;

    return NextResponse.json({
      streak,
      activeSession,
      sessions,
      prospects,
      stats: {
        dia: statsDia,
        semana: {
          desglose: desgloseSemanal,
          totalContactos: totalContactosSemana,
          totalRespuestas: totalRespuestasSemana,
        },
        mes: {
          totalContactos: totalContactosMes,
          respuestas: respuestasMes,
          cotizaciones: cotizacionesMes,
          cerrados: cerradosMes,
          tasaRespuesta: tasaRespuestaMes,
        },
      },
    });
  } catch (error: unknown) {
    console.error("ERROR EN GET PROSPECCION:", error);
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
