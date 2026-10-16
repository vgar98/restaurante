import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, guardarSesion, obtenerSesion, type Sesion } from '../api';
import { rutaInicial } from '../menu';


export default function Login() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const sesion = await api<Sesion>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usuario, password }),
      });
      const destino = rutaInicial(sesion.usuario.permisos);
      if (!destino) {
        setError(
          'Tu usuario no tiene permisos asignados. Habla con el administrador.',
        );
        return;
      }
      guardarSesion(sesion);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setCargando(false);
    }
  }

  const campo =
    'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10';
  
  //nuevo
  // Si ya hay una sesión iniciada, no tiene sentido mostrar el login
  const sesionActual = obtenerSesion();
  const inicio = sesionActual ? rutaInicial(sesionActual.usuario.permisos) : null;
  if (inicio) {
    return <Navigate to={inicio} replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
            Restaurante
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Ingresa con tu usuario del equipo
          </p>
        </div>

        <form
          onSubmit={enviar}
          className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <label htmlFor="usuario" className="text-sm font-medium text-stone-700">
              Usuario
            </label>
            <input
              id="usuario"
              className={campo}
              placeholder="mozo1"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-stone-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className={campo}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}