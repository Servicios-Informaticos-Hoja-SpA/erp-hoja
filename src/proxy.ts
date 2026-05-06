import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isRateLimited } from './lib/rate-limit';

export function proxy(request: NextRequest) {
  // Función auxiliar para añadir cabeceras de seguridad a cualquier respuesta
  const withSecurityHeaders = (res: NextResponse) => {
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    return res;
  };

  // Obtener IP del cliente
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';

  // Aplicar Rate Limiting
  if (isRateLimited(ip)) {
    return withSecurityHeaders(NextResponse.json(
      { error: 'Demasiadas peticiones. Intenta de nuevo más tarde.' },
      { status: 429 }
    ));
  }

  const session = request.cookies.get('session_active');
  const { pathname } = request.nextUrl;

  // 1. Si el usuario NO tiene sesión y no está en el login, redirigir a login
  // Nota: Permitimos acceso a /api/auth/login y /api/auth/logout para gestión de sesión
  if (!session && pathname !== '/login' && pathname !== '/api/auth/login' && pathname !== '/api/auth/logout') {
    if (pathname.startsWith('/api/')) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }
    return withSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
  }

  // 2. Si el usuario YA tiene sesión e intenta ir al login, redirigir al dashboard
  if (session && pathname === '/login') {
    return withSecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
  }

  return withSecurityHeaders(NextResponse.next());
}

// Configurar en qué rutas se debe ejecutar el proxy
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png, logo_hoja.png (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|logo_hoja.png).*)',
  ],
};
