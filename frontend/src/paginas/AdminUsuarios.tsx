import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, obtenerSesion } from '../api';
import Estructura from '../Estructura';
import Hoja from '../Hoja';
import MenuAdmin from '../MenuAdmin';
import type { Rol, Usuario } from '../tipos';

const campo =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 sm:text-sm';

export default function AdminUsuarios() {
  const miId = obtenerSesion()?.usuario.id;
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [editando, setEditando] = useState<Usuario | 'nuevo' | null>(null);
  const [nombre, setNombre] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [rolesSel, setRolesSel] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [listaUsuarios, listaRoles] = await Promise.all([
        api<Usuario[]>('/usuarios'),
        api<Rol[]>('/roles'),
      ]);
      setUsuarios(listaUsuarios);
      setRoles(listaRoles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function nuevo() {
    setNombre('');
    setLogin('');
    setPassword('');
    setRolesSel([]);
    setError('');
    setEditando('nuevo');
  }

  function editar(u: Usuario) {
    setNombre(u.nombre);
    setLogin(u.usuario);
    setPassword('');
    setRolesSel(u.roles.map((r) => r.id));
    setError('');
    setEditando(u);
  }

  function alternarRol(id: string) {
    setRolesSel((actual) =>
      actual.includes(id) ? actual.filter((r) => r !== id) : [...actual, id],
    );
  }

  const editado = editando && editando !== 'nuevo' ? editando : null;
  const esYo = editado !== null && editado.id === miId;

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!editando) return;
    if (!esYo && rolesSel.length === 0) {
      setError('Elige al menos un rol');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      if (editando === 'nuevo') {
        await api('/usuarios', {
          method: 'POST',
          body: JSON.stringify({
            nombre: nombre.trim(),
            usuario: login.trim(),
            password,
            rolesIds: rolesSel,
          }),
        });
      } else {
        const cuerpo: Record<string, unknown> = { nombre: nombre.trim() };
        if (password) cuerpo.password = password;
        if (!esYo) cuerpo.rolesIds = rolesSel;
        await api(`/usuarios/${editando.id}`, {
          method: 'PATCH',
          body: JSON.stringify(cuerpo),
        });
      }
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarActivo(u: Usuario, activo: boolean) {
    if (
      !activo &&
      !window.confirm(`¿Deshabilitar a ${u.nombre}? Ya no podrá iniciar sesión.`)
    ) {
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await api(`/usuarios/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ activo }),
      });
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Estructura titulo="Administración">
      <MenuAdmin />

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Usuarios</h2>
        <button
          onClick={nuevo}
          className="h-11 rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          + Nuevo usuario
        </button>
      </div>

      {error && !editando && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-stone-500">Cargando usuarios...</p>
      ) : usuarios.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500">
          Todavía no hay usuarios.
        </p>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
          {usuarios.map((u) => (
            <li
              key={u.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${
                u.activo ? '' : 'opacity-60'
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {u.nombre}
                  {u.id === miId && (
                    <span className="ml-2 text-xs font-normal text-stone-400">
                      (tú)
                    </span>
                  )}
                </p>
                <p className="truncate text-xs capitalize text-stone-500">
                  {u.usuario} · {u.roles.map((r) => r.nombre).join(', ')}
                  {!u.activo && ' · Deshabilitado'}
                </p>
              </div>
              <button
                onClick={() => editar(u)}
                className="h-11 shrink-0 rounded-full border border-stone-300 px-5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              >
                Editar
              </button>
            </li>
          ))}
        </ul>
      )}

      {editando && (
        <Hoja
          etiqueta="Usuarios"
          titulo={editado ? editado.nombre : 'Nuevo usuario'}
          onCerrar={() => setEditando(null)}
        >
          <form onSubmit={guardar} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="nombre" className="text-sm font-medium text-stone-700">
                Nombre
              </label>
              <input
                id="nombre"
                className={campo}
                placeholder="Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                minLength={2}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login" className="text-sm font-medium text-stone-700">
                Usuario (para iniciar sesión)
              </label>
              <input
                id="login"
                className={`${campo} disabled:bg-stone-100 disabled:text-stone-500`}
                placeholder="mozo2"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                minLength={3}
                disabled={editado !== null}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-stone-700">
                {editado ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              </label>
              <input
                id="password"
                type="password"
                className={campo}
                placeholder={
                  editado ? 'Déjala en blanco para no cambiarla' : 'Mínimo 6 caracteres'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required={!editado}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-medium text-stone-700">Roles</span>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => {
                  const marcado = rolesSel.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={marcado}
                      disabled={esYo}
                      onClick={() => alternarRol(r.id)}
                      className={`min-h-11 rounded-full border px-4 text-sm font-medium capitalize transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        marcado
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
                      }`}
                    >
                      {r.nombre}
                    </button>
                  );
                })}
              </div>
              {esYo && (
                <p className="text-xs text-stone-500">
                  No puedes cambiar tus propios roles.
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="h-12 w-full rounded-xl bg-stone-900 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>

            {editado &&
              (editado.activo ? (
                <>
                  <button
                    type="button"
                    onClick={() => cambiarActivo(editado, false)}
                    disabled={guardando || esYo}
                    className="h-12 w-full rounded-xl border border-red-200 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Deshabilitar usuario
                  </button>
                  {esYo && (
                    <p className="text-center text-xs text-stone-500">
                      No puedes deshabilitar tu propio usuario.
                    </p>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => cambiarActivo(editado, true)}
                  disabled={guardando}
                  className="h-12 w-full rounded-xl border border-stone-300 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-50"
                >
                  Volver a habilitar
                </button>
              ))}
          </form>
        </Hoja>
      )}
    </Estructura>
  );
}