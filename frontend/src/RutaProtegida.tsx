import type { ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { cerrarSesion, obtenerSesion } from './api';
import { rutaInicial } from './menu';

interface Props {
  permiso: string;
  children: ReactNode;
}

export default function RutaProtegida({ permiso, children }: Props) {
  const sesion = obtenerSesion();

  // Sin sesión: de vuelta al login
  if (!sesion) return <Navigate to="/login" replace />;

  const permisos = sesion.usuario.permisos;
  if (!permisos.includes(permiso)) {
    const inicio = rutaInicial(permisos);
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Sin acceso</h1>
        <p className="text-sm text-stone-500">
          Tu usuario no tiene permiso para ver esta pantalla.
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          {inicio && (
            <Link
              to={inicio}
              className="flex h-11 items-center justify-center rounded-lg bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700"
            >
              Ir a mi pantalla
            </Link>
          )}
          <button
            onClick={() => {
              cerrarSesion();
              window.location.href = '/login';
            }}
            className="h-11 rounded-lg border border-stone-300 px-5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            Cambiar de usuario
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}