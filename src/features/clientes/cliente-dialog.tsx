"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cliente } from "@/lib/types";

interface ClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
  onSave: (cliente: Partial<Cliente>) => Promise<void>;
}

export const ClienteDialog: React.FC<ClienteDialogProps> = ({
  open,
  onOpenChange,
  cliente,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nombre: "",
    email: "",
    telefono: "",
    social: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cliente) {
      setFormData(cliente);
    } else {
      setFormData({ nombre: "", email: "", telefono: "", social: "" });
    }
  }, [cliente, open]);

  const handleSubmit = async () => {
    if (!formData.nombre) return;
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-black text-secondary tracking-tight">
            {cliente ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre / Empresa *</Label>
            <Input 
              id="name" 
              value={formData.nombre} 
              onChange={e => setFormData({...formData, nombre: e.target.value})} 
              className="bg-muted/50 border-none h-11 font-bold" 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              className="bg-muted/50 border-none h-11" 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input 
              id="phone" 
              value={formData.telefono} 
              onChange={e => setFormData({...formData, telefono: e.target.value})} 
              className="bg-muted/50 border-none h-11" 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="social">Red Social / Web</Label>
            <Input 
              id="social" 
              value={formData.social} 
              onChange={e => setFormData({...formData, social: e.target.value})} 
              className="bg-muted/50 border-none h-11" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="w-full rounded-full h-11 font-bold"
          >
            {loading ? "Guardando..." : "Guardar Cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
