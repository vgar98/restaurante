import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CrearCategoriaDto } from './crear-categoria.dto';

export class ActualizarCategoriaDto extends PartialType(CrearCategoriaDto) {
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}