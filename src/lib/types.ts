// --- TIPOS DE FECHA Y TIMESTAMP ---
export type FechaRegistro = string | { seconds: number; nanoseconds: number };

// --- CLIENTES & CRM OPERATIVO ---
export type ClienteEstado = 
  | "prospecto" 
  | "activo" 
  | "recurrente" 
  | "inactivo";

export type ClienteSintomaPrincipal = 
  | "Google Maps desactualizado / sin botón WhatsApp"
  | "Web lenta / sin certificado SSL"
  | "Usa correos gratuitos (@gmail / @hotmail)"
  | "Gestión manual de pedidos por redes"
  | "Sin pasarela de pagos automatizada";

export type ClienteEtapaPipeline = 
  | "Detectado" 
  | "Contactado" 
  | "En Diagnóstico" 
  | "Cotización Presentada" 
  | "Cerrado Ganado" 
  | "Perdido";

export interface ClienteProximoContacto {
  fecha: string; // ISO string YYYY-MM-DD o timestamp string
  motivo: string;
  estado?: "pendiente" | "realizado" | "cancelado";
}

export interface DominioInfo {
  nombre?: string;
  proveedor?: string; // NIC Chile, GoDaddy, Namecheap, etc.
  fechaRenovacion?: string;
  costoAnual?: number;
}

export interface DnsInfo {
  proveedor?: string; // Cloudflare, Route53, cPanel
  registrosClave?: string;
}

export interface HostingInfo {
  proveedor?: string; // Vercel, VPS Hetzner, AWS, cPanel
  plan?: string;
  fechaRenovacion?: string;
  costoMensualOAnual?: number;
}

export interface AccesoOperativo {
  id?: string;
  tipo: string; // SSH, cPanel, WordPress, Panel Admin, DB, etc.
  identificador: string; // URL o Host / IP
  usuario: string;
  claveONotas?: string;
}

export interface ClienteInfraestructura {
  dominio?: DominioInfo;
  dns?: DnsInfo;
  hosting?: HostingInfo;
  accesos?: AccesoOperativo[];
}

export interface ClienteNota {
  id?: string;
  autorNombre: string;
  autorEmail?: string;
  fecha: string; // ISO string
  texto: string;
  tipo?: "reunion" | "llamada" | "whatsapp" | "acuerdo";
}

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
  estado?: ClienteEstado;
  sintomaPrincipal?: ClienteSintomaPrincipal;
  etapaPipeline?: ClienteEtapaPipeline;
  fechaProximoSeguimiento?: string;
  proximoContacto?: ClienteProximoContacto;
  infraestructura?: ClienteInfraestructura;
  historialNotas?: ClienteNota[];
  createdAt?: FechaRegistro;
  updatedAt?: FechaRegistro;
}

// --- CATALOGO Y CONFIG ---
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

// --- PRESUPUESTOS ---
export interface PresupuestoItem {
  descripcion: string;
  precio: number;
  cantidad: number;
  total: number;
  frecuencia?: string; // Para servicios opcionales (Mensual, Anual, etc)
}

export type PresupuestoEstado = 
  | "borrador" 
  | "enviado" 
  | "emitido" 
  | "en_negociacion" 
  | "aprobado" 
  | "rechazado" 
  | "vencido";

export interface PresupuestoSeguimiento {
  fecha: string;
  tipo?: "llamada" | "reunion" | "correo" | "whatsapp" | "otro";
  nota?: string;
  autor?: string;
}

export type MonedaPresupuesto = "CLP" | "UF";

export interface BloqueDesarrollo {
  titulo?: string;
  monto?: number;
  anticipoPorcentaje?: number; // default 50%
  entregaPorcentaje?: number;  // default 50%
  anticipoMonto?: number;
  entregaMonto?: number;
  montoAnticipo?: number;
  montoEntrega?: number;
}

export type ModalidadContinuidad = 
  | "incluido_ano1" 
  | "mensual" 
  | "anual" 
  | "ano_1_incluido" 
  | "recurrente_mensual" 
  | "recurrente_anual";

export interface BloqueContinuidad {
  modalidad: ModalidadContinuidad;
  monto?: number;
  montoRecurrente?: number;
  monedaRecurrente?: MonedaPresupuesto;
  detalle?: string;
}

export interface Presupuesto {
  id?: string;
  numero: string;
  fecha: FechaRegistro;
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
  moneda?: MonedaPresupuesto;
  valorUFReferencial?: number;
  bloqueDesarrollo?: BloqueDesarrollo;
  bloqueContinuidad?: BloqueContinuidad;
  tokenPublico?: string;
  propuestaAceptadaEn?: string;
  propuestaAceptadaPor?: string;
  version?: number;
  estado?: PresupuestoEstado;
  proyecto_id?: string;
  fechaEnvio?: string;
  ultimoSeguimiento?: PresupuestoSeguimiento;
  alertaSilenciada?: boolean;
  motivoRechazo?: string;
  historialSeguimientos?: PresupuestoSeguimiento[];
  createdAt?: FechaRegistro;
  updatedAt?: FechaRegistro;
}

// --- PROYECTOS ---
export type ProyectoFase = 
  | "planificacion" 
  | "desarrollo" 
  | "revision_qa" 
  | "entregado" 
  | "pausado" 
  | "cancelado";

export type ProyectoTipoServicio = 
  | "desarrollo_web" 
  | "soporte_nube" 
  | "ciberseguridad" 
  | "inventario_hardware" 
  | "consultoria" 
  | "otro";

export interface HitoPago {
  id: string;
  titulo: string;
  porcentaje: number;
  monto: number;
  fechaEstimada: string;
  estado: "pendiente" | "cobrado" | "vencido";
  fechaCobroReal?: string;
  comprobanteRef?: string;
}

export interface ChecklistItem {
  id?: string;
  orden: number;
  categoria: string;
  titulo: string;
  descripcion?: string;
  completada: boolean;
  completadaPor?: string;
  completadaEn?: string;
}

export interface Proyecto {
  id?: string;
  presupuestoId?: string;
  presupuestoNumero?: string;
  clienteId: string;
  clienteNombre: string;
  clienteRut?: string;
  clienteTelefono?: string;
  nombre: string;
  descripcion: string;
  tipoServicio: ProyectoTipoServicio;
  fase: ProyectoFase;
  fechaInicio: string;
  fechaEntregaComprometida: string;
  fechaEntregaReal?: string;
  montos: {
    neto: number;
    iva: number;
    total: number;
  };
  hitosPago: HitoPago[];
  progresoPorcentaje?: number;
  checklist?: ChecklistItem[];
  createdAt?: FechaRegistro;
  updatedAt?: FechaRegistro;
}

// --- DOCUMENTOS OPERATIVOS ---
export type TipoDocumentoOperativo = 
  | "acta_inicio" 
  | "acta_entrega_conformidad" 
  | "resumen_tecnico";

export interface DocumentoOperativo {
  id?: string;
  proyectoId: string;
  tipo: TipoDocumentoOperativo;
  version: number;
  titulo: string;
  fechaEmision: string;
  datosGenerados: {
    proyectoNombre: string;
    clienteNombre: string;
    clienteRut?: string;
    alcance: string[];
    acuerdosComerciales?: string;
    fechasClave: { inicio: string; entrega: string };
    entregablesTecnicos?: string[];
    credencialesOAccesos?: string[];
    clausulasGarantia?: string;
    observaciones?: string;
  };
  estado: "borrador" | "emitido" | "firmado";
  firmanteCliente?: {
    nombre: string;
    rut: string;
    fechaFirma?: string;
  };
  createdAt?: FechaRegistro;
  updatedAt?: FechaRegistro;
}

// --- FLUJO DE CAJA & FINANZAS ---
export type EventoFinancieroTipo = "ingreso" | "egreso";
export type EventoFinancieroCategoria = 
  | "cobro_proyecto" 
  | "recurrente_cliente" 
  | "renovacion_infraestructura" 
  | "gasto_operativo";

export interface EventoFinanciero {
  id?: string;
  tipo: EventoFinancieroTipo;
  categoria: EventoFinancieroCategoria;
  referenciaId?: string; // id de proyecto o cliente
  referenciaNombre?: string;
  concepto: string;
  monto: number; // Valor principal / bruto (retrocompatible)
  
  // --- CAMPOS TRIBUTARIOS F29 / SII CHILE ---
  montoNeto?: number;
  ivaMonto?: number;
  montoTotal?: number;
  aplicaFactura?: boolean; // Factura afecta a IVA (19%)
  deducibleIva?: boolean;  // Compra chilena con factura que genera Crédito Fiscal IVA

  fechaVencimiento: string;
  estado: "pendiente" | "cobrado" | "pagado" | "vencido";
  esRecurrente?: boolean;
  frecuencia?: "mensual" | "anual";
  recordatorioDiasAntes?: number;
  createdAt?: FechaRegistro;
  updatedAt?: FechaRegistro;
}

// --- PROYECCIÓN TRIBUTARIA F29 (SII CHILE) ---
export interface ProyeccionTributariaF29 {
  periodo: string; // Formato 'YYYY-MM'
  nombreMes: string; // ej. 'Octubre 2026'
  ventasNetasTotal: number;
  ivaDebitoTotal: number;
  comprasNetasDeducibles: number;
  ivaCreditoTotal: number;
  ivaAPagar: number;
  remanenteAFavor: number;
  ppmTasa: number; // 0.0025 (0.25%)
  ppmTotal: number;
  f29Estimado: number; // ivaAPagar + ppmTotal
  totalFacturadoVentas: number;
  cajaLiquidaRealDisponible: number;
  alertaVencimiento?: {
    activa: boolean;
    esCritica: boolean; // true si faltan <= 3 días para el día 20
    fechaVence: string; // ej. '20 de Octubre'
    diasRestantes: number;
    mensaje: string;
  };
}

// --- SERVICIOS RECURRENTES (HOSTING & SUSCRIPCIONES) ---
export type TipoServicioRecurrente = 
  | "Solo Correos" 
  | "Web Corporativa" 
  | "E-Commerce WooCommerce" 
  | "Web App";

export type ProveedorInfraestructura = 
  | "Bluehosting cPanel" 
  | "Vercel" 
  | "Hetzner";

export type CicloFacturacion = "mensual" | "anual";
export type MonedaRecurrente = "CLP" | "UF";
export type EstadoSuscripcion = "activo" | "por_vencer" | "vencido" | "suspendido";

export interface Subscription {
  id?: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  dominio: string; // ej. 'empresa.cl'
  tipoServicio: TipoServicioRecurrente;
  proveedor: ProveedorInfraestructura;
  cicloFacturacion: CicloFacturacion;
  monto: number;
  moneda: MonedaRecurrente;
  valorUFRef?: number;
  fechaInicio: string; // ISO string
  fechaCorte: string;  // ISO string (próxima fecha de renovación)
  estado: EstadoSuscripcion;
  diasRestantes?: number;
  notas?: string;
  createdAt?: FechaRegistro;
  updatedAt?: FechaRegistro;
}

// --- GASTOS OPERATIVOS Y COSTOS DE INFRAESTRUCTURA ---
export type CategoriaGastoOperativo = 
  | "hosting_servidores" 
  | "hosting_reseller"
  | "dominios" 
  | "dominio_nic"
  | "servidor_cloud"
  | "licencias_software" 
  | "licencia"
  | "conectividad_oficina" 
  | "otro";

export interface GastoOperativo {
  id?: string;
  proveedor: string; // ej. 'Bluehosting', 'NIC Chile', 'Vercel'
  concepto: string;  // ej. 'Plan Reseller Bluehosting cPanel'
  categoria: CategoriaGastoOperativo;
  monto: number;
  moneda: "CLP" | "USD" | "UF";
  fecha?: string;
  fechaRenovacion?: string;
  esFijoRecurrente?: boolean;
  periodicidad?: "mensual" | "anual";
  frecuencia?: "mensual" | "anual";
  estado?: "activo" | "inactivo";
  notas?: string;
  createdAt?: FechaRegistro;
  updatedAt?: FechaRegistro;
}

// --- ALERTAS GLOBALES ---
export type AlertaTipo = "cliente" | "presupuesto" | "proyecto" | "flujo_caja" | "suscripcion";
export type AlertaPrioridad = "alta" | "media" | "info";

export interface AlertaOperativa {
  id: string;
  tipo: AlertaTipo;
  prioridad: AlertaPrioridad;
  titulo: string;
  descripcion: string;
  fechaRef?: string;
  enlaceAccion?: string;
  textoAccion?: string;
  telefonoWhatsApp?: string;
  mensajeWhatsApp?: string;
  monto?: number;
  severidad?: "alta" | "media" | "baja";
  metadata?: Record<string, string | number | undefined>;
}

// --- SESIONES DE PROSPECCIÓN COMERCIAL GUIADA ---
export type ProspectSintoma =
  | "Sin página web"
  | "Web lenta / Sin certificado SSL"
  | "Usa correo gratuito (@gmail / @hotmail)"
  | "Ficha de Google Maps abandonada"
  | "Venta manual por redes / Sin pasarela";

export type ProspectEstado = 
  | "por_contactar"
  | "contactado" 
  | "respondio" 
  | "cotizado" 
  | "cerrado" 
  | "descartado";

export type ProspectCanal = 
  | "whatsapp" 
  | "telefono" 
  | "correo" 
  | "no_contactar";

export interface ProspectingSession {
  id?: string;
  userId: string;
  userEmail?: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // ISO
  horaFin?: string; // ISO
  duracionMinutos: number;
  duracionSegundos: number;
  metaObjetivo: number;
  contactosCompletados: number;
  metaCumplida: boolean;
  estado?: "activa" | "pausada" | "finalizada" | "cancelada";
  createdAt?: FechaRegistro;
  updatedAt?: FechaRegistro;
}

export interface Prospect {
  id?: string;
  sessionId: string;
  userId: string;
  userEmail?: string;
  nombreNegocio: string;
  telefono?: string;
  email?: string;
  canal?: ProspectCanal;
  sintoma: ProspectSintoma;
  mensajeEnviado?: string;
  fechaContacto: string; // ISO
  estado: ProspectEstado;
  notas?: string;
  createdAt?: FechaRegistro;
  updatedAt?: FechaRegistro;
}

export interface UserStreak {
  id?: string; // userId
  userId: string;
  rachaActual: number;
  rachaMaxima: number;
  ultimoDiaActivo: string; // YYYY-MM-DD
  totalSesionesCompletadas: number;
  totalContactosHistoricos: number;
  updatedAt?: FechaRegistro;
}



