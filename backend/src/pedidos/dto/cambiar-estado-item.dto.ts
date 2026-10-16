import { IsEnum } from 'class-validator';
import { EstadoItem } from '../../common/enums/estado-item.enum';

export class CambiarEstadoItemDto {
  @IsEnum(EstadoItem)
  estado: EstadoItem;
}