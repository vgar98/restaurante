import {
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CrearUsuarioDto {
  @IsString()
  nombre: string;

  @IsString()
  @MinLength(3)
  usuario: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  rolesIds: string[];
}