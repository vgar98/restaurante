import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { In, Repository } from 'typeorm';
  import { EstadoMesa } from '../common/enums/estado-mesa.enum';
  import { EstadoPedido } from '../common/enums/estado-pedido.enum';
  import { MesasService } from '../mesas/mesas.service';
  import { PlatosService } from '../platos/platos.service';
  import { AgregarItemsDto } from './dto/agregar-items.dto';
  import { CrearPedidoDto } from './dto/crear-pedido.dto';
  import { ItemPedidoDto } from './dto/item-pedido.dto';
  import { PedidoItem } from './pedido-item.entity';
  import { Pedido } from './pedido.entity';
  //agregados nuevos
  import { EstadoItem } from '../common/enums/estado-item.enum'; 
  import { CobrarPedidoDto } from './dto/cobrar-pedido.dto';
  //websocket
  import { PedidosGateway } from './pedidos.gateway';

  const PERMISO_POR_ESTADO: Record<EstadoItem, string> = {
    [EstadoItem.NUEVO]: 'pedidos.preparar',
    [EstadoItem.EN_PREPARACION]: 'pedidos.preparar',
    [EstadoItem.LISTO]: 'pedidos.preparar',
    [EstadoItem.ENTREGADO]: 'pedidos.entregar',
    [EstadoItem.CANCELADO]: 'pedidos.cancelar',
  };

  @Injectable()
  export class PedidosService {
    constructor(
      @InjectRepository(Pedido)
      private readonly pedidoRepo: Repository<Pedido>,
      @InjectRepository(PedidoItem)
      private readonly itemRepo: Repository<PedidoItem>,
      private readonly mesasService: MesasService,
      private readonly platosService: PlatosService,
      private readonly gateway: PedidosGateway,
    ) {}
  
    async abrir(dto: CrearPedidoDto, mozoId: string): Promise<Pedido> {
      //await this.mesasService.buscar(dto.mesaId);
      const mesa = await this.mesasService.buscar(dto.mesaId);
      if (!mesa.activa) {
        throw new BadRequestException(
          `La mesa ${mesa.numero} está deshabilitada`,
        );
      }

      const abierto = await this.pedidoRepo.findOne({
        where: { mesaId: dto.mesaId, estado: EstadoPedido.ABIERTO },
      });
      if (abierto) {
        throw new ConflictException(
          `La mesa ya tiene un pedido abierto (#${abierto.id}). Agrega los platos a ese pedido.`,
        );
      }
  
      const items = await this.armarItems(dto.items);
      const pedido = this.pedidoRepo.create({
        mesaId: dto.mesaId,
        mozoId,
        notasGenerales: dto.notasGenerales,
        items,
      });
      const guardado = await this.pedidoRepo.save(pedido);
  
      await this.mesasService.cambiarEstado(dto.mesaId, EstadoMesa.OCUPADA);
      return this.buscar(guardado.id);
    }
  
    async agregarItems(pedidoId: number, dto: AgregarItemsDto): Promise<Pedido> {
      const pedido = await this.buscar(pedidoId);
      if (pedido.estado !== EstadoPedido.ABIERTO) {
        throw new BadRequestException(
          'Solo se pueden agregar platos a un pedido abierto',
        );
      }
  
      const items = await this.armarItems(dto.items);
      for (const item of items) {
        item.pedidoId = pedido.id;
      }
      await this.itemRepo.save(items);
      return this.buscar(pedidoId);
    }
  
    async buscar(id: number): Promise<Pedido> {
      const pedido = await this.pedidoRepo.findOne({ where: { id } });
      if (!pedido) throw new NotFoundException('Pedido no encontrado');
      return pedido;
    }

    //nuevos
    listar(estado?: EstadoPedido): Promise<Pedido[]> {
        return this.pedidoRepo.find({
          where: estado ? { estado } : {},
          order: { creadoEn: 'ASC' },
        });
      }
    
      async cambiarEstadoItem(
        itemId: number,
        estado: EstadoItem,
        permisosUsuario: string[],
      ): Promise<Pedido> {
        const permisoNecesario = PERMISO_POR_ESTADO[estado];
        if (!permisosUsuario.includes(permisoNecesario)) {
          throw new ForbiddenException(
            `Necesitas el permiso "${permisoNecesario}" para marcar un plato como "${estado}"`,
          );
        }
    
        const item = await this.itemRepo.findOne({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Plato del pedido no encontrado');
    
        const pedido = await this.buscar(item.pedidoId);
        if (pedido.estado !== EstadoPedido.ABIERTO) {
          throw new BadRequestException('El pedido ya no está abierto');
        }
    
        await this.itemRepo.update(itemId, { estado });
        return this.buscar(pedido.id);
      }
    
      async cobrar(
        pedidoId: number,
        dto: CobrarPedidoDto,
        cajeroId: string,
      ): Promise<Pedido> {
        const pedido = await this.buscar(pedidoId);
        if (pedido.estado !== EstadoPedido.ABIERTO) {
          throw new BadRequestException('Este pedido ya no está abierto');
        }
        
        /*
        const pendientes = pedido.items.filter(
          (i) =>
            i.estado !== EstadoItem.ENTREGADO && i.estado !== EstadoItem.CANCELADO,
        );
        if (pendientes.length > 0) {
          throw new BadRequestException(
            `Aún hay ${pendientes.length} plato(s) sin entregar`,
          );
        }
        */
        const total = this.calcularTotal(pedido.items);
        if (total <= 0) {
          throw new BadRequestException('El pedido no tiene platos para cobrar');
        }

        //Nuevo 
            // Al cobrar, lo que siga pendiente se da por entregado
        await this.itemRepo.update(
          {
            pedidoId,
            estado: In([
              EstadoItem.NUEVO,
              EstadoItem.EN_PREPARACION,
              EstadoItem.LISTO,
            ]),
          },
          { estado: EstadoItem.ENTREGADO },
        );


        await this.pedidoRepo.update(pedidoId, {
          estado: EstadoPedido.PAGADO,
          total,
          metodoPago: dto.metodoPago,
          cobradoPorId: cajeroId,
          pagadoEn: new Date(),
        });
        await this.mesasService.cambiarEstado(pedido.mesaId, EstadoMesa.LIBRE);
        return this.buscar(pedidoId);
      }
    
      private calcularTotal(items: PedidoItem[]): number {
        const suma = items
          .filter((i) => i.estado !== EstadoItem.CANCELADO)
          .reduce((acc, i) => acc + Number(i.precioUnitario) * i.cantidad, 0);
        return Math.round(suma * 100) / 100;
      }
  
    // Convierte lo que manda el mozo (platoId + cantidad) en items listos
    // para guardar, tomando el precio vigente del menú.
    private async armarItems(itemsDto: ItemPedidoDto[]): Promise<PedidoItem[]> {
      const items: PedidoItem[] = [];
      for (const i of itemsDto) {
        const plato = await this.platosService.buscar(i.platoId);
        if (!plato.disponible) {
          throw new BadRequestException(`"${plato.nombre}" no está disponible`);
        }
        items.push(
          this.itemRepo.create({
            platoId: plato.id,
            cantidad: i.cantidad,
            precioUnitario: plato.precio,
            notas: i.notas,
          }),
        );
      }
      return items;
    }

     // Devuelve el pedido actualizado y avisa a los que están conectados
    private async conAviso(id: number): Promise<Pedido> {
      const pedido = await this.buscar(id);
      this.gateway.avisarCambio(pedido.id);
      return pedido;
    }
  }