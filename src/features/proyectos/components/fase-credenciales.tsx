"use client";

import React, { useState, useRef } from "react";
import { 
  Proyecto, 
  CredencialTraspaso, 
  CartaGarantia,
  DocumentoAdjuntoProyecto
} from "@/lib/types";
import { 
  Key, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  Lock, 
  Clock, 
  PhoneCall, 
  FileText,
  Upload,
  FileCheck,
  RotateCw,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { descargarPlantillaActaCierreYGarantia } from "../utils/documento-word";
import { subirArchivoProyectoStorage } from "../utils/storage-upload";
import { toast } from "sonner";

interface FaseCredencialesProps {
  proyecto: Proyecto;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export const FaseCredenciales: React.FC<FaseCredencialesProps> = ({
  proyecto,
  setProyecto,
  onSave,
  isSaving,
}) => {
  const [nuevoServicio, setNuevoServicio] = useState("");
  const [nuevaUrl, setNuevaUrl] = useState("");
  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [nuevoRol, setNuevoRol] = useState("Administrador");
  const [nuevasNotas, setNuevasNotas] = useState("");

  const [isUploadingTraspaso, setIsUploadingTraspaso] = useState(false);
  const [isUploadingGarantia, setIsUploadingGarantia] = useState(false);

  const fileInputTraspasoRef = useRef<HTMLInputElement>(null);
  const fileInputGarantiaRef = useRef<HTMLInputElement>(null);

  // Validación de archivos: estrictamente PDF o Word
  const validarArchivo = (file: File): boolean => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext || "")) {
      toast.error("Formato no permitido. Solo se aceptan archivos PDF o Word (.pdf, .doc, .docx)");
      return false;
    }
    return true;
  };

  // Subir Acta de Traspaso / Credenciales Firmada
  const handleUploadTraspaso = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !proyecto.id) return;
    if (!validarArchivo(file)) return;

    try {
      setIsUploadingTraspaso(true);
      const res = await subirArchivoProyectoStorage(proyecto.id, file);

      // Registrar en garantia y en archivosAdjuntos bajo ISO 9001
      const garantiaActual = proyecto.garantia || {
        diasGarantia: 60,
        fechaInicio: proyecto.fechaEntregaReal || new Date().toISOString().split("T")[0],
        fechaFin: "",
        alcance: "Corrección prioritaria de bugs de código, errores de servidor o fallas inherentes a los entregables del proyecto.",
        exclusiones: "No cubre adulteración de código por terceros, fallos de proveedores externos o requerimientos nuevos no contemplados.",
        contactoEmergencias: "Mesa de Soporte Hoja SpA • contacto@hojaspa.cl • WhatsApp Corporativo",
      };

      const nuevoDoc: DocumentoAdjuntoProyecto = {
        id: `doc-traspaso-${Date.now()}`,
        nombre: `Acta de Traspaso Firmada - ${file.name}`,
        tipoDoc: "acta_cierre",
        codigoIso: `SGC-PRY-ACT-${proyecto.presupuestoNumero || "PRY"}`,
        fileUrl: res.fileUrl,
        storagePath: res.storagePath,
        fileType: res.fileType,
        tamanoBytes: res.tamanoBytes,
        fechaSubida: new Date().toISOString(),
        estado: "firmado",
        notas: "Acta de traspaso y credenciales firmada conforme por el cliente",
      };

      const adjuntosPrevios = Array.isArray(proyecto.archivosAdjuntos) ? proyecto.archivosAdjuntos : [];

      setProyecto((prev) => prev ? {
        ...prev,
        garantia: {
          ...garantiaActual,
          archivoTraspasoUrl: res.fileUrl,
          archivoTraspasoNombre: file.name,
        },
        archivosAdjuntos: [nuevoDoc, ...adjuntosPrevios],
      } : null);

      toast.success("Acta de traspaso firmada subida correctamente a Firebase Storage");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir el archivo de traspaso");
    } finally {
      setIsUploadingTraspaso(false);
      if (fileInputTraspasoRef.current) fileInputTraspasoRef.current.value = "";
    }
  };

  // Subir Carta de Garantía Firmada
  const handleUploadGarantia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !proyecto.id) return;
    if (!validarArchivo(file)) return;

    try {
      setIsUploadingGarantia(true);
      const res = await subirArchivoProyectoStorage(proyecto.id, file);

      const garantiaActual = proyecto.garantia || {
        diasGarantia: 60,
        fechaInicio: proyecto.fechaEntregaReal || new Date().toISOString().split("T")[0],
        fechaFin: "",
        alcance: "Corrección prioritaria de bugs de código, errores de servidor o fallas inherentes a los entregables del proyecto.",
        exclusiones: "No cubre adulteración de código por terceros, fallos de proveedores externos o requerimientos nuevos no contemplados.",
        contactoEmergencias: "Mesa de Soporte Hoja SpA • contacto@hojaspa.cl • WhatsApp Corporativo",
      };

      const nuevoDoc: DocumentoAdjuntoProyecto = {
        id: `doc-garantia-${Date.now()}`,
        nombre: `Carta de Garantía Firmada - ${file.name}`,
        tipoDoc: "garantia",
        codigoIso: `SGC-PRY-GAR-${proyecto.presupuestoNumero || "PRY"}`,
        fileUrl: res.fileUrl,
        storagePath: res.storagePath,
        fileType: res.fileType,
        tamanoBytes: res.tamanoBytes,
        fechaSubida: new Date().toISOString(),
        estado: "firmado",
        notas: "Carta de garantía técnica firmada y protocolizada",
      };

      const adjuntosPrevios = Array.isArray(proyecto.archivosAdjuntos) ? proyecto.archivosAdjuntos : [];

      setProyecto((prev) => prev ? {
        ...prev,
        garantia: {
          ...garantiaActual,
          archivoFirmadoUrl: res.fileUrl,
          archivoFirmadoNombre: file.name,
        },
        archivosAdjuntos: [nuevoDoc, ...adjuntosPrevios],
      } : null);

      toast.success("Carta de garantía firmada subida correctamente a Firebase Storage");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir el archivo de garantía");
    } finally {
      setIsUploadingGarantia(false);
      if (fileInputGarantiaRef.current) fileInputGarantiaRef.current.value = "";
    }
  };

  // Agregar credencial a la lista
  const handleAddCredencial = () => {
    if (!nuevoServicio.trim() || !nuevoUsuario.trim()) {
      toast.error("Ingresa al menos el servicio y el usuario o correo de acceso");
      return;
    }

    const credenciales = Array.isArray(proyecto.credenciales) ? [...proyecto.credenciales] : [];
    const nuevaCred: CredencialTraspaso = {
      id: `cred-${Date.now()}`,
      servicio: nuevoServicio.trim(),
      urlAcceso: nuevaUrl.trim() || undefined,
      usuarioOEmail: nuevoUsuario.trim(),
      rolOPermisos: nuevoRol.trim(),
      notas: nuevasNotas.trim() || undefined,
    };

    setProyecto((prev) => prev ? {
      ...prev,
      credenciales: [...credenciales, nuevaCred]
    } : null);

    setNuevoServicio("");
    setNuevaUrl("");
    setNuevoUsuario("");
    setNuevasNotas("");
    toast.success("Credencial agregada a la lista de entrega");
  };

  const handleRemoveCredencial = (id: string) => {
    const credenciales = (proyecto.credenciales || []).filter((c) => c.id !== id);
    setProyecto((prev) => prev ? { ...prev, credenciales } : null);
  };

  // Actualizar Carta de Garantía
  const handleUpdateGarantia = (field: keyof CartaGarantia, value: any) => {
    const garantiaActual = proyecto.garantia || {
      diasGarantia: 60,
      fechaInicio: proyecto.fechaEntregaReal || new Date().toISOString().split("T")[0],
      fechaFin: "",
      alcance: "Corrección prioritaria de bugs de código, errores de servidor o fallas inherentes a los entregables del proyecto.",
      exclusiones: "No cubre adulteración de código por terceros, fallos de proveedores externos o requerimientos nuevos no contemplados.",
      contactoEmergencias: "Mesa de Soporte Hoja SpA • contacto@hojaspa.cl • WhatsApp Corporativo",
    };

    let fechaFin = garantiaActual.fechaFin;
    if (field === "diasGarantia" || field === "fechaInicio") {
      const dias = field === "diasGarantia" ? Number(value) : garantiaActual.diasGarantia;
      const fInicio = field === "fechaInicio" ? String(value) : garantiaActual.fechaInicio;
      if (fInicio) {
        const d = new Date(fInicio);
        d.setDate(d.getDate() + dias);
        fechaFin = d.toISOString().split("T")[0];
      }
    }

    setProyecto((prev) => prev ? {
      ...prev,
      garantia: {
        ...garantiaActual,
        [field]: value,
        fechaFin,
      }
    } : null);
  };

  return (
    <div className="space-y-6">
      {/* CUENTAS Y ACCESOS ENTREGADOS */}
      <Card className="bg-card border-white/10 rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Entrega de Cuentas, Credenciales & Accesos</h3>
              <p className="text-xs text-slate-400">
                Registro formal de plataformas transferidas al mandante para operación autónoma
              </p>
            </div>
          </div>

          {/* Subir Acta de Traspaso Firmada */}
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputTraspasoRef}
              accept=".pdf,.doc,.docx" 
              onChange={handleUploadTraspaso}
              className="hidden" 
            />
            {proyecto.garantia?.archivoTraspasoUrl ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold truncate max-w-[150px]" title={proyecto.garantia.archivoTraspasoNombre || "Acta Traspaso"}>
                  {proyecto.garantia.archivoTraspasoNombre || "Acta Firmada"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(proyecto.garantia?.archivoTraspasoUrl, "_blank")}
                  className="h-6 w-6 p-0 hover:bg-emerald-500/20 text-emerald-300 rounded"
                  title="Ver documento"
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputTraspasoRef.current?.click()}
                  className="h-6 px-1.5 text-[10px] hover:bg-white/10 text-slate-300 rounded"
                  title="Reemplazar archivo"
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={isUploadingTraspaso}
                onClick={() => fileInputTraspasoRef.current?.click()}
                className="h-8 px-3 rounded-md bg-white/5 border-white/15 hover:bg-white/10 text-white text-xs font-bold gap-1.5"
              >
                {isUploadingTraspaso ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    Subir Acta Traspaso Firmada (.pdf/.doc)
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Alerta de Ciberseguridad Destacada */}
          <div className="p-3.5 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
            <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-white">🔒 Protocolo de Seguridad de la Información (ISO 27001 / 9001):</p>
              <p className="leading-relaxed text-slate-300 text-[11px]">
                Por estrictas políticas de protección de datos, <strong>las contraseñas no se plasman en este documento escrito</strong>. La transferencia de claves maestras y temporales se realiza exclusivamente por canal cifrado seguro.
              </p>
            </div>
          </div>

          {/* Tabla de Cuentas Entregadas */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-300">Cuentas Registradas para Entrega</Label>
            <div className="overflow-x-auto rounded-md border border-white/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                    <th className="py-2.5 px-3 font-bold">Servicio / Entorno</th>
                    <th className="py-2.5 px-3 font-bold">URL de Acceso</th>
                    <th className="py-2.5 px-3 font-bold">Usuario / Email</th>
                    <th className="py-2.5 px-3 font-bold">Rol / Permisos</th>
                    <th className="py-2.5 px-3 font-bold">Notas</th>
                    <th className="py-2.5 px-3 font-bold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(proyecto.credenciales || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No hay credenciales registradas aún. Agrega las cuentas a continuación.
                      </td>
                    </tr>
                  ) : (
                    (proyecto.credenciales || []).map((cred) => (
                      <tr key={cred.id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-bold text-white">{cred.servicio}</td>
                        <td className="py-2.5 px-3 text-indigo-300">
                          {cred.urlAcceso ? (
                            <a 
                              href={cred.urlAcceso} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:underline truncate max-w-[180px]"
                            >
                              {cred.urlAcceso}
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-200">{cred.usuarioOEmail}</td>
                        <td className="py-2.5 px-3 text-slate-300">{cred.rolOPermisos}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-[150px]">{cred.notas || "—"}</td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCredencial(cred.id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Formulario rápido para agregar cuenta */}
            <div className="p-3.5 rounded-md bg-white/5 border border-white/10 space-y-3">
              <span className="text-xs font-bold text-white block">Agregar Nueva Cuenta al Traspaso:</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <Input
                  value={nuevoServicio}
                  onChange={(e) => setNuevoServicio(e.target.value)}
                  placeholder="Servicio (ej: cPanel / WordPress)"
                  className="bg-slate-900 border-white/15 text-white text-xs h-8.5 rounded-md"
                />
                <Input
                  value={nuevaUrl}
                  onChange={(e) => setNuevaUrl(e.target.value)}
                  placeholder="URL (ej: https://panel.cliente.cl)"
                  className="bg-slate-900 border-white/15 text-white text-xs h-8.5 rounded-md"
                />
                <Input
                  value={nuevoUsuario}
                  onChange={(e) => setNuevoUsuario(e.target.value)}
                  placeholder="Usuario / Email"
                  className="bg-slate-900 border-white/15 text-white text-xs h-8.5 rounded-md font-mono"
                />
                <Input
                  value={nuevoRol}
                  onChange={(e) => setNuevoRol(e.target.value)}
                  placeholder="Rol (ej: Administrador)"
                  className="bg-slate-900 border-white/15 text-white text-xs h-8.5 rounded-md"
                />
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={nuevasNotas}
                  onChange={(e) => setNuevasNotas(e.target.value)}
                  placeholder="Notas adicionales (ej: Cuenta configurada con autenticación 2FA)..."
                  className="bg-slate-900 border-white/15 text-white text-xs h-8.5 rounded-md flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddCredencial}
                  className="h-8.5 px-3.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Cuenta
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARTA DE GARANTÍA TÉCNICA */}
      <Card className="bg-card border-white/10 rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Carta de Garantía & Alcance de Soporte</h3>
              <p className="text-xs text-slate-400">
                Condiciones de cobertura técnica y formalización de garantía tras la entrega
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Input oculto para subir archivo firmado */}
            <input 
              type="file" 
              ref={fileInputGarantiaRef}
              accept=".pdf,.doc,.docx" 
              onChange={handleUploadGarantia}
              className="hidden" 
            />

            {proyecto.garantia?.archivoFirmadoUrl ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold truncate max-w-[150px]" title={proyecto.garantia.archivoFirmadoNombre || "Garantía Firmada"}>
                  {proyecto.garantia.archivoFirmadoNombre || "Garantía Firmada"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(proyecto.garantia?.archivoFirmadoUrl, "_blank")}
                  className="h-6 w-6 p-0 hover:bg-emerald-500/20 text-emerald-300 rounded"
                  title="Ver documento"
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputGarantiaRef.current?.click()}
                  className="h-6 px-1.5 text-[10px] hover:bg-white/10 text-slate-300 rounded"
                  title="Reemplazar archivo"
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={isUploadingGarantia}
                onClick={() => fileInputGarantiaRef.current?.click()}
                className="h-8.5 px-3 rounded-md bg-white/5 border-white/15 hover:bg-white/10 text-white text-xs font-bold gap-1.5"
              >
                {isUploadingGarantia ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    Subir Garantía Firmada (.pdf/.doc)
                  </>
                )}
              </Button>
            )}

            <Button
              type="button"
              onClick={() => descargarPlantillaActaCierreYGarantia(proyecto)}
              className="h-8.5 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar Plantilla (.doc)
            </Button>
          </div>
        </div>

        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Días de Garantía</Label>
              <Input
                type="number"
                min={0}
                value={proyecto.garantia?.diasGarantia || 60}
                onChange={(e) => handleUpdateGarantia("diasGarantia", parseInt(e.target.value) || 0)}
                className="bg-slate-900 border-white/15 text-white font-mono text-xs h-9 rounded-md font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Fecha Inicio Garantía</Label>
              <Input
                type="date"
                value={proyecto.garantia?.fechaInicio ? proyecto.garantia.fechaInicio.split("T")[0] : ""}
                onChange={(e) => handleUpdateGarantia("fechaInicio", e.target.value)}
                className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Fecha Fin Garantía</Label>
              <Input
                type="date"
                value={proyecto.garantia?.fechaFin ? proyecto.garantia.fechaFin.split("T")[0] : ""}
                readOnly
                className="bg-slate-900 border-white/15 text-emerald-400 font-mono text-xs h-9 rounded-md font-bold opacity-80 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">Alcance de la Cobertura Técnica</Label>
            <Textarea
              value={proyecto.garantia?.alcance || "Corrección prioritaria sin costo adicional de cualquier bug de código, fallo de base de datos o error de servidor inherente a los entregables acordados."}
              onChange={(e) => handleUpdateGarantia("alcance", e.target.value)}
              rows={2}
              className="bg-slate-900 border-white/15 text-white text-xs rounded-md resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">Exclusiones Explícitas</Label>
            <Textarea
              value={proyecto.garantia?.exclusiones || "No cubre adulteración o cambios en el código por terceros sin autorización, fallas ajenas a la infraestructura provista, o requerimientos nuevos fuera del alcance pactado."}
              onChange={(e) => handleUpdateGarantia("exclusiones", e.target.value)}
              rows={2}
              className="bg-slate-900 border-white/15 text-white text-xs rounded-md resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">Canal de Asistencia en Garantía</Label>
            <Input
              value={proyecto.garantia?.contactoEmergencias || "Mesa de Soporte Hoja SpA • contacto@hojaspa.cl • WhatsApp Corporativo"}
              onChange={(e) => handleUpdateGarantia("contactoEmergencias", e.target.value)}
              className="bg-slate-900 border-white/15 text-white text-xs h-9 rounded-md"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
