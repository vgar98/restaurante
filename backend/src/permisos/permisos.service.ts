import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AsignarPermisosDto } from './dto/asignar-permisos.dto';
import { CrearPermisoDto } from './dto/crear-permiso.dto';
import { CrearRolDto } from './dto/crear-rol.dto';
import { Permiso } from './permiso.entity';
import { Rol } from './rol.entity';

@Injectable()
export class PermisosService {
  constructor(
    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>,
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
  ) {}

  crearPermiso(dto: CrearPermisoDto): Promise<Permiso> {
    const permiso = this.permisoRepo.create(dto);
    return this.permisoRepo.save(permiso);
  }

  listarPermisos(): Promise<Permiso[]> {
    return this.permisoRepo.find({ order: { nombre: 'ASC' } });
  }

  async crearRol(dto: CrearRolDto): Promise<Rol> {
    let permisos: Permiso[] = [];
    if (dto.permisosIds?.length) {
      permisos = await this.permisoRepo.findBy({ id: In(dto.permisosIds) });
    }

    const rol = this.rolRepo.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      permisos,
    });
    return this.rolRepo.save(rol);
  }

  listarRoles(): Promise<Rol[]> {
    return this.rolRepo.find({ order: { nombre: 'ASC' } });
  }

  async buscarRol(id: string): Promise<Rol> {
    const rol = await this.rolRepo.findOne({ where: { id } });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    return rol;
  }

  async asignarPermisos(rolId: string, dto: AsignarPermisosDto): Promise<Rol> {
    const rol = await this.buscarRol(rolId);
    const permisos = await this.permisoRepo.findBy({ id: In(dto.permisosIds) });
    rol.permisos = permisos;
    return this.rolRepo.save(rol);
  }
}