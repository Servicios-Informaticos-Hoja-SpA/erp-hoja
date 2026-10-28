import { 
  Cliente, 
  Servicio, 
  ConfiguracionGlobal, 
  Presupuesto,
  Proyecto,
  DocumentoOperativo,
  EventoFinanciero,
  AlertaOperativa,
  Subscription,
  GastoOperativo,
  UserStreak,
  ProspectingSession,
  Prospect,
  ProspectEstado,
  TicketSoporte,
  DeclaracionF29
} from "./types";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Caché en memoria del cliente para evitar peticiones de red innecesarias y hacer la navegación instantánea
const clientMemoryCache = new Map<string, CacheEntry<any>>();

// Deduplicación de peticiones idénticas en vuelo (evita thundering herd)
const inFlightRequests = new Map<string, Promise<any>>();

// TTL por defecto: 45 segundos (ideal para ERP con navegación rápida entre módulos)
const DEFAULT_TTL_MS = 45 * 1000;

export const clearCache = (pattern?: string) => {
  if (!pattern) {
    clientMemoryCache.clear();
    return;
  }
  for (const key of Array.from(clientMemoryCache.keys())) {
    if (key.includes(pattern)) {
      clientMemoryCache.delete(key);
    }
  }
};

const invalidateRelatedCaches = (url: string) => {
  if (url.includes("/api/clientes")) {
    clearCache("/api/clientes");
    clearCache("/api/dashboard");
  } else if (url.includes("/api/proyectos")) {
    clearCache("/api/proyectos");
    clearCache("/api/dashboard");
    clearCache("/api/flujo-caja");
  } else if (url.includes("/api/presupuestos")) {
    clearCache("/api/presupuestos");
    clearCache("/api/dashboard");
    clearCache("/api/proyectos");
  } else if (url.includes("/api/subscriptions")) {
    clearCache("/api/subscriptions");
    clearCache("/api/dashboard");
    clearCache("/api/flujo-caja");
    clearCache("/api/alertas");
  } else if (url.includes("/api/flujo-caja")) {
    clearCache("/api/flujo-caja");
    clearCache("/api/dashboard");
  } else if (url.includes("/api/expenses")) {
    clearCache("/api/expenses");
    clearCache("/api/dashboard");
    clearCache("/api/flujo-caja");
  } else if (url.includes("/api/config")) {
    clearCache("/api/config");
  } else if (url.includes("/api/prospeccion")) {
    clearCache("/api/prospeccion");
    clearCache("/api/dashboard");
  }
};

export interface FetcherOptions extends RequestInit {
  ttl?: number;
  forceRefresh?: boolean;
}

const fetcher = async (url: string, options?: FetcherOptions) => {
  const method = (options?.method || "GET").toUpperCase();
  const isGet = method === "GET";
  const forceRefresh = options?.forceRefresh === true;
  const ttl = options?.ttl ?? DEFAULT_TTL_MS;

  // Si es consulta GET y no estamos forzando recarga, usar caché
  if (isGet && !forceRefresh) {
    const cached = clientMemoryCache.get(url);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // Si ya existe una petición idéntica en vuelo, reutilizar la misma promesa
    const existingPromise = inFlightRequests.get(url);
    if (existingPromise) {
      return existingPromise;
    }
  }

  const executeFetch = async () => {
    try {
      const res = await fetch(url, options);
      
      const contentType = res.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      if (!res.ok) {
        if (isJson) {
          const errorData = await res.json();
          let msg = errorData.error || `Error ${res.status}: ${res.statusText}`;
          if (errorData.details && typeof errorData.details === "object") {
            const fieldIssues = Object.entries(errorData.details)
              .filter(([k]) => k !== "_errors")
              .map(([k, v]: [string, any]) => {
                const issues = Array.isArray(v?._errors) ? v._errors.join(", ") : "";
                return issues ? `${k}: ${issues}` : `${k} inválido`;
              })
              .join("; ");
            if (fieldIssues) {
              msg += ` (${fieldIssues})`;
            }
          }
          throw new Error(msg);
        }
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      if (!isJson) {
        return null;
      }

      const data = await res.json();

      if (isGet) {
        clientMemoryCache.set(url, {
          data,
          timestamp: Date.now(),
        });
      } else {
        // En mutaciones (POST, PUT, DELETE, PATCH), limpiar cachés relacionados
        invalidateRelatedCaches(url);
      }

      return data;
    } finally {
      if (isGet) {
        inFlightRequests.delete(url);
      }
    }
  };

  if (isGet && !forceRefresh) {
    const promise = executeFetch();
    inFlightRequests.set(url, promise);
    return promise;
  }

  return executeFetch();
};

// --- CLIENTES ---
export const getClientes = async (forceRefresh: boolean = false): Promise<Cliente[]> => {
  return fetcher("/api/clientes", { forceRefresh });
};

export const getClienteById = async (id: string, forceRefresh: boolean = false): Promise<Cliente> => {
  return fetcher(`/api/clientes/${id}`, { forceRefresh });
};

export const saveCliente = async (cliente: Partial<Cliente>) => {
  return fetcher("/api/clientes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cliente),
  });
};

export const updateCliente = async (id: string, cliente: Partial<Cliente>) => {
  return fetcher(`/api/clientes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cliente),
  });
};

export const inhabilitarCliente = async (id: string) => {
  return updateCliente(id, { 
    activo: false, 
    estado: "inactivo", 
    inhabilitadoAt: new Date().toISOString() 
  });
};

export const reactivarCliente = async (id: string, tipo: "prospecto" | "cliente" = "cliente") => {
  return updateCliente(id, { 
    activo: true, 
    estado: tipo === "prospecto" ? "prospecto" : "activo" 
  });
};

export const deleteCliente = async (id: string) => {
  return fetcher(`/api/clientes/${id}`, {
    method: "DELETE",
  });
};

export const getPresupuestosByCliente = async (clienteId: string, clienteNombre?: string): Promise<Presupuesto[]> => {
  const all = await getPresupuestos();
  const cNameLower = (clienteNombre || "").trim().toLowerCase();
  return all.filter((p) => {
    if (p.cliente_id && p.cliente_id === clienteId) return true;
    if (cNameLower && p.cliente_nombre && p.cliente_nombre.trim().toLowerCase() === cNameLower) return true;
    return false;
  });
};

// --- TICKETS DE SOPORTE (SCOPED POR CLIENTE) ---
export const getTicketsByCliente = async (clienteId: string): Promise<TicketSoporte[]> => {
  return fetcher(`/api/clientes/${clienteId}/tickets`);
};

export const saveTicket = async (clienteId: string, ticket: Partial<TicketSoporte>): Promise<TicketSoporte> => {
  return fetcher(`/api/clientes/${clienteId}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ticket),
  });
};

export const updateTicket = async (clienteId: string, ticketId: string, ticket: Partial<TicketSoporte>) => {
  return fetcher(`/api/clientes/${clienteId}/tickets/${ticketId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ticket),
  });
};

export const deleteTicket = async (clienteId: string, ticketId: string) => {
  return fetcher(`/api/clientes/${clienteId}/tickets/${ticketId}`, {
    method: "DELETE",
  });
};

// --- CATALOGO ---
export const getCatalogo = async (forceRefresh: boolean = false): Promise<Servicio[]> => {
  return fetcher("/api/catalogo", { forceRefresh, ttl: 120000 });
};

// --- CONFIGURACION GLOBAL ---
export const getConfig = async (forceRefresh: boolean = false): Promise<ConfiguracionGlobal | null> => {
  try {
    return await fetcher("/api/config", { forceRefresh, ttl: 300000 });
  } catch {
    return null;
  }
};

export const updateConfig = async (config: ConfiguracionGlobal) => {
  return fetcher("/api/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
};

// --- PRESUPUESTOS ---
export const getPresupuestos = async (forceRefresh: boolean = false): Promise<Presupuesto[]> => {
  return fetcher("/api/presupuestos", { forceRefresh });
};

export const getPresupuestoById = async (id: string, forceRefresh: boolean = false): Promise<Presupuesto> => {
  return fetcher(`/api/presupuestos?id=${id}`, { forceRefresh });
};

export const savePresupuesto = async (presupuesto: Partial<Presupuesto>) => {
  return fetcher("/api/presupuestos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(presupuesto),
  });
};

export const updatePresupuesto = async (id: string, data: Partial<Presupuesto>) => {
  return fetcher(`/api/presupuestos`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
};

export const getNextPresupuestoNumber = async (): Promise<string> => {
  const presupuestos = await getPresupuestos();
  if (!presupuestos || presupuestos.length === 0) return "0001";
  
  const validNumbers = presupuestos
    .map(p => parseInt(p.numero, 10))
    .filter(n => !isNaN(n));
    
  if (validNumbers.length === 0) return "0001";
  
  const lastNum = Math.max(...validNumbers);
  return (lastNum + 1).toString().padStart(4, '0');
};

// --- PROYECTOS ---
export const getProyectos = async (forceRefresh: boolean = false): Promise<Proyecto[]> => {
  return fetcher("/api/proyectos", { forceRefresh });
};

export const getProyectoById = async (id: string, forceRefresh: boolean = false): Promise<Proyecto> => {
  return fetcher(`/api/proyectos/${id}`, { forceRefresh });
};

export const saveProyecto = async (proyecto: Partial<Proyecto>) => {
  return fetcher("/api/proyectos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proyecto),
  });
};

export const updateProyecto = async (id: string, proyecto: Partial<Proyecto>) => {
  return fetcher(`/api/proyectos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proyecto),
  });
};

export const deleteProyecto = async (id: string) => {
  return fetcher(`/api/proyectos/${id}`, {
    method: "DELETE",
  });
};

// --- DOCUMENTOS OPERATIVOS ---
export const getDocumentosProyecto = async (proyectoId: string, forceRefresh: boolean = false): Promise<DocumentoOperativo[]> => {
  return fetcher(`/api/proyectos/${proyectoId}/documentos`, { forceRefresh });
};

export const saveDocumentoOperativo = async (proyectoId: string, doc: Partial<DocumentoOperativo>) => {
  return fetcher(`/api/proyectos/${proyectoId}/documentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
};

// --- FLUJO DE CAJA ---
export const getEventosFinancieros = async (forceRefresh: boolean = false): Promise<EventoFinanciero[]> => {
  return fetcher("/api/flujo-caja", { forceRefresh });
};

export const saveEventoFinanciero = async (evento: Partial<EventoFinanciero>) => {
  return fetcher("/api/flujo-caja", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(evento),
  });
};

export const updateEventoFinanciero = async (id: string, evento: Partial<EventoFinanciero>) => {
  return fetcher(`/api/flujo-caja/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(evento),
  });
};

export const deleteEventoFinanciero = async (id: string) => {
  return fetcher(`/api/flujo-caja/${id}`, {
    method: "DELETE",
  });
};

// --- DECLARACIONES TRIBUTARIAS F29 (SII) ---
export const getDeclaracionesF29 = async (forceRefresh: boolean = false): Promise<DeclaracionF29[]> => {
  return fetcher("/api/flujo-caja/f29", { forceRefresh });
};

export const marcarF29Declarado = async (data: {
  periodo: string;
  montoPagado?: number;
  sinMovimiento?: boolean;
  folioSII?: string;
  notas?: string;
}): Promise<{ success: boolean; declaracion: DeclaracionF29 }> => {
  return fetcher("/api/flujo-caja/f29", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const desmarcarF29Declarado = async (periodo: string) => {
  return fetcher(`/api/flujo-caja/f29?periodo=${periodo}`, {
    method: "DELETE",
  });
};

// --- SUSCRIPCIONES Y SERVICIOS RECURRENTES ---
export const getSubscriptions = async (forceRefresh: boolean = false): Promise<Subscription[]> => {
  return fetcher("/api/subscriptions", { forceRefresh });
};

export const getSubscriptionById = async (id: string, forceRefresh: boolean = false): Promise<Subscription> => {
  return fetcher(`/api/subscriptions/${id}`, { forceRefresh });
};

export const saveSubscription = async (sub: Partial<Subscription>) => {
  return fetcher("/api/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });
};

export const updateSubscription = async (id: string, sub: Partial<Subscription>) => {
  return fetcher(`/api/subscriptions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });
};

export const deleteSubscription = async (id: string) => {
  return fetcher(`/api/subscriptions/${id}`, {
    method: "DELETE",
  });
};

export const createSubscription = saveSubscription;

export const renewSubscription = async (
  id: string, 
  payload: string | { periodo?: "mensual" | "anual" | "semestral" | "trimestral"; monto?: number; notas?: string } = "anual"
) => {
  const body = typeof payload === "string" ? { periodo: payload } : payload;
  return fetcher(`/api/subscriptions/${id}/renovar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

export const renovarSubscription = (id: string, payload?: { periodo?: "mensual" | "anual" | "semestral" | "trimestral"; monto?: number; notas?: string }) => 
  renewSubscription(id, payload || "anual");

// --- GASTOS OPERATIVOS / COSTOS FIJOS ---
export const getGastosOperativos = async (forceRefresh: boolean = false): Promise<GastoOperativo[]> => {
  return fetcher("/api/expenses", { forceRefresh });
};

export const saveGastoOperativo = async (gasto: Partial<GastoOperativo>) => {
  return fetcher("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(gasto),
  });
};

export const deleteGastoOperativo = async (id: string) => {
  return fetcher(`/api/expenses/${id}`, {
    method: "DELETE",
  });
};

// --- PROPUESTAS PÚBLICAS (ACCESO CLIENTE CON TOKEN) ---
export const getPropuestaPublicaByToken = async (token: string): Promise<Presupuesto> => {
  return fetcher(`/api/propuesta/${token}`);
};

export const aceptarPropuestaPublica = async (token: string, datos?: { nombreCliente?: string; comentarios?: string }) => {
  return fetcher(`/api/propuesta/${token}/aceptar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos || {}),
  });
};

// --- DASHBOARD Y ALERTAS ---
export interface DashboardMetricsData {
  ingresosMes: {
    cobrado: number;
    porCobrar: number;
    total: number;
  };
  proyectosPorFase: {
    fase: string;
    label: string;
    cantidad: number;
  }[];
  totalProyectosActivos: number;
  totalClientes: number;
  totalCotizacionesPendientes: number;
  presupuestosPendientes?: {
    cantidad: number;
    montoTotal: number;
  };
  pisoRecurrenteMRR?: {
    totalCLP: number;
    totalUF: number;
    totalSuscripcionesActivas: number;
  };
  suscripcionesPorVencer?: number;
  suscripcionesVencidas?: number;
  margenBrutoMes?: {
    ingresos: number;
    costos: number;
    margen: number;
    porcentaje: number;
  };
  alertasDelDia?: AlertaOperativa[];

  // Nuevas secciones compactas del Dashboard
  contactosSinContactar?: Cliente[];
  totalContactosSinContactar?: number;
  
  presupuestosEnNegociacion?: Presupuesto[];
  totalPresupuestosEnNegociacion?: number;
  montoTotalNegociacion?: number;

  proyectosEnCurso?: Proyecto[];
  totalProyectosEnCurso?: number;

  saldoCajaActual?: number;
  serviciosRecurrentesPorVencer?: (Subscription & {
    diasRestantes: number;
    costoCLP: number;
    cubiertoConFlujo: boolean;
    diferenciaFlujoCLP: number;
  })[];
}

export const getDashboardMetrics = async (forceRefresh: boolean = false): Promise<DashboardMetricsData> => {
  const url = forceRefresh ? "/api/dashboard/metrics?nocache=true" : "/api/dashboard/metrics";
  return fetcher(url, { forceRefresh });
};

export const getAlertasGlobales = async (forceRefresh: boolean = false): Promise<AlertaOperativa[]> => {
  return fetcher("/api/alertas", { forceRefresh });
};

// --- SESIONES DE PROSPECCIÓN GUIADA ---
export interface ProspeccionStatsResponse {
  streak: UserStreak;
  activeSession?: ProspectingSession | null;
  sessions: ProspectingSession[];
  prospects: Prospect[];
  stats: {
    dia: {
      contactosHoy: number;
      tiempoMinutosTotal: number;
      tiempoSegundosTotal: number;
      promedioMinutosPorContacto: number;
    };
    semana: {
      desglose: {
        dia: string;
        fecha: string;
        contactos: number;
        respuestas: number;
        esHoy: boolean;
      }[];
      totalContactos: number;
      totalRespuestas: number;
    };
    mes: {
      totalContactos: number;
      respuestas: number;
      cotizaciones: number;
      cerrados: number;
      tasaRespuesta: number;
    };
  };
}

export const getProspeccionData = async (userId?: string): Promise<ProspeccionStatsResponse> => {
  const url = userId ? `/api/prospeccion?userId=${encodeURIComponent(userId)}` : "/api/prospeccion";
  return fetcher(url);
};

export const startProspectingSession = async (
  metaObjetivo: number = 3, 
  userId?: string, 
  userEmail?: string
): Promise<{ session: ProspectingSession }> => {
  return fetcher("/api/prospeccion/session/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metaObjetivo, userId, userEmail }),
  });
};

export const pauseProspectingSession = async (
  sessionId: string,
  duracionSegundos: number
): Promise<{ session: ProspectingSession; message: string }> => {
  return fetcher("/api/prospeccion/session/pause", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, duracionSegundos }),
  });
};

export const resumeProspectingSession = async (
  sessionId: string
): Promise<{ session: ProspectingSession; message: string }> => {
  return fetcher("/api/prospeccion/session/resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
};

export const cancelProspectingSession = async (
  sessionId: string
): Promise<{ success: boolean; message: string }> => {
  return fetcher("/api/prospeccion/session/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
};

export const saveProspectContact = async (
  data: Partial<Prospect>
): Promise<{ prospect: Prospect; session?: ProspectingSession }> => {
  return fetcher("/api/prospeccion/prospect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const finishProspectingSession = async (
  sessionId: string,
  duracionSegundos: number,
  userId?: string
): Promise<{ session: ProspectingSession; streak: UserStreak }> => {
  return fetcher("/api/prospeccion/session/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, duracionSegundos, userId }),
  });
};

export const updateProspect = async (
  id: string,
  data: { estado?: ProspectEstado; notas?: string }
): Promise<{ prospect: Prospect }> => {
  return fetcher(`/api/prospeccion/prospect/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const updateProspectEstado = async (
  id: string,
  estado: ProspectEstado
): Promise<{ prospect: Prospect }> => {
  return updateProspect(id, { estado });
};



