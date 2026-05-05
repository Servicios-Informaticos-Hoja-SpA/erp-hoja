import { cookies } from 'next/headers';

/**
 * Verifica si hay una sesión activa en el lado del servidor.
 * @returns boolean indicando si la sesión es válida.
 */
export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session_active');
  
  // En una implementación más avanzada, aquí se validaría un JWT o Firebase ID Token.
  // Por ahora, protegemos contra acceso público básico.
  return !!session && session.value === 'true';
}
