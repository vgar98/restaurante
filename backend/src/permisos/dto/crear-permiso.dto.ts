import { IsOptional, IsString } from 'class-validator';

export class CrearPermisoDto {
  @IsString()
  nombre: string; // ej: 'pedidos.crear'

  @IsOptional()
  @IsString()
  descripcion?: string;
}