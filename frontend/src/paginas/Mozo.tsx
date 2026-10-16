import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import Comanda from '../Comanda';
import Estructura from '../Estructura';
import type { Mesa } from '../tipos';

const estilos: Record<Mesa['estado'], string> = {
  libre: 'border-stone-200 bg-white hover:border-stone-400',
  ocupada: 'border-amber-300 bg-amber-50 hover:border-amber-400',
  por_cobrar: 'border-sky-300 bg-sky-50 hover:border-sky-400',
};

const etiquetas: Record<Mesa['estado'], string> = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  por_cobrar: 'Por cobrar',
};

export default function Mozo() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [seleccionada, setSeleccionada] = useState<Mesa | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      //setMesas(await api<Mesa[]>('/mesas'));
      setMesas(await api<Mesa[]>('/mesas?activas=true'));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    // Por ahora consultamos cada 5 segundos. Más adelante lo cambiamos
    // por avisos en tiempo real (WebSockets).
    const intervalo = setInterval(cargar, 5000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  return (
    <Estructura titulo="Mesas">
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-stone-500">Cargando mesas...</p>
      ) : mesas.length === 0 ? (
        <p className="text-sm text-stone-500">Todavía no hay mesas creadas.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {mesas.map((mesa) => (
            <button
              key={mesa.id}
              onClick={() => setSeleccionada(mesa)}
              className={`rounded-2xl border p-4 text-left transition ${estilos[mesa.estado]} ${
                seleccionada?.id === mesa.id ? 'ring-2 ring-stone-900' : ''
              }`}
            >
              <p className="text-2xl font-semibold tracking-tight">
                {mesa.numero}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {mesa.capacidad} personas
              </p>
              <p className="mt-3 text-xs font-medium text-stone-700">
                {etiquetas[mesa.estado]}
              </p>
            </button>
          ))}
        </div>
      )}

      {seleccionada && (
        <Comanda
          mesa={seleccionada}
          onCerrar={() => setSeleccionada(null)}
          onEnviado={cargar}
        />
      )}
    </Estructura>
  );
}