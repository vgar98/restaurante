const moneda = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

export const dinero = (valor: number) => moneda.format(valor);

const ZONA = 'America/Lima';

// Fecha de hoy en Lima, como "2026-10-12"
export const hoyLima = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: ZONA });

function aFecha(texto: string): Date {
  const [anio, mes, dia] = texto.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

export function sumarDias(texto: string, dias: number): string {
  const fecha = aFecha(texto);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

export const primerDiaDelMes = (texto: string) => `${texto.slice(0, 7)}-01`;

export function etiquetaPeriodo(periodo: string, agrupar: 'dia' | 'mes') {
  if (agrupar === 'mes') {
    return aFecha(`${periodo}-01`).toLocaleDateString('es-PE', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }
  return aFecha(periodo).toLocaleDateString('es-PE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}