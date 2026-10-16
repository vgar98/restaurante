import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'clave-de-desarrollo',
    });
  }

  async validate(payload: { sub: string }) {
    const usuario = await this.usuariosService.buscarPorId(payload.sub);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException();
    }
    const permisos = [
      ...new Set(
        usuario.roles.flatMap((rol) => rol.permisos.map((p) => p.nombre)),
      ),
    ];
    return {
      id: usuario.id,
      usuario: usuario.usuario,
      nombre: usuario.nombre,
      roles: usuario.roles.map((r) => r.nombre),
      permisos,
    };
  }
}