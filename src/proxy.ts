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
  const { pathname, searchParams } = request.nextUrl;

  // Permitir explícitamente manifest y assets estáticos si llegaran al proxy
  if (
    pathname === '/manifest.webmanifest' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg')
  ) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Si se solicita login con parámetro de reautenticación o reset,
  // permitimos el acceso y limpiamos la cookie obsoleta para evitar bucles de redirección.
  if (pathname === '/login' && searchParams.has('reauth')) {
    const res = NextResponse.next();
    res.cookies.delete('session_active');
    return withSecurityHeaders(res);
  }

  // 1. Si el usuario NO tiene sesión y no está en el login, redirigir a login
  // Nota: Permitimos acceso a /api/auth/login y /api/auth/logout para gestión de sesión
  if (!session && pathname !== '/login' && pathname !== '/api/auth/login' && pathname !== '/api/auth/logout') {
    if (pathname.startsWith('/api/')) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }
    return withSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
  }

  // 2. Si el usuario YA tiene sesión e intenta ir al login, redirigir al dashboard solo si no hay reauth
  if (session && pathname === '/login') {
    return withSecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
  }

  return withSecurityHeaders(NextResponse.next());
}

// Configurar en qué rutas se debe ejecutar el proxy
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static, _next/image
     * - favicon.ico, manifest.webmanifest, manifest.json
     * - static image formats (.svg, .png, .jpg, .jpeg, .webp, .ico)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|webp|ico|webmanifest)$).*)',
  ],
};
