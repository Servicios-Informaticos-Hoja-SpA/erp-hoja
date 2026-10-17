// --- TIPOS DE FECHA Y TIMESTAMP ---
export type FechaRegistro = string | { seconds: number; nanoseconds: number };

// --- CLIENTES & CRM OPERATIVO ---
export type TipoRegistro = "prospecto" | "cliente";
export type SubEstadoProspecto = "sin_contacto" | "contactado";

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
  recordatorio?: string; // ISO date-time opcional asociado a la nota
}

// --- MATRIZ OPERATIVA (SERVICIOS Y PRODUCTOS CONTRATADOS) ---
export interface ServicioAsociado {
  id: string;
  proveedor: string; // ej. Cloudflare, AWS, Supabase, Sendgrid
  nombre: string;
  descripcion?: string;
  credencialesOConfig?: string;
}

export interface ItemPaginaWeb {
  id: string;
  proyectoId?: string; // Enlace a proyecto (opcional)
  url: string;
  tipoCMSOTecnologia?: string; // ej. Next.js, WordPress, Shopify, Astro
  hostingProveedor?: string;
  credenciales?: {
    panelUrl?: string;
    usuario?: string;
    password?: string;
    notas?: string;
  };
  serviciosAsociados: ServicioAsociado[];
  createdAt?: string;
}

export interface CuentaCorreo {
  email: string;
  password?: string;
  tipo?: "IMAP/POP" | "Google Workspace" | "Microsoft 365" | "Otro";
  servidorEntrada?: string;
  servidorSalida?: string;
  notas?: string;
}

export interface ItemCorreos {
  id: string;
  proyectoId?: string;
  dominioCorreo: string;
  proveedor: string; // Bluehosting, Google Workspace, Titan, etc.
  cuentas: CuentaCorreo[];
  credencialesAdmin?: {
    panelUrl?: string;
    usuario?: string;
    password?: string;
  };
  createdAt?: string;
}

export interface ItemDominio {
  id: string;
  proyectoId?: string;
  dominio: string;
  administradoPorNosotros: boolean; // ¿compra/administración corre por nuestra cuenta?
  proveedorRegistrador?: string; // NIC Chile, GoDaddy, Namecheap, etc.
  fechaCompra?: string;
  fechaRenovacion?: string;
  costoRenovacion?: number;
  dnsProveedor?: string;
  dnsRegistros?: string;
  createdAt?: string;
}

export interface ItemAppPersonalizada {
  id: string;
  proyectoId?: string;
  nombreApp: string;
  tipoApp: "movil" | "web" | "interna" | "otra";
  stackTecnologico: string; // ej. React Native, Flutter, Next.js, FastAPI
  repositorioUrl?: string;
  serviciosAsociados: ServicioAsociado[];
  credencialesAcceso?: {
    url?: string;
    usuario?: string;
    password?: string;
    notas?: string;
  };
  createdAt?: string;
}

export interface MantenimientoHardware {
  id: string;
  fecha: string;
  descripcion: string;
  tecnico?: string;
  costo?: number;
}

export interface ItemHardware {
  id: string;
  proyectoId?: string;
  equipo: string; // ej. Servidor Dell PowerEdge, Terminal POS, Router Mikrotik
  numeroSerie?: string;
  modelo?: string;
  ubicacion?: string;
  fechaInstalacion?: string;
  historialMantenimientos: MantenimientoHardware[];
  createdAt?: string;
}

export interface MatrizOperativa {
  paginasWeb?: ItemPaginaWeb[];
  correos?: ItemCorreos[];
  dominios?: ItemDominio[];
  appsPersonalizadas?: ItemAppPersonalizada[];
  hardware?: ItemHardware[];
}

// --- TICKETS DE SOPORTE ---
export type TicketSeveridad = "Baja" | "Media" | "Alta" | "Recomendación/Sugerencia";
export type TicketEstado = "abierto" | "en_progreso" | "resuelto" | "cerrado";

export interface TicketSoporte {
  id?: string;
  numero: number; // Identificador numérico secuencial con ámbito por cliente (Ticket #1, #2...)
  clienteId: string;
  productoOItemId?: string; // Enlace opcional a producto/servicio o proyecto
  titulo: string;
  descripcion: string;
  severidad: TicketSeveridad;
  estado: TicketEstado;
  resolucionNotas?: string;
  autor?: string;
  createdAt?: FechaRegistro;
  updatedAt?: FechaRegistro;
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
  direccion?: string;
  comuna?: string;
  ciudad?: string;
  notas?: string;
  
  // Modelo unificado de prospección y clientes
  tipo_registro?: TipoRegistro;
  sub_estado?: SubEstadoProspecto;
  proximoRecordatorio?: string; // ISO date-time string
  recordatorioNota?: string;
  recordatorioCompletado?: boolean;
  
  // Compatibilidad hacia atrás
  estado?: ClienteEstado;
  sintomaPrincipal?: ClienteSintomaPrincipal;
  etapaPipeline?: ClienteEtapaPipeline;
  fechaProximoSeguimiento?: string;
  proximoContacto?: ClienteProximoContacto;
  
  infraestructura?: ClienteInfraestructura;
  historialNotas?: ClienteNota[];
  matrizOperativa?: MatrizOperativa;
  
  // Estado operativo y soft-delete
  activo?: boolean;
  inhabilitadoAt?: string;
  
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
  condiciones_comerciales?: string;
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
  numeroFactura?: string;
  fechaFactura?: string;
  rutFactura?: string;
  tieneFactura?: boolean;
}

export type EstadoKanban = 
  | "por_hacer" 
  | "en_desarrollo" 
  | "bloqueado" 
  | "pruebas_qa" 
  | "completado";

export interface ChecklistItem {
  id?: string;
  orden: number;
  categoria: string;
  titulo: string;
  descripcion?: string;
  completada: boolean;
  completadaPor?: string;
  completadaEn?: string;
  // Sincronización Kanban y Carta Gantt
  estadoKanban?: EstadoKanban;
  fechaInicio?: string;
  fechaFin?: string;
  prioridad?: "baja" | "media" | "alta";
  responsable?: string;
  ticketIdRelacionado?: string;
}

export interface SolicitudCambio {
  id: string;
  numero: number;
  titulo: string;
  descripcion: string;
  impactoHoras: number;
  impactoCostoNeto: number;
  diasExtension?: number;
  terminosEntrega?: string;
  estado: "solicitada" | "aprobada" | "rechazada";
  fecha: string;
  solicitadoPor?: string;
  aprobadoPor?: string;
}

export interface ReunionProyecto {
  id: string;
  fecha: string;
  hora?: string;
  tipo: "planificacion" | "avance" | "qa_entrega" | "cierre";
  titulo: string;
  asistentes?: string[];
  puntosTratados: string;
  acuerdosYCompromisos: string;
  feedbackCliente?: string;
  ticketGeneradoId?: string;
  creadoEn?: string;
}

export interface CredencialTraspaso {
  id: string;
  servicio: string;
  urlAcceso?: string;
  usuarioOEmail: string;
  rolOPermisos: string;
  notas?: string;
}

export interface CartaGarantia {
  diasGarantia: number;
  fechaInicio: string;
  fechaFin: string;
  alcance: string;
  exclusiones: string;
  contactoEmergencias?: string;
  archivoFirmadoUrl?: string;
  archivoFirmadoNombre?: string;
  archivoTraspasoUrl?: string;
  archivoTraspasoNombre?: string;
}

export interface DocumentoAdjuntoProyecto {
  id: string;
  nombre: string;
  tipoDoc: "alcance" | "minuta_reunion" | "acta_cierre" | "garantia" | "contrato" | "otro";
  codigoIso?: string;
  fileUrl: string;
  storagePath?: string;
  fileType: string;
  tamanoBytes?: number;
  fechaSubida: string;
  estado: "borrador" | "emitido" | "firmado";
  notas?: string;
}

export interface PendienteProyecto {
  id: string;
  titulo: string;
  completado: boolean;
  responsable?: string;
  fechaLimite?: string;
}

export interface EspecificacionesCierre {
  urlsDespliegue?: string;
  versionesSoftware?: string;
  serialesHardware?: string;
  accesosTraspasados?: string;
  garantiaDias?: number;
}

export interface Proyecto {
  id?: string;
  presupuestoId?: string;
  presupuestoNumero?: string;
  clienteId: string;
  clienteNombre: string;
  clienteRut?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
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
  
  // Extensiones operativas ISO 9001
  solicitudesCambio?: SolicitudCambio[];
  slaDetalle?: string;
  especificacionesCierre?: EspecificacionesCierre;
  propuestaFormalizada?: boolean;
  actaEntregaFormalizada?: boolean;
  alcanceItems?: string[];

  // Fases ampliadas (Reuniones, Credenciales, Garantía, Archivos y Pendientes)
  reuniones?: ReunionProyecto[];
  credenciales?: CredencialTraspaso[];
  garantia?: CartaGarantia;
  archivosAdjuntos?: DocumentoAdjuntoProyecto[];
  pendientes?: PendienteProyecto[];
  condicionesComerciales?: {
    medioPago?: string;
    cuotas?: number;
    notasPresupuesto?: string;
  };
  
  createdAt?: FechaRegistro;
  updatedAt?: FechaRegistro;
}

// --- DOCUMENTOS OPERATIVOS ---
export type TipoDocumentoOperativo = 
  | "acta_inicio" 
  | "acta_entrega_conformidad" 
  | "resumen_tecnico"
  | "propuesta_sla"
  | "solicitud_cambio"
  | "traspaso_accesos"
  | "informe_mantencion";

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
    slaDetalle?: string;
    crDetalles?: {
      numero: number;
      impactoHoras: number;
      impactoCostoNeto: number;
      estado: string;
    };
    metricasPostventa?: {
      ticketsCerrados: number;
      ticketsAbiertos: number;
      horasConsumidas: number;
      preventivasRealizadas: string[];
    };
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

  // --- DATOS DE FACTURA DTE Y COMPROBANTE ---
  numeroFactura?: string;
  fechaFactura?: string;
  rutContraparte?: string;
  razonSocialContraparte?: string;
  tipoComprobante?: "factura" | "boleta" | "honorarios" | "sin_comprobante";

  // --- VINCULACIÓN A PROYECTO Y CLIENTE ---
  proyectoId?: string;
  proyectoNombre?: string;
  clienteId?: string;
  clienteNombre?: string;
  clienteRut?: string;
  hitoPagoId?: string; // Si viene de un hito de pago de un proyecto
  isProjectHito?: boolean;

  fechaVencimiento: string;
  fechaPago?: string;
  estado: "pendiente" | "cobrado" | "pagado" | "vencido";
  esRecurrente?: boolean;
  frecuencia?: "mensual" | "anual";
  recordatorioDiasAntes?: number;
  notas?: string;
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

export interface DeclaracionF29 {
  id?: string;
  periodo: string; // Formato 'YYYY-MM' (ej. '2026-09')
  periodoNombre?: string; // ej. 'Septiembre 2026'
  mesPago?: string; // ej. '2026-10'
  fechaDeclaracion: string; // ISO string
  montoPagado: number;
  sinMovimiento: boolean;
  folioSII?: string;
  estado: "declarado";
  notas?: string;
  declaradoPor?: string;
  createdAt?: FechaRegistro;
  updatedAt?: FechaRegistro;
}

// --- SERVICIOS RECURRENTES Y GASTOS CONTRATADOS DE LA EMPRESA ---
export type TipoRecurrencia = "cliente_ingreso" | "empresa_egreso";
export type EstadoCobroServicio = "al_dia" | "por_cobrar" | "vencido" | "pausado";

export type CategoriaServicioRecurrente = 
  | "mantencion_web"
  | "mantencion_software"
  | "soporte_mensual"
  | "hosting_cliente"
  | "servidor_dedicado"
  | "bancario_tarjetas" 
  | "hosting_propio" 
  | "software_saas" 
  | "dominios_propios" 
  | "conectividad" 
  | "otro";

export type MetodoPagoRecurrente =
  | "tarjeta_credito"
  | "debito_automatico"
  | "transferencia"
  | "paypal"
  | "otro";

export type TipoServicioRecurrente = 
  | "Solo Correos" 
  | "Web Corporativa" 
  | "E-Commerce WooCommerce" 
  | "Web App"
  | "Infraestructura & Cloud"
  | "SaaS & Licencias"
  | "Servicio Bancario";

export type ProveedorInfraestructura = 
  | "Hoja SpA"
  | "Bluehosting cPanel" 
  | "Vercel" 
  | "Hetzner"
  | "Banco Falabella"
  | "Banco Santander"
  | "Google Workspace"
  | "NIC Chile"
  | "OpenAI"
  | "Otro";

export type CicloFacturacion = "mensual" | "anual" | "semestral" | "trimestral";
export type MonedaRecurrente = "CLP" | "USD" | "UF";
export type EstadoSuscripcion = "activo" | "por_vencer" | "vencido" | "pausado" | "suspendido";

export interface HistorialPagoRecurrente {
  id?: string;
  fechaPago: string; // ISO string
  monto: number;
  moneda: MonedaRecurrente;
  periodoCubierto?: string;
  comprobanteRef?: string;
  numeroFactura?: string;
  notas?: string;
}

export interface Subscription {
  id?: string;
  // Tipo de flujo recurrente
  tipoRecurrencia?: TipoRecurrencia; // "cliente_ingreso" (mantención a cliente) o "empresa_egreso" (gasto propio)
  
  // Identificación del Gasto / Servicio
  nombre: string; // ej. 'Mantención Web & E-Commerce', 'Reseller cPanel Bluehosting', 'Google Workspace'
  proveedor?: string; // ej. 'Hoja SpA' (brindado a cliente) o 'Bluehosting', 'Hetzner', 'Banco Falabella'
  categoria: CategoriaServicioRecurrente;
  
  // Costos y periodicidad
  monto: number;
  moneda: MonedaRecurrente;
  cicloFacturacion: CicloFacturacion;
  diaPago?: number; // Día del mes estimado de corte / cobro (1-31)
  montoEstimadoMensualCLP?: number;

  // Fechas y vigencia
  fechaInicio: string; // ISO string
  fechaCorte: string;  // ISO string (próximo vencimiento o fecha de corte/cobro)
  estado: EstadoSuscripcion;
  estadoCobro?: EstadoCobroServicio; // "al_dia" | "por_cobrar" | "vencido" | "pausado"
  diasRestantes?: number;
  ultimaRenovacion?: string;
  ultimoCobroFecha?: string;

  // Medio de pago y tributación (preparado para Flujo de Caja)
  metodoPago?: MetodoPagoRecurrente;
  tarjetaOCuenta?: string; // ej. 'Mastercard Falabella #1480', 'Transferencia Banco Santander'
  aplicaFactura?: boolean; // ¿Emite factura con IVA o recibo?
  deducibleIva?: boolean;  // ¿El IVA es deducible para la empresa?
  numeroFactura?: string;  // Número de factura de la última emisión
  enlaceGestion?: string;  // URL al panel del proveedor o panel de control
  
  // Vinculación con Cliente (Servicios y Mantenciones)
  clienteId?: string;
  clienteNombre?: string;
  clienteRut?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  
  // SLA Operativo y Alcance
  slaHorasMensuales?: number; // Horas de soporte/mantención mensuales incluidas
  horasConsumidasMes?: number; // Horas consumidas en el período
  dominio?: string; // Dominio web asociado
  tipoServicio?: string;
  valorUFRef?: number;

  notas?: string;
  historialPagos?: HistorialPagoRecurrente[];
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



