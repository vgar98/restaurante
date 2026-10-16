import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CrearPlatoDto } from './crear-plato.dto';

export class ActualizarPlatoDto extends PartialType(CrearPlatoDto) {
  @IsOptional()
  @IsBoolean()
  disponible?: boolean;
}