import { PresupuestoForm } from "@/features/presupuestos/presupuesto-form";
import { use } from "react";

export default function EditarPresupuestoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PresupuestoForm id={id} />;
}
