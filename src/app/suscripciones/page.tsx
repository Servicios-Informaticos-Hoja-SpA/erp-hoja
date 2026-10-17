import { SubscriptionsList } from "@/features/subscriptions/subscriptions-list";

export const metadata = {
  title: "Servicios Recurrentes & Gastos de Empresa | Hoja SpA",
  description: "Gestión de costos fijos, hosting propio, comisiones de tarjetas bancarias, licencias SaaS y renovaciones periódicas",
};

export default function SuscripcionesPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <SubscriptionsList />
    </div>
  );
}
