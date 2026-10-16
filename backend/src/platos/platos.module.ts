import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasModule } from '../categorias/categorias.module';
import { Plato } from './plato.entity';
import { PlatosController } from './platos.controller';
import { PlatosService } from './platos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Plato]), CategoriasModule],
  controllers: [PlatosController],
  providers: [PlatosService],
  exports: [PlatosService],
})
export class PlatosModule {}