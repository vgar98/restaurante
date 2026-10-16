import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permiso } from './permiso.entity';
import { PermisosController } from './permisos.controller';
import { PermisosService } from './permisos.service';
import { Rol } from './rol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Permiso, Rol])],
  controllers: [PermisosController],
  providers: [PermisosService],
  exports: [PermisosService],
})
export class PermisosModule {}