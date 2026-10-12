import React, { Suspense } from "react";
import { ProyectosList } from "@/features/proyectos/proyectos-list";
import { Loader2 } from "lucide-react";

export default function ProyectosPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ProyectosList />
    </Suspense>
  );
}
