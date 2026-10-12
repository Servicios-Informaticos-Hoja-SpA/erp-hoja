"use client";

import React, { useState, useEffect } from "react";
import { ClienteFormView } from "./cliente-form.view";
import { Cliente, ClienteNota, AccesoOperativo } from "@/lib/types";
import { getClienteById, saveCliente, updateCliente } from "@/lib/services";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ClienteFormProps {
  id?: string;
  onSuccess?: () => void;
}

export const ClienteForm: React.FC<ClienteFormProps> = ({ id, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nombre: "",
    email: "",
    contacto: "",
    rut: "",
    telefono: "",
    social_instagram: "",
    social_linkedin: "",
    social_web: "",
    social_otro: "",
    estado: "prospecto",
    sintomaPrincipal: undefined,
    etapaPipeline: "Detectado",
    fechaProximoSeguimiento: "",
    proximoContacto: {
      fecha: "",
      motivo: "",
      estado: "pendiente",
    },
    historialNotas: [],
    infraestructura: {
      dominio: { nombre: "", proveedor: "", fechaRenovacion: "", costoAnual: 0 },
      dns: { proveedor: "", registrosClave: "" },
      hosting: { proveedor: "", plan: "", fechaRenovacion: "", costoMensualOAnual: 0 },
      accesos: [],
    },
  });
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      let isMounted = true;
      const load = async () => {
        try {
          const data = await getClienteById(id);
          if (isMounted) {
            setFormData({
              ...data,
              estado: data.estado || "prospecto",
              sintomaPrincipal: data.sintomaPrincipal,
              etapaPipeline: data.etapaPipeline || "Detectado",
              fechaProximoSeguimiento: data.fechaProximoSeguimiento || "",
              proximoContacto: data.proximoContacto || { fecha: "", motivo: "", estado: "pendiente" },
              historialNotas: data.historialNotas || [],
              infraestructura: {
                dominio: data.infraestructura?.dominio || { nombre: "", proveedor: "", fechaRenovacion: "", costoAnual: 0 },
                dns: data.infraestructura?.dns || { proveedor: "", registrosClave: "" },
                hosting: data.infraestructura?.hosting || { proveedor: "", plan: "", fechaRenovacion: "", costoMensualOAnual: 0 },
                accesos: data.infraestructura?.accesos || [],
              },
            });
            setLoading(false);
          }
        } catch (err) {
          console.error(err);
          toast.error("Error al cargar cliente");
          if (isMounted) setLoading(false);
        }
      };
      load();
      return () => {
        isMounted = false;
      };
    }
  }, [id]);

  const handleAddNota = (texto: string, tipo: "reunion" | "llamada" | "whatsapp" | "acuerdo") => {
    if (!texto.trim()) return;
    const nuevaNota: ClienteNota = {
      id: `nota-${Date.now()}`,
      autorNombre: user?.displayName || user?.email?.split("@")[0] || "Operador",
      autorEmail: user?.email || "",
      fecha: new Date().toISOString(),
      texto: texto.trim(),
      tipo,
    };
    setFormData((prev) => ({
      ...prev,
      historialNotas: [nuevaNota, ...(prev.historialNotas || [])],
    }));
    toast.success("Nota agregada al historial");
  };

  const handleRemoveNota = (notaId: string) => {
    setFormData((prev) => ({
      ...prev,
      historialNotas: (prev.historialNotas || []).filter((n) => n.id !== notaId),
    }));
  };

  const handleAddAcceso = (acceso: AccesoOperativo) => {
    setFormData((prev) => ({
      ...prev,
      infraestructura: {
        ...prev.infraestructura,
        accesos: [...(prev.infraestructura?.accesos || []), acceso],
      },
    }));
    toast.success("Acceso agregado");
  };

  const handleRemoveAcceso = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      infraestructura: {
        ...prev.infraestructura,
        accesos: (prev.infraestructura?.accesos || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleSave = async () => {
    if (!formData.nombre) {
      toast.warning("El nombre es obligatorio");
      return;
    }

    setIsSaving(true);
    try {
      if (id) {
        await updateCliente(id, formData);
      } else {
        await saveCliente(formData);
      }
      toast.success(id ? "Cliente actualizado" : "Cliente creado");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar cliente");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <Skeleton className="h-7 w-44 rounded-xl bg-slate-800" />
          <Skeleton className="h-10 w-28 rounded-xl bg-slate-800" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-xl bg-slate-800/70" />
          <Skeleton className="h-12 w-full rounded-xl bg-slate-800/70" />
          <Skeleton className="h-12 w-full rounded-xl bg-slate-800/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ClienteFormView 
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        isSaving={isSaving}
        title={id ? "Editar Cliente" : "Nuevo Cliente"}
        onAddNota={handleAddNota}
        onRemoveNota={handleRemoveNota}
        onAddAcceso={handleAddAcceso}
        onRemoveAcceso={handleRemoveAcceso}
      />
    </div>
  );
};
