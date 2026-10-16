import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../pedidos/pedido.entity';
import { ConsultaReporteDto } from './dto/consulta-reporte.dto';

// Las ventas se cuentan por día de Lima, no por el del servidor.
// Perú no usa horario de verano, así que el desfase es siempre -05:00.
const ZONA = 'America/Lima';
const DESFASE = '-05:00';
const MS_DIA = 24 * 60 * 60 * 1000;

const fechaLima = (fecha: Date) =>
  fecha.toLocaleDateString('en-CA', { timeZone: ZONA });

const redondear = (n: number) => Math.round(n * 100) / 100;

// Convierte "2026-10-12" en el instante en que empieza ese día en Lima
function inicioDelDia(texto: string): Date {
  const fecha = new Date(`${texto}T00:00:00${DESFASE}`);
  if (Number.isNaN(fecha.getTime()) || fechaLima(fecha) !== texto) {
    throw new BadRequestException(`La fecha "${texto}" no es válida`);
  }
  return fecha;
}

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
  ) {}

  async resumen(consulta: ConsultaReporteDto) {
    const { desde, hasta, inicio, fin } = this.rango(
      consulta.desde,
      consulta.hasta,
    );

    const filas: { metodo: string; monto: string; cantidad: string }[] =
      await this.pedidoRepo.query(
        `SELECT "metodoPago"::text AS metodo,
                COALESCE(SUM("total"), 0) AS monto,
                COUNT(*) AS cantidad
           FROM pedidos
          WHERE "estado" = 'pagado'
            AND "pagadoEn" >= $1 AND "pagadoEn" < $2
          GROUP BY "metodoPago"
          ORDER BY monto DESC`,
        [inicio, fin],
      );

    const porMetodo = filas.map((f) => ({
      metodo: f.metodo,
      total: Number(f.monto),
      pedidos: Number(f.cantidad),
    }));
    const total = redondear(porMetodo.reduce((s, f) => s + f.total, 0));
    const pedidos = porMetodo.reduce((s, f) => s + f.pedidos, 0);

    return {
      desde,
      hasta,
      total,
      pedidos,
      ticketPromedio: pedidos > 0 ? redondear(total / pedidos) : 0,
      porMetodo,
    };
  }

  async ventas(consulta: ConsultaReporteDto) {
    const agrupar = consulta.agrupar ?? 'dia';
    const { inicio, fin, dias } = this.rango(consulta.desde, consulta.hasta);

    if (agrupar === 'dia' && dias > 366) {
      throw new BadRequestException(
        'Por día el rango máximo es de 366 días. Usa la vista por mes.',
      );
    }

    // Constante nuestra, nunca viene del usuario
    const formato = agrupar === 'mes' ? 'YYYY-MM' : 'YYYY-MM-DD';

    const filas: { periodo: string; monto: string; cantidad: string }[] =
      await this.pedidoRepo.query(
        `SELECT TO_CHAR("pagadoEn" AT TIME ZONE '${ZONA}', '${formato}') AS periodo,
                COALESCE(SUM("total"), 0) AS monto,
                COUNT(*) AS cantidad
           FROM pedidos
          WHERE "estado" = 'pagado'
            AND "pagadoEn" >= $1 AND "pagadoEn" < $2
          GROUP BY periodo
          ORDER BY periodo`,
        [inicio, fin],
      );

    return filas.map((f) => ({
      periodo: f.periodo,
      total: Number(f.monto),
      pedidos: Number(f.cantidad),
    }));
  }

  // Sin fechas: hoy. Solo "desde": hasta hoy. Solo "hasta": ese único día.
  private rango(desde?: string, hasta?: string) {
    const hoy = fechaLima(new Date());
    const d = desde ?? hasta ?? hoy;
    const h = hasta ?? hoy;

    const inicio = inicioDelDia(d);
    const ultimo = inicioDelDia(h);
    if (inicio.getTime() > ultimo.getTime()) {
      throw new BadRequestException(
        'La fecha inicial no puede ser mayor que la final',
      );
    }
    // Fin exclusivo: el instante en que empieza el día siguiente
    const fin = new Date(ultimo.getTime() + MS_DIA);
    const dias = Math.round((fin.getTime() - inicio.getTime()) / MS_DIA);
    return { desde: d, hasta: h, inicio, fin, dias };
  }
}