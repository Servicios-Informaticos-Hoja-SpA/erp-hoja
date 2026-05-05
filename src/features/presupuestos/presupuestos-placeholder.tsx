"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";
import { useRouter } from "next/navigation";

export const BudgetPlaceholder = () => {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary/20 text-primary">
        <Construction size={40} />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight">Módulo de Presupuestos</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Estamos trabajando para traerte la mejor herramienta de creación de presupuestos. Pronto estará disponible.
      </p>
      <Button 
        variant="outline" 
        onClick={() => window.history.back()}
        className="gap-2"
      >
        <ArrowLeft size={18} />
        Volver al menú
      </Button>
    </div>
  );
};
