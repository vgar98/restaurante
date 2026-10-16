import { ArrayMinSize, IsArray } from 'class-validator';

export class AsignarPermisosDto {
  @IsArray()
  @ArrayMinSize(1)
  permisosIds: string[];
}