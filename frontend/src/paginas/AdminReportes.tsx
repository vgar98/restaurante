import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import Estructura from '../Estructura';
import {
  dinero,
  etiquetaPeriodo,
  hoyLima,
  primerDiaDelMes,
  sumarDias,
} from '../formato';
import MenuAdmin from '../MenuAdmin';
import type { ResumenVentas, VentaPeriodo } from '../tipos';

type Agrupar = 'dia' | 'mes';

const nombreMetodo: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  yape_plin: 'Yape / Plin',
};

const campo =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 sm:text-sm';

const plural = (n: number) => `${n} ${n === 1 ? 'pedido' : 'pedidos'}`;

const atajos: {
  texto: string;
  agrupar: Agrupar;
  rango: () => { desde: string; hasta: string };
}[] = [
  {
    texto: 'Últimos 7 días',
    agrupar: 'dia',
    rango: () => {
      const h = hoyLima();
      return { desde: sumarDias(h, -6), hasta: h };
    },
  },
  {
    texto: 'Este mes',
    agrupar: 'dia',
    rango: () => {
      const h = hoyLima();
      return { desde: primerDiaDelMes(h), hasta: h };
    },
  },
  {
    texto: 'Mes pasado',
    agrupar: 'dia',
    rango: () => {
      const fin = sumarDias(primerDiaDelMes(hoyLima()), -1);
      return { desde: primerDiaDelMes(fin), hasta: fin };
    },
  },
  {
    texto: 'Este año',
    agrupar: 'mes',
    rango: () => {
      const h = hoyLima();
      return { desde: `${h.slice(0, 4)}-01-01`, hasta: h };
    },
  },
];

function Desglose({ filas }: { filas: ResumenVentas['porMetodo'] }) {
  if (filas.length === 0) return null;
  return (
    <ul className="mt-4 space-y-1.5 border-t border-stone-100 pt-4">
      {filas.map((f) => (
        <li key={f.metodo} className="flex items-center justify-between text-sm">
          <span className="text-stone-500">
            {nombreMetodo[f.metodo] ?? f.metodo}
          </span>
          <span className="tabular-nums text-stone-700">{dinero(f.total)}</span>
        </li>
      ))}
    </ul>
  );
}

function TarjetaResumen({
  titulo,
  detalle,
  datos,
}: {
  titulo: string;
  detalle?: string;
  datos: ResumenVentas;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-stone-500">{titulo}</h2>
        {detalle && (
          <span className="text-right text-xs capitalize text-stone-400">
            {detalle}
          </span>
        )}
      </div>
      <p className="mt-2 text-4xl font-semibold tracking-tight">
        {dinero(datos.total)}
      </p>
      <p className="mt-1 text-sm text-stone-500">
        {plural(datos.pedidos)} · ticket promedio {dinero(datos.ticketPromedio)}
      </p>
      <Desglose filas={datos.porMetodo} />
    </section>
  );
}

export default function AdminReportes() {
  const [hoy, setHoy] = useState<ResumenVentas | null>(null);
  const [errorHoy, setErrorHoy] = useState('');
  const [agrupar, setAgrupar] = useState<Agrupar>('dia');
  const [desde, setDesde] = useState(() => sumarDias(hoyLima(), -6));
  const [hasta, setHasta] = useState(() => hoyLima());
  const [resumen, setResumen] = useState<ResumenVentas | null>(null);
  const [ventas, setVentas] = useState<VentaPeriodo[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const rangoInvalido = desde !== '' && hasta !== '' && desde > hasta;

  const cargarHoy = useCallback(async () => {
    try {
      setHoy(await api<ResumenVentas>('/reportes/resumen'));
      setErrorHoy('');
    } catch (err) {
      setErrorHoy(err instanceof Error ? err.message : 'Error inesperado');
    }
  }, []);

  useEffect(() => {
    cargarHoy();
    // La venta de hoy se refresca sola cada 30 segundos
    const intervalo = setInterval(cargarHoy, 30000);
    return () => clearInterval(intervalo);
  }, [cargarHoy]);

  useEffect(() => {
    if (!desde || !hasta || rangoInvalido) return;
    let cancelado = false;
    setCargando(true);
    const consulta = `desde=${desde}&hasta=${hasta}`;
    Promise.all([
      api<ResumenVentas>(`/reportes/resumen?${consulta}`),
      api<VentaPeriodo[]>(`/reportes/ventas?${consulta}&agrupar=${agrupar}`),
    ])
      .then(([r, v]) => {
        if (cancelado) return;
        setResumen(r);
        setVentas(v);
        setError('');
      })
      .catch((err) => {
        if (cancelado) return;
        setError(err instanceof Error ? err.message : 'Error inesperado');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [desde, hasta, agrupar, rangoInvalido]);

  function aplicarAtajo(a: (typeof atajos)[number]) {
    const r = a.rango();
    setDesde(r.desde);
    setHasta(r.hasta);
    setAgrupar(a.agrupar);
  }

  const maximo = Math.max(0, ...ventas.map((v) => v.total));
  const mensaje = rangoInvalido
    ? 'La fecha inicial no puede ser mayor que la final'
    : error;

  return (
    <Estructura titulo="Administración">
      <MenuAdmin />

      {errorHoy && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorHoy}
        </p>
      )}
      {hoy && (
        <div className="mb-8">
          <TarjetaResumen
            titulo="Venta de hoy"
            detalle={etiquetaPeriodo(hoy.desde, 'dia')}
            datos={hoy}
          />
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold tracking-tight">
        Ventas por período
      </h2>

      <div className="mb-3 flex gap-2">
        {(['dia', 'mes'] as Agrupar[]).map((a) => (
          <button
            key={a}
            onClick={() => setAgrupar(a)}
            className={`h-11 flex-1 rounded-full border px-4 text-sm font-medium transition sm:flex-none ${
              agrupar === a
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
            }`}
          >
            {a === 'dia' ? 'Por día' : 'Por mes'}
          </button>
        ))}
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto">
        {atajos.map((a) => (
          <button
            key={a.texto}
            onClick={() => aplicarAtajo(a)}
            className="h-11 shrink-0 rounded-full border border-stone-300 bg-white px-4 text-sm text-stone-700 transition hover:border-stone-500"
          >
            {a.texto}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="desde" className="text-sm font-medium text-stone-700">
            Desde
          </label>
          <input
            id="desde"
            type="date"
            className={campo}
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="hasta" className="text-sm font-medium text-stone-700">
            Hasta
          </label>
          <input
            id="hasta"
            type="date"
            className={campo}
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
      </div>

      {mensaje && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {mensaje}
        </p>
      )}

      {!rangoInvalido && (
        <div className={cargando ? 'opacity-50 transition' : 'transition'}>
          {resumen && (
            <div className="mb-4">
              <TarjetaResumen
                titulo="Total del período"
                detalle={`${etiquetaPeriodo(resumen.desde, 'dia')} – ${etiquetaPeriodo(resumen.hasta, 'dia')}`}
                datos={resumen}
              />
            </div>
          )}

          {ventas.length === 0 && !cargando ? (
            <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500">
              No hay ventas en este período.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
              {[...ventas].reverse().map((v) => (
                <li key={v.periodo} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm capitalize">
                      {etiquetaPeriodo(v.periodo, agrupar)}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {dinero(v.total)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-stone-900"
                      style={{
                        width: `${maximo > 0 ? (v.total / maximo) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-stone-400">
                    {plural(v.pedidos)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Estructura>
  );
}