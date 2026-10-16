import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { dinero } from './formato';
import type { Categoria, EstadoItem, Mesa, Pedido, Plato } from './tipos';

interface Props {
  mesa: Mesa;
  onCerrar: () => void;
  onEnviado: () => void;
}

interface LineaCarrito {
  cantidad: number;
  notas: string;
}

const notasRapidas = [
  'Sin ají',
  'Sin cebolla',
  'Sin culantro',
  'Poco picante',
  'Para llevar',
];

const etiquetaItem: Record<EstadoItem, string> = {
  nuevo: 'Nuevo',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const colorItem: Record<EstadoItem, string> = {
  nuevo: 'bg-stone-100 text-stone-600',
  en_preparacion: 'bg-amber-100 text-amber-800',
  listo: 'bg-emerald-100 text-emerald-800',
  entregado: 'bg-sky-100 text-sky-800',
  cancelado: 'bg-red-100 text-red-700',
};

export default function Comanda({ mesa, onCerrar, onEnviado }: Props) {
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [carrito, setCarrito] = useState<Record<number, LineaCarrito>>({});
  const [notaAbierta, setNotaAbierta] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const cargarPedido = useCallback(async () => {
    const abiertos = await api<Pedido[]>('/pedidos?estado=abierto');
    setPedido(abiertos.find((p) => p.mesaId === mesa.id) ?? null);
  }, [mesa.id]);

  useEffect(() => {
    async function inicial() {
      try {
        const [listaPlatos, listaCategorias] = await Promise.all([
          api<Plato[]>('/platos?disponibles=true'),
          api<Categoria[]>('/categorias?activas=true'),
        ]);
        setPlatos(listaPlatos);
        setCategorias(listaCategorias);
        setCategoriaActiva(listaCategorias[0]?.id ?? null);
        await cargarPedido();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setCargando(false);
      }
    }
    inicial();

    // Para ver cómo cocina va cambiando el estado de los platos
    const intervalo = setInterval(() => {
      cargarPedido().catch(() => {});
    }, 5000);
    return () => clearInterval(intervalo);
  }, [cargarPedido]);

  function cambiar(platoId: number, delta: number) {
    setCarrito((actual) => {
      const nueva = (actual[platoId]?.cantidad ?? 0) + delta;
      const copia = { ...actual };
      if (nueva <= 0) {
        delete copia[platoId];
      } else {
        copia[platoId] = {
          cantidad: nueva,
          notas: actual[platoId]?.notas ?? '',
        };
      }
      return copia;
    });
  }

  function ponerNota(platoId: number, notas: string) {
    setCarrito((actual) =>
      actual[platoId]
        ? { ...actual, [platoId]: { ...actual[platoId], notas } }
        : actual,
    );
  }

  function agregarRapida(platoId: number, texto: string) {
    const actual = carrito[platoId]?.notas ?? '';
    if (actual.toLowerCase().includes(texto.toLowerCase())) return;
    ponerNota(platoId, actual ? `${actual}, ${texto.toLowerCase()}` : texto);
  }

  const lineas = useMemo(
    () =>
      platos
        .filter((p) => carrito[p.id])
        .map((p) => ({
          plato: p,
          cantidad: carrito[p.id].cantidad,
          notas: carrito[p.id].notas,
        })),
    [platos, carrito],
  );
  const totalCarrito = lineas.reduce(
    (suma, l) => suma + l.plato.precio * l.cantidad,
    0,
  );
  const cantidadTotal = lineas.reduce((suma, l) => suma + l.cantidad, 0);
  const visibles = platos.filter((p) => p.categoriaId === categoriaActiva);

  const consumo = (pedido?.items ?? [])
    .filter((i) => i.estado !== 'cancelado')
    .reduce((suma, i) => suma + i.precioUnitario * i.cantidad, 0);

  async function enviar() {
    setError('');
    setEnviando(true);
    try {
      const items = lineas.map((l) => ({
        platoId: l.plato.id,
        cantidad: l.cantidad,
        notas: l.notas.trim() || undefined,
      }));
      if (pedido) {
        await api(`/pedidos/${pedido.id}/items`, {
          method: 'POST',
          body: JSON.stringify({ items }),
        });
      } else {
        await api('/pedidos', {
          method: 'POST',
          body: JSON.stringify({ mesaId: mesa.id, items }),
        });
      }
      setCarrito({});
      setNotaAbierta(null);
      await cargarPedido();
      onEnviado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end bg-stone-900/40 md:items-stretch md:justify-end"
      onClick={onCerrar}
    >
      <div
        className="flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-stone-50 shadow-xl md:h-full md:max-w-md md:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
              Comanda
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              Mesa {mesa.numero}
            </h2>
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {cargando && (
            <p className="px-4 py-6 text-sm text-stone-500">Cargando...</p>
          )}

          {pedido && (
            <section className="border-b border-stone-200 bg-white px-4 py-4">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold">
                  Ya pedido · #{pedido.id}
                </h3>
                <span className="text-sm text-stone-500">{dinero(consumo)}</span>
              </div>
              <ul className="mt-3 space-y-3">
                {pedido.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p
                        className={
                          item.estado === 'cancelado'
                            ? 'text-stone-400 line-through'
                            : ''
                        }
                      >
                        {item.cantidad} × {item.plato.nombre}
                      </p>
                      {item.notas && (
                        <p className="text-xs text-stone-500">{item.notas}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${colorItem[item.estado]}`}
                    >
                      {etiquetaItem[item.estado]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!cargando && categorias.length === 0 && (
            <p className="px-4 py-6 text-sm text-stone-500">
              No hay categorías activas. Créalas desde el administrador.
            </p>
          )}

          {categorias.length > 0 && (
            <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-stone-50 px-4 py-3">
              {categorias.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoriaActiva(c.id)}
                  className={`h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition ${
                    categoriaActiva === c.id
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          )}

          <ul className="space-y-2 px-4 pb-4">
            {visibles.map((plato) => {
              const linea = carrito[plato.id];
              const cantidad = linea?.cantidad ?? 0;
              const abierta = notaAbierta === plato.id;
              return (
                <li
                  key={plato.id}
                  className="rounded-2xl border border-stone-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {plato.nombre}
                      </p>
                      {plato.descripcion && (
                        <p className="truncate text-xs text-stone-500">
                          {plato.descripcion}
                        </p>
                      )}
                      <p className="mt-0.5 text-sm text-stone-700">
                        {dinero(plato.precio)}
                      </p>
                    </div>

                    {cantidad === 0 ? (
                      <button
                        onClick={() => cambiar(plato.id, 1)}
                        className="h-11 shrink-0 rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700"
                      >
                        Agregar
                      </button>
                    ) : (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => cambiar(plato.id, -1)}
                          aria-label="Quitar uno"
                          className="h-11 w-11 rounded-full border border-stone-300 text-lg transition hover:bg-stone-100"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">
                          {cantidad}
                        </span>
                        <button
                          onClick={() => cambiar(plato.id, 1)}
                          aria-label="Agregar uno"
                          className="h-11 w-11 rounded-full bg-stone-900 text-lg text-white transition hover:bg-stone-700"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  {cantidad > 0 && (
                    <div className="mt-3 border-t border-stone-100 pt-3">
                      {abierta ? (
                        <div className="space-y-3">
                          <input
                            autoFocus
                            value={linea.notas}
                            onChange={(e) => ponerNota(plato.id, e.target.value)}
                            placeholder="Ej: sin ají, término medio"
                            maxLength={120}
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10"
                          />
                          <div className="flex flex-wrap gap-2">
                            {notasRapidas.map((n) => (
                              <button
                                key={n}
                                onClick={() => agregarRapida(plato.id, n)}
                                className="h-11 rounded-full border border-stone-300 px-4 text-sm text-stone-700 transition hover:bg-stone-100"
                              >
                                + {n}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setNotaAbierta(null)}
                            className="h-11 text-sm font-medium text-stone-900"
                          >
                            Listo
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setNotaAbierta(plato.id)}
                          className="min-h-11 w-full text-left text-sm text-stone-500 transition hover:text-stone-900"
                        >
                          {linea.notas
                            ? `Nota: ${linea.notas}`
                            : '+ Agregar nota'}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
            {!cargando && categorias.length > 0 && visibles.length === 0 && (
              <li className="py-6 text-center text-sm text-stone-500">
                No hay platos disponibles en esta categoría.
              </li>
            )}
          </ul>
        </div>

        <div className="border-t border-stone-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            onClick={enviar}
            disabled={cantidadTotal === 0 || enviando}
            className="h-12 w-full rounded-xl bg-stone-900 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {enviando
              ? 'Enviando...'
              : cantidadTotal === 0
                ? 'Elige platos para enviar'
                : `Enviar a cocina · ${cantidadTotal} ${cantidadTotal === 1 ? 'plato' : 'platos'} · ${dinero(totalCarrito)}`}
          </button>
        </div>
      </div>
    </div>
  );
}