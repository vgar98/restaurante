import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import Estructura from '../Estructura';
import type { Pedido, PedidoItem } from '../tipos';
import { usarAvisos } from '../usarAvisos';

const tiempo = (fecha: string) => new Date(fecha).getTime();

const pendiente = (item: PedidoItem) =>
  item.estado !== 'entregado' && item.estado !== 'cancelado';

function minutosDesde(fecha: string): number {
  return Math.max(0, Math.floor((Date.now() - tiempo(fecha)) / 60000));
}

function colorEspera(min: number): string {
  if (min >= 15) return 'bg-red-100 text-red-700';
  if (min >= 8) return 'bg-amber-100 text-amber-800';
  return 'bg-stone-100 text-stone-600';
}

export default function Cocina() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setPedidos(await api<Pedido[]>('/pedidos?estado=abierto'));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    // Por ahora consultamos cada 4 segundos. Más adelante lo cambiamos
    // por avisos en tiempo real (WebSockets).
    const intervalo = setInterval(cargar, 30000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const tickets = useMemo(
    () =>
      pedidos
        .map((pedido) => ({
          pedido,
          items: pedido.items
            .filter(pendiente)
            .sort((a, b) => tiempo(a.creadoEn) - tiempo(b.creadoEn)),
        }))
        .filter((t) => t.items.length > 0)
        .sort(
          (a, b) => tiempo(a.items[0].creadoEn) - tiempo(b.items[0].creadoEn),
        ),
    [pedidos],
  );

  const totalPlatos = tickets.reduce((suma, t) => suma + t.items.length, 0);

  return (
    <Estructura titulo="Cocina">
      <p className="mb-4 text-sm text-stone-500">
        {totalPlatos === 0
          ? 'Sin platos pendientes'
          : `${totalPlatos} ${totalPlatos === 1 ? 'plato pendiente' : 'platos pendientes'}`}
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-stone-500">Cargando pedidos...</p>
      ) : tickets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500">
          No hay platos por preparar.
        </p>
      ) : (
        <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map(({ pedido, items }) => {
            const espera = minutosDesde(items[0].creadoEn);
            return (
              <article
                key={pedido.id}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
              >
                <header className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      Mesa {pedido.mesa.numero}
                    </h2>
                    <p className="text-xs text-stone-400">Pedido #{pedido.id}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${colorEspera(espera)}`}
                  >
                    {espera} min
                  </span>
                </header>

                <ul className="divide-y divide-stone-100">
                  {items.map((item) => (
                    <li key={item.id} className="px-4 py-3">
                      <p className="text-lg font-medium">
                        {item.cantidad} × {item.plato.nombre}
                      </p>
                      <p className="text-xs text-stone-400">
                        {item.plato.categoria.nombre}
                      </p>
                      {item.notas && (
                        <p className="mt-1.5 inline-block rounded-md bg-amber-100 px-2 py-0.5 text-sm font-medium text-amber-900">
                          {item.notas}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </Estructura>
  );
}