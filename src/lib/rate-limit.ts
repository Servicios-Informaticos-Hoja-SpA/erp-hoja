// Simple memory-based rate limiter
// For production in serverless environments, consider using Redis (Upstash)

const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();

const WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 15; // Límite solicitado

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userData = rateLimitMap.get(ip);

  if (!userData) {
    rateLimitMap.set(ip, { count: 1, lastRequest: now });
    return false;
  }

  // Resetear si pasó la ventana de tiempo
  if (now - userData.lastRequest > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, lastRequest: now });
    return false;
  }

  // Incrementar contador
  userData.count++;
  
  if (userData.count > MAX_REQUESTS) {
    return true;
  }

  return false;
}

// Limpiar el mapa periódicamente para evitar fugas de memoria
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now - data.lastRequest > WINDOW_MS) {
        rateLimitMap.delete(ip);
      }
    }
  }, WINDOW_MS);
}
