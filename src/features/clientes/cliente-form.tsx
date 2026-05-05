"use client";

import React, { useState, useEffect } from "react";
import { ClienteFormView } from "./cliente-form.view";
import { Cliente } from "@/lib/types";
import { getClienteById, saveCliente, updateCliente } from "@/lib/services";
import { toast } from "sonner";

interface ClienteFormProps {
  id?: string;
  onSuccess?: () => void;
}

export const ClienteForm: React.FC<ClienteFormProps> = ({ id, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nombre: "",
    email: "",
    contacto: "",
    rut: "",
    telefono: "",
    social_instagram: "",
    social_linkedin: "",
    social_web: "",
    social_otro: ""
  });
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      const load = async () => {
        setLoading(true);
        try {
          const data = await getClienteById(id);
          setFormData(data);
        } catch (err) {
          console.error(err);
          toast.error("Error al cargar cliente");
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [id]);

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
      <div className="flex items-center justify-center h-full text-muted-foreground font-bold">
        Cargando datos del cliente...
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
      />
    </div>
  );
};
