import React, { Suspense } from "react";
import { FlujoCajaView } from "@/features/flujo-caja/flujo-caja-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Flujo de Caja & Proyección F29 SII | Hoja SpA",
  description: "Control de flujo de caja, margen bruto, costos de infraestructura y proyección tributaria mensual del F29 / SII",
};

export default function FlujoDeCajaAliasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <FlujoCajaView />
    </Suspense>
  );
}
