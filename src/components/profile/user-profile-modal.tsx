"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User as UserIcon, 
  Camera, 
  Loader2, 
  Check, 
  ShieldCheck, 
  Mail, 
  UploadCloud 
} from "lucide-react";
import { toast } from "sonner";
import { sanitizeString } from "@/lib/sanitize";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user, updateUserProfile, uploadAvatar } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && open) {
      queueMicrotask(() => {
        setDisplayName(user.displayName || user.email?.split("@")[0] || "");
        setPreviewUrl(user.photoURL || null);
        setSelectedFile(null);
      });
    }
  }, [user, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen válido");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 5MB");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.warning("El nombre a mostrar no puede estar vacío");
      return;
    }

    setSaving(true);
    try {
      let finalPhotoUrl = user?.photoURL || undefined;

      if (selectedFile) {
        toast.info("Subiendo foto a Firebase Storage...");
        finalPhotoUrl = await uploadAvatar(selectedFile);
      }

      await updateUserProfile(sanitizeString(displayName.trim()), finalPhotoUrl);
      toast.success("Perfil de usuario actualizado con éxito");
      onOpenChange(false);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error al actualizar perfil";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const userInitials = (displayName || user?.email || "U")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-card border border-white/10 shadow-2xl rounded-3xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/40">
          <DialogTitle className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" /> Mi Perfil de Usuario
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configura tu nombre de operador y fotografía de perfil en Hoja SpA.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 pt-2">
          {/* Avatar Upload Preview */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary/50 shadow-xl bg-gradient-to-tr from-[#2e3c7e] to-[#abaafd] flex items-center justify-center text-white text-2xl font-black transition-transform group-hover:scale-105">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Foto de perfil" 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>

              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-xs">
                <Camera className="h-5 w-5" />
                <span className="text-[10px] font-bold">Cambiar</span>
              </div>

              <button
                type="button"
                aria-label="Subir foto de perfil"
                className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg border border-background hover:scale-110 transition-all"
              >
                <UploadCloud className="h-3.5 w-3.5" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <p className="text-[11px] text-muted-foreground text-center">
              Haz clic sobre la imagen para seleccionar una foto (JPG, PNG, WebP máx. 5MB)
            </p>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-xs font-bold text-foreground">
                Nombre a mostrar (Display Name)
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej. Sarah Chen / Rodrigo Hoja"
                className="rounded-xl bg-background border-border"
                maxLength={60}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">
                Correo Electrónico (Firebase Auth)
              </Label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground font-mono">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{user?.email || "Sin correo"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Rol en la plataforma</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold text-[10px]">
                Administrador
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-border"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary text-primary-foreground font-bold gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
