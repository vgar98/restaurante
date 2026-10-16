import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
  } from 'class-validator';
  
  export class ActualizarUsuarioDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    nombre?: string;
  
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;
  
    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('all', { each: true })
    rolesIds?: string[];
  
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
  }