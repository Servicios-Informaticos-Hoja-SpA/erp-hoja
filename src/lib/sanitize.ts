/**
 * Utilidades de sanitización y seguridad para entradas de texto en formularios,
 * credenciales, tickets, notas y URLs.
 * Previene inyecciones XSS, javascript: URI injection y etiquetas maliciosas.
 */

// Elimina scripts, atributos de eventos on* y protocolos javascript:
export function sanitizeString(val: string): string {
  if (!val || typeof val !== "string") return val;

  return val
    // Eliminar etiquetas de script completas
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Eliminar iframe, object, embed, applet
    .replace(/<(iframe|object|embed|applet)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, "")
    // Eliminar manejadores de eventos (onclick, onerror, onload, onmouseover, etc.)
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^>\s]+/gi, "")
    // Neutralizar URIs javascript:, data: y vbscript: en atributos
    .replace(/(javascript|vbscript|data):/gi, "$1_blocked:")
    // Limpieza de etiquetas de apertura mal formadas
    .trim();
}

/**
 * Sanitiza recursivamente un objeto o array de propiedades de texto.
 */
export function sanitizeData<T>(input: T): T {
  if (input === null || input === undefined) return input;

  if (typeof input === "string") {
    return sanitizeString(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeData(item)) as unknown as T;
  }

  if (typeof input === "object" && !(input instanceof Date)) {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitizedObj[key] = sanitizeData(value);
    }
    return sanitizedObj as T;
  }

  return input;
}
