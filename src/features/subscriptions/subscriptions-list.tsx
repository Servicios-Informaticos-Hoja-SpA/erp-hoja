"use client";

import React, { useEffect, useState, useCallback } from "react";
import { SubscriptionsListView } from "./subscriptions-list.view";
import { SubscriptionFormDialog } from "./subscription-form-dialog";
import { 
  Subscription, 
  Cliente 
} from "@/lib/types";
import { 
  getSubscriptions, 
  createSubscription, 
  updateSubscription, 
  deleteSubscription, 
  renovarSubscription, 
  getClientes 
} from "@/lib/services";
import { toast } from "sonner";

export function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [subsData, clientesData] = await Promise.all([
        getSubscriptions(),
        getClientes(),
      ]);
      setSubscriptions(subsData);
      setClientes(clientesData);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar los servicios recurrentes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNew = () => {
    setSelectedSub(null);
    setDialogOpen(true);
  };

  const handleEdit = (sub: Subscription) => {
    setSelectedSub(sub);
    setDialogOpen(true);
  };

  const handleSave = async (data: Partial<Subscription>) => {
    try {
      if (selectedSub?.id) {
        await updateSubscription(selectedSub.id, data);
        toast.success("Servicio recurrente actualizado correctamente");
      } else {
        await createSubscription(data);
        toast.success("Servicio recurrente creado con éxito");
      }
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la información");
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este servicio recurrente? Esta acción no se puede deshacer.")) {
      return;
    }
    try {
      await deleteSubscription(id);
      toast.success("Servicio recurrente eliminado");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar la suscripción");
    }
  };

  const handleRenovar = async (id: string) => {
    try {
      await renovarSubscription(id);
      toast.success("Ciclo de servicio renovado exitosamente");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al renovar el ciclo de servicio");
    }
  };

  const handleSendWhatsApp = (sub: Subscription, tipo: "preventivo" | "vencido") => {
    const cliente = clientes.find((c) => c.id === sub.clienteId);
    let telefono = cliente?.telefono?.replace(/[^0-9]/g, "") || "";

    if (!telefono) {
      const prompted = prompt("Ingresa el número de WhatsApp del cliente (ej. 56912345678):");
      if (!prompted) return;
      telefono = prompted.replace(/[^0-9]/g, "");
    }

    if (telefono.startsWith("9") && telefono.length === 9) {
      telefono = `56${telefono}`;
    }

    const fechaCorteStr = sub.fechaCorte ? new Date(sub.fechaCorte).toLocaleDateString("es-CL") : "próximamente";
    const montoStr = sub.moneda === "UF" 
      ? sub.monto.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) 
      : `$${sub.monto.toLocaleString("es-CL")}`;

    let mensaje = "";
    if (tipo === "preventivo") {
      mensaje = `Hola ${sub.clienteNombre}, te recordamos desde Servicios Informáticos Hoja SpA que el servicio de hosting y casillas corporativas para ${sub.dominio} vence el ${fechaCorteStr}. Monto a renovar: ${montoStr} ${sub.moneda}. Si requieres los datos de transferencia, avísanos por este medio.`;
    } else {
      mensaje = `Estimado/a ${sub.clienteNombre}, el servicio para ${sub.dominio} se encuentra vencido. Para evitar la interrupción de correos corporativos y del sitio web, por favor confirma tu comprobante a la brevedad.`;
    }

    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <SubscriptionsListView
        subscriptions={subscriptions}
        clientes={clientes}
        loading={loading}
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRenovar={handleRenovar}
        onSendWhatsApp={handleSendWhatsApp}
      />

      <SubscriptionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subscription={selectedSub}
        clientes={clientes}
        onSave={handleSave}
      />
    </>
  );
}
