import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.usuariosService.buscarPorUsuario(dto.usuario);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValido) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    // Juntamos todos los permisos de todos sus roles en una sola lista,
    // sin duplicados, para meterlos directo en el token.
    const permisos = [
      ...new Set(
        usuario.roles.flatMap((rol) => rol.permisos.map((p) => p.nombre)),
      ),
    ];

    const payload = {
      sub: usuario.id,
      usuario: usuario.usuario,
      permisos,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        usuario: usuario.usuario,
        roles: usuario.roles.map((r) => r.nombre),
        permisos,
      },
    };
  }
}