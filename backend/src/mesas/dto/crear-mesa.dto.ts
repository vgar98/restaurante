import { IsInt, IsOptional, Min } from 'class-validator';

export class CrearMesaDto {
  @IsInt()
  @Min(1)
  numero: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacidad?: number;
}