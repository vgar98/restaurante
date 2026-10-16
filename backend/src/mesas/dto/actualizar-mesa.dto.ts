import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CrearMesaDto } from './crear-mesa.dto';

export class ActualizarMesaDto extends PartialType(CrearMesaDto) {
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}