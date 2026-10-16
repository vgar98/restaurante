import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../api';
import Estructura from '../Estructura';
import Hoja from '../Hoja';
import MenuAdmin from '../MenuAdmin';
import type { Mesa } from '../tipos';

const campo =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 sm:text-sm';

export default function AdminMesas() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [editando, setEditando] = useState<Mesa | 'nueva' | null>(null);
  const [numero, setNumero] = useState('');
  const [capacidad, setCapacidad] = useState('4');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setMesas(await api<Mesa[]>('/mesas'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function nueva() {
    const siguiente = mesas.reduce((max, m) => Math.max(max, m.numero), 0) + 1;
    setNumero(String(siguiente));
    setCapacidad('4');
    setError('');
    setEditando('nueva');
  }

  function editar(mesa: Mesa) {
    setNumero(String(mesa.numero));
    setCapacidad(String(mesa.capacidad));
    setError('');
    setEditando(mesa);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setGuardando(true);
    setError('');
    try {
      const cuerpo = JSON.stringify({
        numero: Number(numero),
        capacidad: Number(capacidad),
      });
      if (editando === 'nueva') {
        await api('/mesas', { method: 'POST', body: cuerpo });
      } else {
        await api(`/mesas/${editando.id}`, { method: 'PATCH', body: cuerpo });
      }
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarActiva(mesa: Mesa, activa: boolean) {
    if (
      !activa &&
      !window.confirm(
        `¿Deshabilitar la mesa ${mesa.numero}? Dejará de aparecer para los mozos.`,
      )
    ) {
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await api(`/mesas/${mesa.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ activa }),
      });
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  }

  const mesaEditada = editando && editando !== 'nueva' ? editando : null;

  return (
    <Estructura titulo="Administración">
      <MenuAdmin />

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Mesas</h2>
        <button
          onClick={nueva}
          className="h-11 rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          + Nueva mesa
        </button>
      </div>

      {error && !editando && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-stone-500">Cargando mesas...</p>
      ) : mesas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500">
          Todavía no hay mesas. Crea la primera.
        </p>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
          {mesas.map((mesa) => (
            <li
              key={mesa.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${
                mesa.activa ? '' : 'opacity-60'
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium">Mesa {mesa.numero}</p>
                <p className="text-xs text-stone-500">
                  {mesa.capacidad} personas
                  {!mesa.activa && ' · Deshabilitada'}
                </p>
              </div>
              <button
                onClick={() => editar(mesa)}
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
          etiqueta="Mesas"
          titulo={mesaEditada ? `Mesa ${mesaEditada.numero}` : 'Nueva mesa'}
          onCerrar={() => setEditando(null)}
        >
          <form onSubmit={guardar} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="numero" className="text-sm font-medium text-stone-700">
                Número de mesa
              </label>
              <input
                id="numero"
                type="number"
                inputMode="numeric"
                min={1}
                className={campo}
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="capacidad" className="text-sm font-medium text-stone-700">
                Capacidad (personas)
              </label>
              <input
                id="capacidad"
                type="number"
                inputMode="numeric"
                min={1}
                className={campo}
                value={capacidad}
                onChange={(e) => setCapacidad(e.target.value)}
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
              disabled={guardando}
              className="h-12 w-full rounded-xl bg-stone-900 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>

            {mesaEditada &&
              (mesaEditada.activa ? (
                <>
                  <button
                    type="button"
                    onClick={() => cambiarActiva(mesaEditada, false)}
                    disabled={guardando || mesaEditada.estado !== 'libre'}
                    className="h-12 w-full rounded-xl border border-red-200 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Deshabilitar mesa
                  </button>
                  {mesaEditada.estado !== 'libre' && (
                    <p className="text-center text-xs text-stone-500">
                      No se puede deshabilitar mientras tenga un pedido abierto.
                    </p>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => cambiarActiva(mesaEditada, true)}
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