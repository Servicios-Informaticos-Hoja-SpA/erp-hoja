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
import dynamic from "next/dynamic";
import { Loader2, X, Download, Briefcase, Pencil } from "lucide-react";

const PresupuestoForm = dynamic(
  () => import("./presupuesto-form").then((m) => m.PresupuestoForm),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center p-12 h-full text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Cargando editor de presupuestos...</p>
      </div>
    ),
  }
);

import { PresupuestoPreview } from "./presupuesto-preview.view";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
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

  const defaultGlobalConfig: ConfiguracionGlobal = {
    banco: "Banco Falabella",
    tipo_cuenta: "Cuenta Corriente",
    numero_cuenta: "1-983-101480-2",
    email_pago: "devhoja@gmail.com",
    email_contacto: "contacto@hojaspa.cl",
    web: "www.hojaspa.cl",
    telefono: "+56 9 5416 9597",
    rut: "78.364.078-3",
    nombre_titular: "SERVICIOS INFORMATICOS HOJA SPA",
  };

  const handleDownload = async (p: Presupuesto, action: 'save' | 'preview' = 'save') => {
    setIsGeneratingPDF(true);
    setDownloadingPresupuesto(p);
    try {
      let config = globalConfig;
      if (!config) {
        try {
          config = await getConfig();
        } catch {
          // Si falla la red, usar defaults institucionales
        }
      }
      const effectiveConfig = config || defaultGlobalConfig;
      if (!globalConfig) {
        setGlobalConfig(effectiveConfig);
      }
      
      // Breve espera para que React pinte el template oculto
      await new Promise(resolve => setTimeout(resolve, 250));
      
      const clientSlug = (p.cliente_nombre || "CLIENTE").replace(/\s+/g, '_').toUpperCase();
      const filename = `COT_${p.numero}_${clientSlug}`;
      await generatePDF("presupuesto-document-print", filename, action);
      toast.success(action === 'preview' ? "Vista previa generada" : "Documento descargado");
    } catch (err) {
      console.error("Error al procesar el documento PDF:", err);
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
      try {
        const config = await getConfig();
        setGlobalConfig(config || defaultGlobalConfig);
      } catch {
        setGlobalConfig(defaultGlobalConfig);
      }
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
          className="!w-screen sm:!w-[80vw] sm:!max-w-[1150px] p-0 border-none shadow-2xl overflow-hidden flex flex-col [&>button]:hidden bg-background"
        >
          <div className="flex-1 overflow-hidden h-full">
            {(isNew || !!editingId) && (
              <PresupuestoForm
                id={editingId || undefined}
                onClose={() => {
                  setIsNew(false);
                  setEditingId(null);
                }}
                onSuccess={() => {
                  setIsNew(false);
                  setEditingId(null);
                  load();
                }}
              />
            )}
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
      <div 
        aria-hidden="true" 
        style={{ 
          position: "fixed", 
          left: 0, 
          top: 0, 
          zIndex: -100, 
          opacity: 0, 
          pointerEvents: "none", 
          overflow: "hidden" 
        }}
      >
        {downloadingPresupuesto && (
          <PresupuestoPreview
            id="presupuesto-document-print"
            data={downloadingPresupuesto}
            config={globalConfig || defaultGlobalConfig}
            isPrinting={true}
          />
        )}
      </div>

      {/* Modal de Vista Previa de Alta Fidelidad */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="!max-w-5xl h-[92vh] flex flex-col p-0 border border-white/10 bg-card overflow-hidden shadow-2xl">
          <DialogHeader className="p-4 sm:px-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-slate-900/60">
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <span>Cotización N° {downloadingPresupuesto?.numero}</span>
                {downloadingPresupuesto?.version && downloadingPresupuesto.version > 1 && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono font-bold">
                    v{downloadingPresupuesto.version}
                  </span>
                )}
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-medium">
                Cliente: {downloadingPresupuesto?.cliente_nombre} &bull; Total: ${downloadingPresupuesto?.totales?.total?.toLocaleString("es-CL")} CLP
              </p>
            </div>

            {/* Acciones directas en el preview */}
            <div className="flex items-center gap-2 flex-wrap">
              {downloadingPresupuesto && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(downloadingPresupuesto, "save")}
                    className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-border"
                  >
                    <Download className="h-3.5 w-3.5" /> Descargar PDF
                  </Button>

                  {(() => {
                    const cl = clientes.find(c => c.id === downloadingPresupuesto.cliente_id || c.nombre === downloadingPresupuesto.cliente_nombre);
                    const tel = cl?.telefono;
                    if (!tel) return null;
                    return (
                      <WhatsAppButton
                        telefono={tel}
                        clienteNombre={downloadingPresupuesto.cliente_nombre}
                        size="sm"
                        className="h-9 px-3 text-xs rounded-xl shadow-none"
                      />
                    );
                  })()}

                  {downloadingPresupuesto.estado === "aprobado" && !downloadingPresupuesto.proyecto_id && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsPreviewOpen(false);
                        handleCreateProjectFromBudget(downloadingPresupuesto);
                      }}
                      className="h-9 px-3 rounded-xl text-xs font-black bg-emerald-500 text-white gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <Briefcase className="h-3.5 w-3.5" /> Convertir a Proyecto
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsPreviewOpen(false);
                      setEditingId(downloadingPresupuesto.id || null);
                    }}
                    className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 hover:bg-white/10"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                </>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950/80">
            {downloadingPresupuesto && globalConfig ? (
              <div className="w-full max-w-[860px] mx-auto pb-10">
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
