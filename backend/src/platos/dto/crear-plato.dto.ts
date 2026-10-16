import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CrearPlatoDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio: number;

  @IsInt()
  @Min(1)
  categoriaId: number;
}