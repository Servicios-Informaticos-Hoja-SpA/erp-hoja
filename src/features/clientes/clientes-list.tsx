"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { ClientesListView } from "./clientes-list.view";
import { getClientes, deleteCliente, inhabilitarCliente, reactivarCliente, updateCliente } from "@/lib/services";
import { Cliente, SubEstadoProspecto } from "@/lib/types";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

function ClientesListContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState(initialQuery);
  const [loading, setLoading] = useState(true);

  // Sincronizar parámetro URL si cambia
  useEffect(() => {
    if (initialQuery) {
      queueMicrotask(() => setSearch(initialQuery));
    }
  }, [initialQuery]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      getClientes()
        .then((data) => {
          if (isMounted) {
            setClientes(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) {
            toast.error("Error al cargar clientes");
            setLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleInhabilitar = async (id: string) => {
    try {
      await inhabilitarCliente(id);
      toast.success("Registro inhabilitado");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo inhabilitar el registro");
    }
  };

  const handleReactivar = async (id: string, tipo?: "prospecto" | "cliente") => {
    try {
      await reactivarCliente(id, tipo);
      toast.success("Registro reactivado");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo reactivar el registro");
    }
  };

  const handleToggleSubEstado = async (id: string, currentSubEstado?: SubEstadoProspecto) => {
    const nextSubEstado: SubEstadoProspecto = currentSubEstado === "contactado" ? "sin_contacto" : "contactado";
    try {
      // Actualización optimista inmediata
      setClientes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, sub_estado: nextSubEstado } : c))
      );
      await updateCliente(id, { sub_estado: nextSubEstado });
      toast.success(
        nextSubEstado === "contactado"
          ? "Marcado como 📞 Contactado"
          : "Marcado como ⏳ Sin Contacto"
      );
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar sub-estado");
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCliente(id);
      toast.success("Cliente eliminado correctamente");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo eliminar el cliente");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <ClientesListView
      clientes={clientes}
      search={search}
      setSearch={setSearch}
      onRefresh={loadData}
      onInhabilitar={handleInhabilitar}
      onReactivar={handleReactivar}
      onToggleSubEstado={handleToggleSubEstado}
      onDelete={handleDelete}
      loading={loading}
    />
  );
}

export const ClientesList = () => {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ClientesListContent />
    </Suspense>
  );
};
