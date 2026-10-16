import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { Rol } from '../permisos/rol.entity';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { Usuario } from './usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
  ) {}

  async crear(dto: CrearUsuarioDto): Promise<Usuario> {
    const existente = await this.usuarioRepo.findOne({
      where: { usuario: dto.usuario },
    });
    if (existente) {
      throw new ConflictException('Ese nombre de usuario ya existe');
    }

    const roles = await this.cargarRoles(dto.rolesIds);
    const passwordEncriptada = await bcrypt.hash(dto.password, 10);

    const nuevoUsuario = this.usuarioRepo.create({
      nombre: dto.nombre,
      usuario: dto.usuario,
      password: passwordEncriptada,
      roles,
    });
    return this.usuarioRepo.save(nuevoUsuario);
  }

  listar(): Promise<Usuario[]> {
    return this.usuarioRepo.find({ order: { nombre: 'ASC' } });
  }

  buscarPorUsuario(usuario: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({ where: { usuario } });
  }

  buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({ where: { id } });
  }

  async actualizar(
    id: string,
    dto: ActualizarUsuarioDto,
    actorId: string,
  ): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // Evita que el administrador se deje sin acceso por accidente
    if (id === actorId && dto.activo === false) {
      throw new BadRequestException('No puedes deshabilitar tu propio usuario');
    }
    if (id === actorId && dto.rolesIds !== undefined) {
      throw new BadRequestException('No puedes cambiar tus propios roles');
    }

    if (dto.nombre !== undefined) usuario.nombre = dto.nombre.trim();
    if (dto.activo !== undefined) usuario.activo = dto.activo;
    if (dto.password) usuario.password = await bcrypt.hash(dto.password, 10);
    if (dto.rolesIds !== undefined) {
      usuario.roles = await this.cargarRoles(dto.rolesIds);
    }
    return this.usuarioRepo.save(usuario);
  }

  private async cargarRoles(ids: string[]): Promise<Rol[]> {
    const unicos = [...new Set(ids)];
    const roles = await this.rolRepo.findBy({ id: In(unicos) });
    if (roles.length !== unicos.length) {
      throw new BadRequestException('Alguno de los roles no existe');
    }
    return roles;
  }
}