import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MesasModule } from '../mesas/mesas.module';
import { PlatosModule } from '../platos/platos.module';
import { PedidoItem } from './pedido-item.entity';
import { Pedido } from './pedido.entity';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';

import { AuthModule } from '../auth/auth.module';
import { PedidosGateway } from './pedidos.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, PedidoItem]),
    MesasModule,
    PlatosModule,
    AuthModule,
  ],
  controllers: [PedidosController],
  providers: [PedidosService, PedidosGateway],
})
export class PedidosModule {}