import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../api';
import Estructura from '../Estructura';
import { dinero } from '../formato';
import Hoja from '../Hoja';
import MenuAdmin from '../MenuAdmin';
import type { Categoria, Plato } from '../tipos';

const campo =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 sm:text-sm';

export default function AdminPlatos() {
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtro, setFiltro] = useState<number | null>(null);
  const [editando, setEditando] = useState<Plato | 'nuevo' | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [listaPlatos, listaCategorias] = await Promise.all([
        api<Plato[]>('/platos'),
        api<Categoria[]>('/categorias'),
      ]);
      setPlatos(listaPlatos);
      setCategorias(listaCategorias);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const categoriasActivas = categorias.filter((c) => c.activa);

  function nuevo() {
    setNombre('');
    setDescripcion('');
    setPrecio('');
    const inicial = filtro ?? categoriasActivas[0]?.id;
    setCategoriaId(inicial ? String(inicial) : '');
    setError('');
    setEditando('nuevo');
  }

  function editar(plato: Plato) {
    setNombre(plato.nombre);
    setDescripcion(plato.descripcion ?? '');
    setPrecio(String(plato.precio));
    setCategoriaId(String(plato.categoriaId));
    setError('');
    setEditando(plato);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!editando) return;
    if (!nombre.trim()) {
      setError('Escribe un nombre para el plato');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const cuerpo = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: Number(precio),
        categoriaId: Number(categoriaId),
      };
      if (editando === 'nuevo') {
        await api('/platos', {
          method: 'POST',
          body: JSON.stringify({
            ...cuerpo,
            descripcion: cuerpo.descripcion || undefined,
          }),
        });
      } else {
        await api(`/platos/${editando.id}`, {
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

  async function cambiarDisponible(plato: Plato, disponible: boolean) {
    if (
      !disponible &&
      !window.confirm(
        `¿Deshabilitar "${plato.nombre}"? Dejará de aparecer para los mozos.`,
      )
    ) {
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await api(`/platos/${plato.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ disponible }),
      });
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  }

  const visibles = platos.filter(
    (p) => filtro === null || p.categoriaId === filtro,
  );
  const platoEditado = editando && editando !== 'nuevo' ? editando : null;

  // Si el plato pertenece a una categoría desactivada, se sigue mostrando
  const opcionesCategoria = categorias.filter(
    (c) => c.activa || c.id === platoEditado?.categoriaId,
  );

  return (
    <Estructura titulo="Administración">
      <MenuAdmin />

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Platos</h2>
        <button
          onClick={nuevo}
          disabled={categoriasActivas.length === 0}
          className="h-11 rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          + Nuevo plato
        </button>
      </div>

      {error && !editando && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!cargando && categoriasActivas.length === 0 && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Para crear platos primero necesitas al menos una categoría activa.
        </p>
      )}

      {categorias.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {[{ id: null, nombre: 'Todas' }, ...categorias].map((c) => (
            <button
              key={c.id ?? 'todas'}
              onClick={() => setFiltro(c.id)}
              className={`h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition ${
                filtro === c.id
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      )}

      {cargando ? (
        <p className="text-sm text-stone-500">Cargando platos...</p>
      ) : visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500">
          No hay platos en esta vista.
        </p>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
          {visibles.map((plato) => (
            <li
              key={plato.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${
                plato.disponible ? '' : 'opacity-60'
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{plato.nombre}</p>
                <p className="truncate text-xs text-stone-500">
                  {plato.categoria.nombre} · {dinero(plato.precio)}
                  {!plato.disponible && ' · Deshabilitado'}
                </p>
              </div>
              <button
                onClick={() => editar(plato)}
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
          etiqueta="Platos"
          titulo={platoEditado ? platoEditado.nombre : 'Nuevo plato'}
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
                placeholder="Lomo saltado"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="descripcion" className="text-sm font-medium text-stone-700">
                Descripción (opcional)
              </label>
              <input
                id="descripcion"
                className={campo}
                placeholder="Con papas fritas y arroz"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="precio" className="text-sm font-medium text-stone-700">
                  Precio (S/)
                </label>
                <input
                  id="precio"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  className={campo}
                  placeholder="0.00"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="categoria" className="text-sm font-medium text-stone-700">
                  Categoría
                </label>
                <select
                  id="categoria"
                  className={campo}
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  required
                >
                  {opcionesCategoria.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                      {c.activa ? '' : ' (desactivada)'}
                    </option>
                  ))}
                </select>
              </div>
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

            {platoEditado &&
              (platoEditado.disponible ? (
                <button
                  type="button"
                  onClick={() => cambiarDisponible(platoEditado, false)}
                  disabled={guardando}
                  className="h-12 w-full rounded-xl border border-red-200 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                >
                  Deshabilitar plato
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => cambiarDisponible(platoEditado, true)}
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