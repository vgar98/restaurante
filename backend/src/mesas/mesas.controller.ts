import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequierePermiso } from '../common/decorators/requiere-permiso.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { ActualizarMesaDto } from './dto/actualizar-mesa.dto';
import { CrearMesaDto } from './dto/crear-mesa.dto';
import { MesasService } from './mesas.service';

@Controller('mesas')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class MesasController {
  constructor(private readonly service: MesasService) {}

  @Post()
  @RequierePermiso('mesas.gestionar')
  crear(@Body() dto: CrearMesaDto) {
    return this.service.crear(dto);
  }

  // Sin permiso especial: el mozo la usa con ?activas=true
  @Get()
  listar(@Query('activas') activas?: string) {
    return this.service.listar(activas === 'true');
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscar(id);
  }

  @Patch(':id')
  @RequierePermiso('mesas.gestionar')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarMesaDto,
  ) {
    return this.service.actualizar(id, dto);
  }
}