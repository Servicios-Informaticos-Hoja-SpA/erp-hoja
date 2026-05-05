"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Globe, 
  Edit3, 
  Trash2, 
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Camera,
  Share2,
  ExternalLink,
  Info,
  LogOut
} from "lucide-react";
import { Cliente } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ClientesListViewProps {
  clientes: Cliente[];
  search: string;
  setSearch: (val: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onLogout: () => void;
  loading: boolean;
}

export const ClientesListView: React.FC<ClientesListViewProps> = ({
  clientes,
  search,
  setSearch,
  onAdd,
  onEdit,
  onDelete,
  onLogout,
  loading
}) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const filtered = clientes.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.rut?.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(`${field}-${text}`);
    toast.success(`${field} copiado al portapapeles`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-12 md:px-[10%] lg:px-[15%] xl:px-[15%]">
      <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.history.back()} 
            className="rounded-full bg-muted/50 text-primary shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground leading-none">CRM Clientes</h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Gestión de identidad y contactos comerciales</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onLogout}
            className="gap-2 text-muted-foreground hover:text-destructive transition-colors font-bold px-2 sm:px-4"
          >
            <LogOut className="h-4 w-4" /> <span className="hidden xs:inline">Cerrar Sesión</span>
          </Button>
          <Button onClick={onAdd} className="gap-2 rounded-2xl px-4 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg font-black shadow-xl shadow-[#abaafd]/20 bg-[#abaafd] text-[#2e3c7e] transition-all hover:scale-105">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" /> <span className="whitespace-nowrap">Nuevo <span className="hidden xs:inline">Cliente</span></span>
          </Button>
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nombre, email o RUT..." 
          className="pl-14 py-6 sm:py-8 text-base sm:text-lg rounded-3xl bg-card border-none focus-visible:ring-primary shadow-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground animate-pulse font-bold">Cargando base de clientes...</div>
        ) : filtered.map(c => (
          <div key={c.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 group">
            {/* Tarjeta Principal de Información */}
            <Card className="lg:col-span-8 overflow-hidden border-none shadow-lg bg-card/50 backdrop-blur-sm transition-all hover:shadow-2xl">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#abaafd] text-[#2e3c7e] font-black text-xl sm:text-2xl shadow-xl shadow-[#abaafd]/20">
                      {c.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-3 min-w-0 flex-1">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-foreground leading-tight truncate">{c.nombre}</h3>
                        <p className="text-[10px] sm:text-sm font-bold text-[#abaafd] uppercase tracking-widest">{c.rut || "Sin RUT"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground font-medium">
                        {c.email && (
                          <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-full border border-white/5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] sm:max-w-none">
                            <Mail className="h-3 w-3 shrink-0" /> {c.email}
                          </div>
                        )}
                        {c.telefono && (
                          <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-full border border-white/5">
                            <Phone className="h-3 w-3" /> {c.telefono}
                          </div>
                        )}
                      </div>

                      {/* Iconos de Redes Sociales */}
                      <div className="flex gap-2 sm:gap-3 pt-2">
                        {c.social_web && (
                          <a href={c.social_web} target="_blank" rel="noopener noreferrer" className="p-2 bg-secondary/10 rounded-xl text-secondary hover:bg-secondary hover:text-white transition-all">
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                        {c.social_instagram && (
                          <a href={`https://instagram.com/${c.social_instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-pink-500/10 rounded-xl text-pink-500 hover:bg-pink-500 hover:text-white transition-all">
                            <Camera className="h-4 w-4" />
                          </a>
                        )}
                        {c.social_linkedin && (
                          <a href={c.social_linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600/10 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                            <Share2 className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 justify-end sm:justify-start border-t sm:border-none pt-4 sm:pt-0 border-muted/20">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(c.id!)} className="rounded-xl h-10 w-10 sm:h-12 sm:w-12 bg-muted/20 sm:bg-transparent hover:bg-primary/10 hover:text-primary transition-all">
                      <Edit3 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id!)} className="rounded-xl h-10 w-10 sm:h-12 sm:w-12 bg-muted/20 sm:bg-transparent hover:bg-destructive/10 hover:text-destructive transition-all">
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tarjeta de Copiado Rápido (Quick Copy) */}
            <Card className="lg:col-span-4 border-none shadow-lg bg-secondary/5 border border-secondary/10 backdrop-blur-sm">
              <CardContent className="p-6 h-full flex flex-col justify-center gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-1">Copiado Rápido</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!c.rut}
                    onClick={() => copyToClipboard(c.rut!, 'RUT')}
                    className="justify-start gap-2 h-10 border-none bg-white/5 hover:bg-white/10 font-bold"
                  >
                    {copiedField === `RUT-${c.rut}` ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                    RUT
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!c.email}
                    onClick={() => copyToClipboard(c.email!, 'Email')}
                    className="justify-start gap-2 h-10 border-none bg-white/5 hover:bg-white/10 font-bold"
                  >
                    {copiedField === `Email-${c.email}` ? <Check className="h-3 w-3 text-green-400" /> : <Mail className="h-3 w-3" />}
                    Email
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!c.telefono}
                    onClick={() => copyToClipboard(c.telefono!, 'Teléfono')}
                    className="justify-start gap-2 h-10 border-none bg-white/5 hover:bg-white/10 font-bold"
                  >
                    {copiedField === `Teléfono-${c.telefono}` ? <Check className="h-3 w-3 text-green-400" /> : <Phone className="h-3 w-3" />}
                    Fono
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!c.social_web}
                    onClick={() => copyToClipboard(c.social_web!, 'Web')}
                    className="justify-start gap-2 h-10 border-none bg-white/5 hover:bg-white/10 font-bold"
                  >
                    {copiedField === `Web-${c.social_web}` ? <Check className="h-3 w-3 text-green-400" /> : <Globe className="h-3 w-3" />}
                    Web
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="py-20 text-center text-muted-foreground italic font-medium">No se encontraron clientes en la base de datos.</div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && !isDeleting && setDeleteId(null)}>
        <AlertDialogContent className="border-none shadow-2xl rounded-3xl bg-slate-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-base">
              Esta acción eliminará permanentemente al cliente de Hoja SpA Cloud.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel disabled={isDeleting} className="rounded-full border-none bg-slate-800 hover:bg-slate-700 text-white">Cancelar</AlertDialogCancel>
            <Button 
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="rounded-full bg-destructive text-white hover:bg-destructive/90 px-8 gap-2"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar Definitivamente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
