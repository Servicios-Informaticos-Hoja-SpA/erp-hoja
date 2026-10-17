"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { SubscriptionsListView } from "./subscriptions-list.view";

const SubscriptionFormDialog = dynamic(
  () => import("./subscription-form-dialog").then((m) => m.SubscriptionFormDialog),
  { ssr: false }
);
import { 
  Subscription, 
  Cliente,
  CicloFacturacion 
} from "@/lib/types";
import { 
  getSubscriptions, 
  getClientes,
  createSubscription, 
  updateSubscription, 
  deleteSubscription, 
  renewSubscription,
} from "@/lib/services";
import { toast } from "sonner";

export function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [preselectedClienteId, setPreselectedClienteId] = useState<string | undefined>(undefined);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [subsData, clientesData] = await Promise.all([
        getSubscriptions(),
        getClientes().catch(() => []),
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

  const handleNew = (clienteId?: string) => {
    setSelectedSub(null);
    setPreselectedClienteId(clienteId);
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
        toast.success("Gasto recurrente registrado con éxito");
      }
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la información");
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSubscription(id);
      toast.success("Servicio eliminado de la base de datos");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el registro");
      throw err;
    }
  };

  const handlePauseToggle = async (sub: Subscription) => {
    if (!sub.id) return;
    try {
      const isPaused = sub.estado === "pausado" || sub.estado === "suspendido";
      const nuevoEstado = isPaused ? "activo" : "pausado";
      await updateSubscription(sub.id, { estado: nuevoEstado });
      toast.success(isPaused ? "Servicio reactivado" : "Servicio pausado");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al cambiar el estado del servicio");
      throw err;
    }
  };

  const handleRenovar = async (
    id: string, 
    payload: { periodo?: CicloFacturacion; monto?: number; notas?: string; comprobanteRef?: string }
  ) => {
    try {
      await renewSubscription(id, payload);
      toast.success("Pago registrado y ciclo de servicio renovado con éxito");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al renovar el ciclo de servicio");
      throw err;
    }
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
        onPauseToggle={handlePauseToggle}
        onRenovar={handleRenovar}
      />

      {dialogOpen && (
        <SubscriptionFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          subscription={selectedSub}
          clientes={clientes}
          preselectedClienteId={preselectedClienteId}
          onSave={handleSave}
        />
      )}
    </>
  );
}
