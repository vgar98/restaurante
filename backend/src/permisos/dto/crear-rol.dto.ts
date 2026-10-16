import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

export class CrearRolDto {
  @IsString()
  nombre: string; // ej: 'mozo'

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsArray()
  permisosIds?: string[]; // opcional: puedes crear el rol y asignarle permisos después
}