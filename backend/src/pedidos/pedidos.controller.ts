import {
    BadRequestException,
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
  import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';
  import { EstadoPedido } from '../common/enums/estado-pedido.enum';
  import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
  import { PermisosGuard } from '../common/guards/permisos.guard';
  import { AgregarItemsDto } from './dto/agregar-items.dto';
  import { CambiarEstadoItemDto } from './dto/cambiar-estado-item.dto';
  import { CobrarPedidoDto } from './dto/cobrar-pedido.dto';
  import { CrearPedidoDto } from './dto/crear-pedido.dto';
  import { PedidosService } from './pedidos.service';
  
  @Controller('pedidos')
  @UseGuards(JwtAuthGuard, PermisosGuard)
  export class PedidosController {
    constructor(private readonly service: PedidosService) {}
  
    // Tomar la comanda: abre el pedido de la mesa
    @Post()
    @RequierePermiso('pedidos.crear')
    abrir(@Body() dto: CrearPedidoDto, @UsuarioActual('id') mozoId: string) {
      return this.service.abrir(dto, mozoId);
    }
  
    // Si piden algo más: se agrega al mismo pedido
    @Post(':id/items')
    @RequierePermiso('pedidos.crear')
    agregarItems(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: AgregarItemsDto,
    ) {
      return this.service.agregarItems(id, dto);
    }
  
    @Get()
    @RequierePermiso('pedidos.ver')
    listar(@Query('estado') estado?: string) {
      if (estado && !Object.values(EstadoPedido).includes(estado as EstadoPedido)) {
        throw new BadRequestException(
          `Estado inválido. Usa: ${Object.values(EstadoPedido).join(', ')}`,
        );
      }
      return this.service.listar(estado as EstadoPedido | undefined);
    }
  
    @Get(':id')
    @RequierePermiso('pedidos.ver')
    buscar(@Param('id', ParseIntPipe) id: number) {
      return this.service.buscar(id);
    }
  
    // Cambiar el estado de UN plato. El permiso necesario depende del estado
    // al que se quiere pasar, y lo revisa el servicio.
    @Patch('items/:itemId/estado')
    cambiarEstadoItem(
      @Param('itemId', ParseIntPipe) itemId: number,
      @Body() dto: CambiarEstadoItemDto,
      @UsuarioActual('permisos') permisos: string[],
    ) {
      return this.service.cambiarEstadoItem(itemId, dto.estado, permisos);
    }
  
    @Post(':id/cobrar')
    @RequierePermiso('pedidos.cobrar')
    cobrar(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: CobrarPedidoDto,
      @UsuarioActual('id') cajeroId: string,
    ) {
      return this.service.cobrar(id, dto, cajeroId);
    }
  }