import { Timestamp } from "firebase/firestore";

export interface Cliente {
  id?: string;
  nombre: string;
  email: string;
  contacto: string;
  rut?: string;
  telefono?: string;
  social_instagram?: string;
  social_linkedin?: string;
  social_web?: string;
  social_otro?: string;
  createdAt?: Timestamp;
}

export interface Servicio {
  id?: string;
  descripcion: string;
  precio_base: number;
  unidad: string; // "Mensual", "Anual", "Unico"
}

export interface ConfiguracionGlobal {
  banco: string;
  tipo_cuenta: string;
  numero_cuenta: string;
  email_pago: string;
  email_contacto: string;
  web: string;
  telefono: string;
  rut?: string;
  nombre_titular?: string;
}

export interface PresupuestoItem {
  descripcion: string;
  precio: number;
  cantidad: number;
  total: number;
  frecuencia?: string; // Para servicios opcionales (Mensual, Anual, etc)
}

export interface Presupuesto {
  id?: string;
  numero: string;
  fecha: Timestamp;
  cliente_id: string;
  cliente_nombre: string;
  nombre_proyecto?: string;
  descripcion_proyecto: string;
  items: PresupuestoItem[];
  servicios_opcionales: PresupuestoItem[];
  parametros_personalizados: Record<string, string>;
  forma_pago: string;
  plazo_entrega: string;
  totales: {
    neto: number;
    iva: number;
    total: number;
  };
  version?: number;
  createdAt?: any;
  updatedAt?: any;
}
