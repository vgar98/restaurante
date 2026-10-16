import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
  } from '@nestjs/common';
  import { AsignarPermisosDto } from './dto/asignar-permisos.dto';
  import { CrearPermisoDto } from './dto/crear-permiso.dto';
  import { CrearRolDto } from './dto/crear-rol.dto';
  import { PermisosService } from './permisos.service';
  //nuevo
  import { RequierePermiso } from '../common/decorators/requiere-permiso.decorator';
  import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
  import { PermisosGuard } from '../common/guards/permisos.guard';

  @Controller()
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequierePermiso('usuarios.gestionar')
  export class PermisosController {
    constructor(private readonly service: PermisosService) {}
  
    @Post('permisos')
    crearPermiso(@Body() dto: CrearPermisoDto) {
      return this.service.crearPermiso(dto);
    }
  
    @Get('permisos')
    listarPermisos() {
      return this.service.listarPermisos();
    }
  
    @Post('roles')
    crearRol(@Body() dto: CrearRolDto) {
      return this.service.crearRol(dto);
    }
  
    @Get('roles')
    listarRoles() {
      return this.service.listarRoles();
    }
  
    @Get('roles/:id')
    buscarRol(@Param('id') id: string) {
      return this.service.buscarRol(id);
    }
  
    @Patch('roles/:id/permisos')
    asignarPermisos(@Param('id') id: string, @Body() dto: AsignarPermisosDto) {
      return this.service.asignarPermisos(id, dto);
    }
  }