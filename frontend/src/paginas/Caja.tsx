import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import Estructura from '../Estructura';
import { dinero } from '../formato';
import type { Pedido } from '../tipos';

type MetodoPago = 'efectivo' | 'tarjeta' | 'yape_plin';

const metodos: { valor: MetodoPago; texto: string }[] = [
  { valor: 'efectivo', texto: 'Efectivo' },
  { valor: 'tarjeta', texto: 'Tarjeta' },
  { valor: 'yape_plin', texto: 'Yape / Plin' },
];

// Los platos cancelados no se cobran
const total = (p: Pedido) =>
  p.items
    .filter((i) => i.estado !== 'cancelado')
    .reduce((suma, i) => suma + i.precioUnitario * i.cantidad, 0);

const cantidadPlatos = (p: Pedido) =>
  p.items
    .filter((i) => i.estado !== 'cancelado')
    .reduce((suma, i) => suma + i.cantidad, 0);

export default function Caja() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cobrando, setCobrando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const lista = await api<Pedido[]>('/pedidos?estado=abierto');
      setPedidos(lista.sort((a, b) => a.mesa.numero - b.mesa.numero));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    // Por ahora consultamos cada 5 segundos
    const intervalo = setInterval(cargar, 5000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  // Se busca en la lista actual, así el detalle se mantiene al día
  const seleccionado = pedidos.find((p) => p.id === seleccionadoId) ?? null;

  function abrir(pedido: Pedido) {
    setSeleccionadoId(pedido.id);
    setMetodo(null);
    setError('');
  }

  async function cobrar(pedido: Pedido) {
    if (!metodo) return;
    setCobrando(true);
    setError('');
    try {
      const monto = total(pedido);
      await api(`/pedidos/${pedido.id}/cobrar`, {
        method: 'POST',
        body: JSON.stringify({ metodoPago: metodo }),
      });
      setAviso(`Mesa ${pedido.mesa.numero} cobrada · ${dinero(monto)}`);
      setTimeout(() => setAviso(''), 4000);
      setSeleccionadoId(null);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setCobrando(false);
    }
  }

  return (
    <Estructura titulo="Caja">
      {aviso && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {aviso}
        </p>
      )}
      {error && !seleccionado && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-stone-500">Cargando cuentas...</p>
      ) : pedidos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500">
          No hay cuentas abiertas.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pedidos.map((pedido) => (
            <button
              key={pedido.id}
              onClick={() => abrir(pedido)}
              className="rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-stone-400"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold tracking-tight">
                    Mesa {pedido.mesa.numero}
                  </p>
                  <p className="text-xs text-stone-400">Pedido #{pedido.id}</p>
                </div>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                  {cantidadPlatos(pedido)}{' '}
                  {cantidadPlatos(pedido) === 1 ? 'plato' : 'platos'}
                </span>
              </div>
              <p className="mt-4 text-xl font-semibold">
                {dinero(total(pedido))}
              </p>
            </button>
          ))}
        </div>
      )}

      {seleccionado && (
        <div
          className="fixed inset-0 z-20 flex items-end bg-stone-900/40 md:items-stretch md:justify-end"
          onClick={() => setSeleccionadoId(null)}
        >
          <div
            className="flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-stone-50 shadow-xl md:h-full md:max-w-md md:rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                  Cobro · Pedido #{seleccionado.id}
                </p>
                <h2 className="text-lg font-semibold tracking-tight">
                  Mesa {seleccionado.mesa.numero}
                </h2>
              </div>
              <button
                onClick={() => setSeleccionadoId(null)}
                aria-label="Cerrar"
                className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
                {seleccionado.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
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
                    {item.estado !== 'cancelado' && (
                      <span className="shrink-0 tabular-nums text-stone-700">
                        {dinero(item.precioUnitario * item.cantidad)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-baseline justify-between px-1">
                <span className="text-sm text-stone-500">Total</span>
                <span className="text-2xl font-semibold tracking-tight">
                  {dinero(total(seleccionado))}
                </span>
              </div>

              <h3 className="mt-6 text-sm font-medium text-stone-700">
                Método de pago
              </h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {metodos.map((m) => (
                  <button
                    key={m.valor}
                    onClick={() => setMetodo(m.valor)}
                    className={`min-h-11 rounded-xl border px-2 py-2 text-sm font-medium transition ${
                      metodo === m.valor
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
                    }`}
                  >
                    {m.texto}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-stone-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              {error && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <button
                onClick={() => cobrar(seleccionado)}
                disabled={!metodo || cobrando}
                className="h-12 w-full rounded-xl bg-stone-900 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {cobrando
                  ? 'Cobrando...'
                  : !metodo
                    ? 'Elige un método de pago'
                    : `Cobrar ${dinero(total(seleccionado))}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </Estructura>
  );
}