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
  import { CategoriasService } from './categorias.service';
  import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';
  import { CrearCategoriaDto } from './dto/crear-categoria.dto';
  
  @Controller('categorias')
  @UseGuards(JwtAuthGuard, PermisosGuard)
  export class CategoriasController {
    constructor(private readonly service: CategoriasService) {}
  
    @Post()
    @RequierePermiso('menu.editar')
    crear(@Body() dto: CrearCategoriaDto) {
      return this.service.crear(dto);
    }
  
    // Cualquier usuario con sesión puede ver las categorías (el mozo las necesita)
    @Get()
    listar(@Query('activas') activas?: string) {
      return this.service.listar(activas === 'true');
    }
  
    @Patch(':id')
    @RequierePermiso('menu.editar')
    actualizar(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: ActualizarCategoriaDto,
    ) {
      return this.service.actualizar(id, dto);
    }
  }