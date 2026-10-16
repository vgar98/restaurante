import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

//@WebSocketGateway({ cors: { origin: '*' } })
const origenes = process.env.FRONTEND_URL?.split(',').map((o) => o.trim());
@WebSocketGateway({ cors: { origin: origenes?.length ? origenes : '*' } })
export class PedidosGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  // Solo entran usuarios con token válido y permiso para ver pedidos
  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      const payload = this.jwtService.verify<{ permisos: string[] }>(
        token ?? '',
      );
      if (!payload.permisos?.includes('pedidos.ver')) {
        throw new Error('Sin permiso');
      }
    } catch {
      client.disconnect(true);
    }
  }

  avisarCambio(pedidoId: number) {
    this.server.emit('pedidos:cambio', { pedidoId });
  }
}