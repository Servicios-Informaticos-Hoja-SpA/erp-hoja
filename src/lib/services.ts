import { 
  Cliente, 
  Servicio, 
  ConfiguracionGlobal, 
  Presupuesto 
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

export const savePresupuesto = async (presupuesto: any) => {
  return fetcher("/api/presupuestos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(presupuesto),
  });
};

export const getNextPresupuestoNumber = async (): Promise<string> => {
  const presupuestos = await getPresupuestos();
  if (!presupuestos || presupuestos.length === 0) return "0001";
  
  const lastNum = Math.max(...presupuestos.map(p => parseInt(p.numero)));
  return (lastNum + 1).toString().padStart(4, '0');
};
