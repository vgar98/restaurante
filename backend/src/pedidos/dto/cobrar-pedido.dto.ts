import { IsEnum } from 'class-validator';
import { MetodoPago } from '../../common/enums/metodo-pago.enum';

export class CobrarPedidoDto {
  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;
}