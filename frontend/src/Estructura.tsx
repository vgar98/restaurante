import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  actualizarUsuario,
  api,
  cerrarSesion,
  obtenerSesion,
  type Sesion,
} from './api';
import { grupos } from './menu';

interface Props {
  titulo: string;
  children: ReactNode;
}

export default function Estructura({ titulo, children }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Sesion['usuario'] | null>(
    () => obtenerSesion()?.usuario ?? null,
  );
  const [abierto, setAbierto] = useState(false);

  // Trae los roles y permisos actuales, por si el administrador los cambió
  useEffect(() => {
    api<Sesion['usuario']>('/auth/yo')
      .then((actual) => {
        actualizarUsuario(actual);
        setUsuario(actual);
      })
      .catch(() => {});
  }, []);

  // Con el menú abierto: Escape lo cierra y la página de atrás no se desplaza
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('keydown', alTeclear);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = '';
    };
  }, [abierto]);

  function salir() {
    cerrarSesion();
    navigate('/login', { replace: true });
  }

  const permisos = usuario?.permisos ?? [];
  const secciones = grupos
    .map((g) => ({
      ...g,
      opciones: g.opciones.filter((o) => permisos.includes(o.permiso)),
    }))
    .filter((g) => g.opciones.length > 0);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => setAbierto(true)}
            aria-label="Abrir menú"
            aria-expanded={abierto}
            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-100"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
              Restaurante
            </p>
            <h1 className="truncate text-base font-semibold tracking-tight">
              {titulo}
            </h1>
          </div>
          <span className="hidden text-sm text-stone-500 sm:block">
            {usuario?.nombre}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

      {abierto && (
        <div className="fixed inset-0 z-30 flex">
          <nav
            aria-label="Menú principal"
            className="flex w-72 max-w-[85vw] flex-col bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 px-4 py-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{usuario?.nombre}</p>
                <p className="truncate text-xs capitalize text-stone-500">
                  {usuario?.roles.join(', ')}
                </p>
              </div>
              <button
                onClick={() => setAbierto(false)}
                aria-label="Cerrar menú"
                className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
              {secciones.length === 0 && (
                <p className="px-2 text-sm text-stone-500">
                  Tu usuario no tiene pantallas asignadas.
                </p>
              )}
              {secciones.map((g) => (
                <div key={g.titulo}>
                  <p className="px-2 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                    {g.titulo}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {g.opciones.map((o) => (
                      <li key={o.a}>
                        <NavLink
                          to={o.a}
                          onClick={() => setAbierto(false)}
                          className={({ isActive }) =>
                            `flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition ${
                              isActive
                                ? 'bg-stone-900 text-white'
                                : 'text-stone-700 hover:bg-stone-100'
                            }`
                          }
                        >
                          {o.texto}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                onClick={salir}
                className="h-11 w-full rounded-xl border border-stone-300 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              >
                Cerrar sesión
              </button>
            </div>
          </nav>
          <div className="flex-1 bg-stone-900/40" onClick={() => setAbierto(false)} />
        </div>
      )}
    </div>
  );
}