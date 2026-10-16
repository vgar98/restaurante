export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface Sesion {
  accessToken: string;
  usuario: {
    id: string;
    nombre: string;
    usuario: string;
    roles: string[];
    permisos: string[];
  };
}

export function guardarSesion(sesion: Sesion) {
  localStorage.setItem('sesion', JSON.stringify(sesion));
}

export function obtenerSesion(): Sesion | null {
  const texto = localStorage.getItem('sesion');
  if (!texto) return null;
  try {
    const sesion = JSON.parse(texto) as Sesion;
    // Las sesiones guardadas antes de este cambio no traen permisos: se descartan
    return Array.isArray(sesion.usuario?.permisos) ? sesion : null;
  } catch {
    return null;
  }
}

export function actualizarUsuario(usuario: Sesion['usuario']) {
  const sesion = obtenerSesion();
  if (sesion) guardarSesion({ ...sesion, usuario });
}

export function cerrarSesion() {
  localStorage.removeItem('sesion');
}

export async function api<T>(
  ruta: string,
  opciones: RequestInit = {},
): Promise<T> {
  const sesion = obtenerSesion();
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(sesion ? { Authorization: `Bearer ${sesion.accessToken}` } : {}),
      ...opciones.headers,
    },
  });

  // Token vencido o inválido: se cierra la sesión y se vuelve al login
  if (respuesta.status === 401 && ruta !== '/auth/login') {
    cerrarSesion();
    window.location.href = '/login';
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const mensaje = Array.isArray(datos?.message)
      ? datos.message.join(', ')
      : datos?.message;
    throw new Error(mensaje ?? 'No se pudo completar la solicitud');
  }
  return datos as T;
}