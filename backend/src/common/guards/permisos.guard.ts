import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISO_KEY } from '../decorators/requiere-permiso.decorator';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permisoRequerido = this.reflector.getAllAndOverride<string>(
      PERMISO_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si la ruta no pidió ningún permiso con @RequierePermiso(...),
    // dejamos pasar a cualquier usuario autenticado.
    if (!permisoRequerido) return true;

    const { user } = context.switchToHttp().getRequest();
    return user?.permisos?.includes(permisoRequerido) ?? false;
  }
}