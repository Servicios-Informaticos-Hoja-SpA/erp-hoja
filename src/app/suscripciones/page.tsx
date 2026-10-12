import { SubscriptionsList } from "@/features/subscriptions/subscriptions-list";

export const metadata = {
  title: "Servicios Recurrentes & Hosting | Hoja SpA",
  description: "Control de suscripciones, cuentas cPanel, Vercel y renovaciones periódicas",
};

export default function SuscripcionesPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <SubscriptionsList />
    </div>
  );
}
