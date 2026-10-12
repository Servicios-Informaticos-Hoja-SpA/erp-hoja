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
  ProspectEstado
} from "./types";

const fetcher = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  
  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!res.ok) {
    if (isJson) {
      const error = await res.json();
      throw new Error(error.error || `Error ${res.status}: ${res.statusText}`);
    }
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  if (!isJson) {
    return null;
  }

  return res.json();
};

// --- CLIENTES ---
export const getClientes = async (): Promise<Cliente[]> => {
  return fetcher("/api/clientes");
};

export const getClienteById = async (id: string): Promise<Cliente> => {
  return fetcher(`/api/clientes/${id}`);
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

export const deleteCliente = async (id: string) => {
  return fetcher(`/api/clientes/${id}`, {
    method: "DELETE",
  });
};

// --- CATALOGO ---
export const getCatalogo = async (): Promise<Servicio[]> => {
  return fetcher("/api/catalogo");
};

// --- CONFIGURACION GLOBAL ---
export const getConfig = async (): Promise<ConfiguracionGlobal | null> => {
  try {
    return await fetcher("/api/config");
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
export const getPresupuestos = async (): Promise<Presupuesto[]> => {
  return fetcher("/api/presupuestos");
};

export const getPresupuestoById = async (id: string): Promise<Presupuesto> => {
  return fetcher(`/api/presupuestos?id=${id}`);
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
export const getProyectos = async (): Promise<Proyecto[]> => {
  return fetcher("/api/proyectos");
};

export const getProyectoById = async (id: string): Promise<Proyecto> => {
  return fetcher(`/api/proyectos/${id}`);
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
export const getDocumentosProyecto = async (proyectoId: string): Promise<DocumentoOperativo[]> => {
  return fetcher(`/api/proyectos/${proyectoId}/documentos`);
};

export const saveDocumentoOperativo = async (proyectoId: string, doc: Partial<DocumentoOperativo>) => {
  return fetcher(`/api/proyectos/${proyectoId}/documentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
};

// --- FLUJO DE CAJA ---
export const getEventosFinancieros = async (): Promise<EventoFinanciero[]> => {
  return fetcher("/api/flujo-caja");
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

// --- SUSCRIPCIONES Y SERVICIOS RECURRENTES ---
export const getSubscriptions = async (): Promise<Subscription[]> => {
  return fetcher("/api/subscriptions");
};

export const getSubscriptionById = async (id: string): Promise<Subscription> => {
  return fetcher(`/api/subscriptions/${id}`);
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

export const renewSubscription = async (id: string, periodo: "mensual" | "anual" = "anual") => {
  return fetcher(`/api/subscriptions/${id}/renovar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ periodo }),
  });
};

export const renovarSubscription = (id: string) => renewSubscription(id, "anual");

// --- GASTOS OPERATIVOS / COSTOS FIJOS ---
export const getGastosOperativos = async (): Promise<GastoOperativo[]> => {
  return fetcher("/api/expenses");
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
  alertasDelDia: AlertaOperativa[];
}

export const getDashboardMetrics = async (): Promise<DashboardMetricsData> => {
  return fetcher("/api/dashboard/metrics");
};

export const getAlertasGlobales = async (): Promise<AlertaOperativa[]> => {
  return fetcher("/api/alertas");
};

// --- SESIONES DE PROSPECCIÓN GUIADA ---
export interface ProspeccionStatsResponse {
  streak: UserStreak;
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

export const updateProspectEstado = async (
  id: string,
  estado: ProspectEstado
): Promise<{ prospect: Prospect }> => {
  return fetcher(`/api/prospeccion/prospect/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });
};


