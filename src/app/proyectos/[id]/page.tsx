"use client";

import React, { useEffect, useState, use } from "react";
import { Proyecto } from "@/lib/types";
import { getProyectoById, updateProyecto } from "@/lib/services";
import { ProyectoDetailView } from "@/features/proyectos/proyecto-detail.view";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProyectoPageProps {
  params: Promise<{ id: string }>;
}

export default function ProyectoPage({ params }: ProyectoPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProyecto = async () => {
      try {
        setLoading(true);
        const data = await getProyectoById(id);
        if (isMounted) {
          setProyecto(data);
          setError(null);
        }
      } catch (err: unknown) {
        console.error(err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error al cargar el proyecto");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProyecto();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSave = async () => {
    if (!proyecto || !proyecto.id) return;
    try {
      setIsSaving(true);
      await updateProyecto(proyecto.id, proyecto);
      toast.success("Proyecto actualizado correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar los cambios del proyecto");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-400 font-medium">Cargando gestión del proyecto...</p>
      </div>
    );
  }

  if (error || !proyecto) {
    return (
      <div className="container mx-auto p-6 max-w-2xl text-center space-y-4 pt-16">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-white">Proyecto no encontrado</h2>
        <p className="text-xs text-slate-400">{error || "No se pudo recuperar la información del proyecto especificado."}</p>
        <Button
          onClick={() => router.push("/proyectos")}
          className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Proyectos
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <ProyectoDetailView
        proyecto={proyecto}
        setProyecto={setProyecto}
        onSave={handleSave}
        isSaving={isSaving}
        onClose={() => router.push("/proyectos")}
      />
    </div>
  );
}
