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
  import { ActualizarPlatoDto } from './dto/actualizar-plato.dto';
  import { CrearPlatoDto } from './dto/crear-plato.dto';
  import { PlatosService } from './platos.service';
  
  @Controller('platos')
  @UseGuards(JwtAuthGuard, PermisosGuard)
  export class PlatosController {
    constructor(private readonly service: PlatosService) {}
  
    @Post()
    @RequierePermiso('menu.editar')
    crear(@Body() dto: CrearPlatoDto) {
      return this.service.crear(dto);
    }
  
    // Cualquier usuario con sesión puede ver el menú
    @Get()
    listar(
      @Query('disponibles') disponibles?: string,
      @Query('categoriaId') categoriaId?: string,
    ) {
      const idCategoria = categoriaId ? parseInt(categoriaId, 10) : undefined;
      return this.service.listar(disponibles === 'true', idCategoria);
    }
  
    @Get(':id')
    buscar(@Param('id', ParseIntPipe) id: number) {
      return this.service.buscar(id);
    }
  
    @Patch(':id')
    @RequierePermiso('menu.editar')
    actualizar(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: ActualizarPlatoDto,
    ) {
      return this.service.actualizar(id, dto);
    }
  }