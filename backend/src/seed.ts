import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PermisosService } from './permisos/permisos.service';
import { UsuariosService } from './usuarios/usuarios.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usuarios = app.get(UsuariosService);
  const permisos = app.get(PermisosService);

  const existente = await usuarios.buscarPorUsuario('admin');
  if (existente) {
    console.log('El usuario admin ya existe, no se crea de nuevo.');
    await app.close();
    return;
  }

  const roles = await permisos.listarRoles();
  const rolAdmin = roles.find((r) => r.nombre === 'admin');
  if (!rolAdmin) {
    console.log('No existe el rol "admin". Créalo primero con POST /roles.');
    await app.close();
    return;
  }

  await usuarios.crear({
    nombre: 'Administrador',
    usuario: 'admin',
    password: 'admin123',
    rolesIds: [rolAdmin.id],
  });

  console.log('Usuario admin creado correctamente.');
  await app.close();
}

seed();