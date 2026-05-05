"use client";

import React, { useState, useEffect } from "react";
import { PresupuestoListView } from "./presupuesto-list.view";
import { 
  getPresupuestos, 
  savePresupuesto, 
  getConfig,
  getClientes,
  getCatalogo
} from "@/lib/services";
import { Presupuesto, Cliente, Servicio, ConfiguracionGlobal } from "@/lib/types";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Loader2, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export const PresupuestoList = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // States for the new side panel workflow
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
      const p = await getPresupuestos();
      setPresupuestos(p);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleDownload = async (p: Presupuesto, action: 'save' | 'preview' = 'save') => {
    setIsGeneratingPDF(true);
    setDownloadingPresupuesto(p);
    try {
      const config = await getConfig();
      if (!config) throw new Error("No se pudo cargar la configuración global");
      setGlobalConfig(config);
      
      // Esperamos un pequeño frame para asegurar que el DOM se renderizó con los nuevos estados
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const filename = `COT_${p.numero}_${p.cliente_nombre.replace(/\s+/g, '_').toUpperCase()}`;
      await generatePDF("presupuesto-document", filename, action);
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-[#abaafd]" />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
  };

  return (
    <>
      <PresupuestoListView
        presupuestos={presupuestos}
        search={search}
        setSearch={setSearch}
        onNew={() => setIsNew(true)}
        onEdit={(id) => {
          setEditingId(id);
          setIsNew(false);
        }}
        onView={handlePreview}
        onDownload={(p) => handleDownload(p, 'save')}
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
          className="!w-screen sm:!w-[70vw] sm:!max-w-[1100px] p-0 border-none shadow-2xl overflow-hidden flex flex-col [&>button]:hidden"
        >
          <SheetHeader className="p-6 bg-[#abaafd] text-[#2e3c7e] border-b border-[#2e3c7e]/10 flex flex-row items-center justify-between shrink-0">
            <div>
              <SheetTitle className="text-2xl font-black tracking-tight uppercase leading-none">
                {isNew ? "Crear Presupuesto" : "Editar Presupuesto"}
              </SheetTitle>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Hoja SpA Budget System</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setIsNew(false); setEditingId(null); }} className="rounded-full hover:bg-black/10">
              <X className="h-6 w-6" />
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
          <Loader2 className="h-12 w-12 animate-spin text-[#abaafd] mb-4" />
          <p className="text-lg font-black tracking-tighter uppercase">Generando Documento Tributario...</p>
          <p className="text-sm text-muted-foreground font-medium">Hoja SpA Engine v2.0</p>
          
          {/* Hidden template for PDF generation */}
          <div className="fixed left-[-9999px] top-0">
            {downloadingPresupuesto && (
              <PresupuestoPreview 
                data={downloadingPresupuesto} 
                config={globalConfig} 
              />
            )}
          </div>
        </div>
      )}

      {/* In-page Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="!max-w-[1000px] !w-[90vw] p-0 overflow-hidden bg-muted/20 border-none shadow-2xl">
          <DialogHeader className="p-4 bg-[#abaafd] text-[#2e3c7e] border-b border-[#2e3c7e]/10 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-full hover:bg-[#2e3c7e]/10 text-[#2e3c7e]"
              >
                <X className="h-5 w-5" />
              </Button>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight uppercase leading-none">
                  Vista Previa
                </DialogTitle>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Hoja SpA Budget System</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                if (downloadingPresupuesto) handleDownload(downloadingPresupuesto, 'save');
              }}
              className="rounded-full bg-[#2e3c7e] text-white hover:scale-105 transition-all gap-2"
            >
              <Download className="h-4 w-4" /> <span className="hidden xs:inline">Descargar PDF</span>
            </Button>
          </DialogHeader>
          <ScrollArea className="h-[75vh]">
            <div className="flex justify-center py-4">
              {downloadingPresupuesto && (
                <PresupuestoPreview data={downloadingPresupuesto} config={globalConfig} />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
