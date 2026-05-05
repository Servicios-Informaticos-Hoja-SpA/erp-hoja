"use client";

import React, { useState, useEffect } from "react";
import { ClientesListView } from "./clientes-list.view";
import { getClientes, deleteCliente } from "@/lib/services";
import { Cliente } from "@/lib/types";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ClienteForm } from "./cliente-form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2, X } from "lucide-react";

export const ClientesList = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // States for the new side panel workflow
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const load = async () => {
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
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteCliente(id);
      toast.success("Cliente eliminado");
      load();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo eliminar el cliente");
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
      <ClientesListView
        clientes={clientes}
        search={search}
        setSearch={setSearch}
        onAdd={() => setIsNew(true)}
        onEdit={(id) => {
          setEditingId(id);
          setIsNew(false);
        }}
        onDelete={handleDelete}
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
          className="!w-[70vw] !max-w-[1100px] p-0 border-none shadow-2xl overflow-hidden flex flex-col"
        >
          <SheetHeader className="p-6 bg-[#abaafd] text-[#2e3c7e] border-b border-[#2e3c7e]/10 flex flex-row items-center justify-between shrink-0">
            <div>
              <SheetTitle className="text-2xl font-black tracking-tight uppercase leading-none">
                {isNew ? "Crear Cliente" : "Perfil de Cliente"}
              </SheetTitle>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Hoja SpA CRM System</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setIsNew(false); setEditingId(null); }} className="rounded-full hover:bg-black/10">
              <X className="h-6 w-6" />
            </Button>
          </SheetHeader>
          
          <div className="flex-1 overflow-hidden">
            <ClienteForm
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
    </>
  );
};
