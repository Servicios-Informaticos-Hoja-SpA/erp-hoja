"use client";

import React, { useState, useEffect } from "react";
import { PresupuestoListView } from "./presupuesto-list.view";
import { 
  getPresupuestos, 
  updatePresupuesto,
  getConfig,
  saveProyecto,
  getClientes
} from "@/lib/services";
import { Presupuesto, ConfiguracionGlobal, Proyecto, PresupuestoEstado, PresupuestoSeguimiento, Cliente } from "@/lib/types";
import { getDefaultChecklist } from "@/features/proyectos/checklist-templates";
import { generatePDF } from "@/lib/pdf-utils";
import { toast } from "sonner";
import { PresupuestoForm } from "./presupuesto-form";
import { PresupuestoPreview } from "./presupuesto-preview.view";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const PresupuestoList = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");

  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Side panel workflow
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [downloadingPresupuesto, setDownloadingPresupuesto] = useState<Presupuesto | null>(null);
  const [globalConfig, setGlobalConfig] = useState<ConfiguracionGlobal | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [p, cls] = await Promise.all([
        getPresupuestos(),
        getClientes().catch(() => [])
      ]);
      setPresupuestos(p);
      setClientes(cls);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar presupuestos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (user) {
      Promise.all([
        getPresupuestos(),
        getClientes().catch(() => [])
      ])
        .then(([p, cls]) => {
          if (isMounted) {
            setPresupuestos(p);
            setClientes(cls);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) {
            toast.error("Error al cargar presupuestos");
            setLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Si viene con ?id=... en la URL, pre-filtrar o enfocar
  useEffect(() => {
    if (queryId && presupuestos.length > 0) {
      const found = presupuestos.find(p => p.id === queryId);
      if (found) {
        setSearch(found.numero);
      }
    }
  }, [queryId, presupuestos]);

  const handleDownload = async (p: Presupuesto, action: 'save' | 'preview' = 'save') => {
    setIsGeneratingPDF(true);
    setDownloadingPresupuesto(p);
    try {
      const config = await getConfig();
      if (!config) throw new Error("No se pudo cargar la configuración global");
      setGlobalConfig(config);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const clientSlug = (p.cliente_nombre || "CLIENTE").replace(/\s+/g, '_').toUpperCase();
      const filename = `COT_${p.numero}_${clientSlug}`;
      await generatePDF("presupuesto-document-print", filename, action);
      toast.success(action === 'preview' ? "Vista previa generada" : "Documento descargado");
    } catch (err) {
      console.error(err);
      toast.error("Error al procesar el documento");
    } finally {
      setIsGeneratingPDF(false);
      setDownloadingPresupuesto(null);
    }
  };

  const handlePreview = async (p: Presupuesto) => {
    setDownloadingPresupuesto(p);
    setIsPreviewOpen(true);
    if (!globalConfig) {
      const config = await getConfig();
      setGlobalConfig(config);
    }
  };

  const handleCreateProjectFromBudget = async (p: Presupuesto) => {
    if (!p.id) return;
    try {
      const totalAmount = p.totales?.total || 0;
      const nuevoProyecto: Partial<Proyecto> = {
        presupuestoId: p.id,
        presupuestoNumero: p.numero,
        clienteId: p.cliente_id,
        clienteNombre: p.cliente_nombre,
        nombre: p.nombre_proyecto || `Proyecto COT ${p.numero} - ${p.cliente_nombre}`,
        descripcion: p.descripcion_proyecto || "",
        tipoServicio: "desarrollo_web",
        fase: "planificacion",
        fechaInicio: new Date().toISOString().split("T")[0],
        fechaEntregaComprometida: "",
        montos: {
          neto: p.totales?.neto || 0,
          iva: p.totales?.iva || 0,
          total: totalAmount,
        },
        hitosPago: [
          {
            id: `hito-1-${Date.now()}`,
            titulo: "50% Anticipo de Inicio",
            porcentaje: 50,
            monto: Math.round(totalAmount * 0.5),
            fechaEstimada: new Date().toISOString().split("T")[0],
            estado: "pendiente",
          },
          {
            id: `hito-2-${Date.now()}`,
            titulo: "50% Contra Entrega y Conformidad",
            porcentaje: 50,
            monto: Math.round(totalAmount * 0.5),
            fechaEstimada: "",
            estado: "pendiente",
          },
        ],
        progresoPorcentaje: 0,
        checklist: getDefaultChecklist("desarrollo_web"),
      };

      const res = await saveProyecto(nuevoProyecto);

      // Actualizar presupuesto con estado aprobado y proyecto_id
      await updatePresupuesto(p.id, {
        estado: "aprobado",
        proyecto_id: res.id,
        alertaSilenciada: true,
      });

      toast.success("¡Proyecto creado y cotización aprobada con éxito!", {
        action: {
          label: "Ver Proyecto",
          onClick: () => router.push(`/proyectos?id=${res.id}`),
        },
      });

      load();
    } catch (err) {
      console.error(err);
      toast.error("Error al crear proyecto a partir de la cotización");
    }
  };

  // Gestión de Ciclo de Vida: Actualizar estado
  const handleUpdateEstado = async (p: Presupuesto, nuevoEstado: PresupuestoEstado) => {
    if (!p.id) return;
    try {
      const updates: Partial<Presupuesto> = {
        estado: nuevoEstado,
      };

      if (nuevoEstado === "enviado" && !p.fechaEnvio) {
        updates.fechaEnvio = new Date().toISOString();
      }

      // Si pasa a negociación, aprobado o rechazado, despeja la alerta de sin respuesta
      if (nuevoEstado === "en_negociacion" || nuevoEstado === "aprobado" || nuevoEstado === "rechazado") {
        updates.alertaSilenciada = true;
      }

      await updatePresupuesto(p.id, updates);
      setPresupuestos(prev => prev.map(item => item.id === p.id ? { ...item, ...updates } : item));
      toast.success(`Cotización N° ${p.numero} actualizada a estado: ${nuevoEstado.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al cambiar estado de la cotización");
    }
  };

  // Despejar / Silenciar Alerta
  const handleDismissAlert = async (p: Presupuesto) => {
    if (!p.id) return;
    try {
      await updatePresupuesto(p.id, { alertaSilenciada: true });
      setPresupuestos(prev => prev.map(item => item.id === p.id ? { ...item, alertaSilenciada: true } : item));
      toast.success(`Alerta de seguimiento despejada para Cotización N° ${p.numero}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al despejar alerta");
    }
  };

  // Registrar Seguimiento Comercial
  const handleRegisterFollowUp = async (p: Presupuesto, nota: string, tipo: string = "llamada") => {
    if (!p.id) return;
    try {
      const nuevoSeguimiento: PresupuestoSeguimiento = {
        fecha: new Date().toISOString(),
        nota: nota.trim(),
        tipo: tipo as "llamada" | "reunion" | "correo" | "whatsapp" | "otro",
        autor: user?.displayName || user?.email || "Equipo Hoja SpA",
      };

      const historial = [...(p.historialSeguimientos || []), nuevoSeguimiento];
      const updates: Partial<Presupuesto> = {
        ultimoSeguimiento: nuevoSeguimiento,
        historialSeguimientos: historial,
        alertaSilenciada: false, // reinicia el contador de días con la nueva fecha
        // Si el cliente respondió o hubo interacción, pasamos a en_negociacion
        estado: p.estado === "borrador" ? "enviado" : (p.estado === "enviado" ? "en_negociacion" : p.estado),
      };

      await updatePresupuesto(p.id, updates);
      setPresupuestos(prev => prev.map(item => item.id === p.id ? { ...item, ...updates } : item));
      toast.success(`Seguimiento registrado con éxito para Cotización N° ${p.numero}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar seguimiento");
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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut(auth);
      window.location.href = "/login";
    } catch (err) {
      console.error("Error signing out", err);
    }
  };

  return (
    <>
      <PresupuestoListView
        presupuestos={presupuestos}
        clientes={clientes}
        search={search}
        setSearch={setSearch}
        onNew={() => setIsNew(true)}
        onEdit={(id) => {
          setEditingId(id);
          setIsNew(false);
        }}
        onView={handlePreview}
        onDownload={(p) => handleDownload(p, 'save')}
        onCreateProject={handleCreateProjectFromBudget}
        onUpdateEstado={handleUpdateEstado}
        onDismissAlert={handleDismissAlert}
        onRegisterFollowUp={handleRegisterFollowUp}
        loading={loading}
        onLogout={handleLogout}
      />

      {/* Side Panel for Create/Edit */}
      <Sheet open={isNew || !!editingId} onOpenChange={(open) => {
        if (!open) {
          setIsNew(false);
          setEditingId(null);
        }
      }}>
        <SheetContent 
          side="right" 
          className="!w-screen sm:!w-[75vw] sm:!max-w-[1200px] p-0 border-l border-white/10 shadow-2xl overflow-hidden flex flex-col [&>button]:hidden bg-card"
        >
          <SheetHeader className="p-6 bg-slate-900 border-b border-white/10 flex flex-row items-center justify-between shrink-0">
            <div>
              <SheetTitle className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-none text-foreground">
                {isNew ? "Emitir Nuevo Presupuesto" : "Editar Presupuesto y Condiciones"}
              </SheetTitle>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">
                Servicios Informáticos Hoja SpA &bull; Propuesta Comercial
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setIsNew(false); setEditingId(null); }} 
              className="rounded-xl hover:bg-white/10 text-foreground h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
          </SheetHeader>
          
          <div className="flex-1 overflow-hidden">
            <PresupuestoForm
              id={editingId || undefined}
              onSuccess={() => {
                setIsNew(false);
                setEditingId(null);
                load();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* PDF Generation Overlay */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-base font-black text-foreground">Generando documento institucional PDF...</p>
        </div>
      )}

      {/* Template oculto de generación de PDF para presupuestos */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        {downloadingPresupuesto && globalConfig && (
          <PresupuestoPreview
            id="presupuesto-document-print"
            data={downloadingPresupuesto}
            config={globalConfig}
          />
        )}
      </div>

      {/* Modal de Vista Previa Rápida */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 border border-white/10 bg-card overflow-hidden">
          <DialogHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="text-base font-black">
              Vista Previa &bull; Cotización N° {downloadingPresupuesto?.numero}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950/40">
            {downloadingPresupuesto && globalConfig ? (
              <div className="max-w-[800px] mx-auto shadow-2xl rounded-2xl overflow-hidden">
                <PresupuestoPreview
                  id="presupuesto-document-modal"
                  data={downloadingPresupuesto}
                  config={globalConfig}
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
