import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken } = body;

    // En una implementación real, aquí verificaríamos el idToken con firebase-admin.
    // Por ahora, establecemos la cookie de sesión de forma segura.
    if (idToken) {
      const cookieStore = await cookies();
      cookieStore.set("session_active", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 semana
      });

      return NextResponse.json({ message: "Sesión establecida" });
    }

    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("session_active");
  return NextResponse.json({ message: "Sesión cerrada" });
}
