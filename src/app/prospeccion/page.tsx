import { Metadata } from "next";
import { ProspeccionView } from "@/features/prospeccion/prospeccion-view";

export const metadata: Metadata = {
  title: "Sesión de Prospección Comercial Guiada | Servicios Informáticos Hoja SpA",
  description: "Módulo de prospección comercial guiada sin límite de tiempo, enfocado en metas, racha diaria y plantillas de contacto rápido para Hoja SpA.",
};

export default function ProspeccionPage() {
  return (
    <main className="min-h-screen bg-background">
      <ProspeccionView />
    </main>
  );
}
