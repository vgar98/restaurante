import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ItemPedidoDto {
  @IsInt()
  @Min(1)
  platoId: number;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsOptional()
  @IsString()
  notas?: string;
}