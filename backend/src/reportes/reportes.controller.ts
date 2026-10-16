import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequierePermiso } from '../common/decorators/requiere-permiso.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { ConsultaReporteDto } from './dto/consulta-reporte.dto';
import { ReportesService } from './reportes.service';

@Controller('reportes')
@UseGuards(JwtAuthGuard, PermisosGuard)
@RequierePermiso('reportes.ver')
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  // Total, cantidad de pedidos, ticket promedio y desglose por método de pago
  @Get('resumen')
  resumen(@Query() consulta: ConsultaReporteDto) {
    return this.service.resumen(consulta);
  }

  // Una fila por día o por mes
  @Get('ventas')
  ventas(@Query() consulta: ConsultaReporteDto) {
    return this.service.ventas(consulta);
  }
}