import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { EstadoPedido } from '../common/enums/estado-pedido.enum';
  import { MetodoPago } from '../common/enums/metodo-pago.enum';
  import { decimalTransformer } from '../common/transformers/decimal.transformer';
  import { Mesa } from '../mesas/mesa.entity';
  import { Usuario } from '../usuarios/usuario.entity';
  import { PedidoItem } from './pedido-item.entity';
  
  @Entity('pedidos')
  export class Pedido {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => Mesa, { eager: true })
    @JoinColumn({ name: 'mesaId' })
    mesa: Mesa;
  
    @Column()
    mesaId: number;
  
    // El mozo que abrió el pedido. Su id es UUID, porque Usuario usa UUID.
    @ManyToOne(() => Usuario)
    @JoinColumn({ name: 'mozoId' })
    mozo: Usuario;
  
    @Column('uuid')
    mozoId: string;
  
    @OneToMany(() => PedidoItem, (item) => item.pedido, {
      eager: true,
      cascade: true,
    })
    items: PedidoItem[];
  
    @Column({
      type: 'enum',
      enum: EstadoPedido,
      default: EstadoPedido.ABIERTO,
    })
    estado: EstadoPedido;
  
    @Column({ nullable: true })
    notasGenerales: string;
  
    // Los datos de cobro se llenan recién cuando caja cobra
    @Column('decimal', {
      precision: 10,
      scale: 2,
      nullable: true,
      transformer: decimalTransformer,
    })
    total: number;
  
    @Column({ type: 'enum', enum: MetodoPago, nullable: true })
    metodoPago: MetodoPago;
  
    @Column('uuid', { nullable: true })
    cobradoPorId: string;
  
    @Column({ type: 'timestamptz', nullable: true })
    pagadoEn: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    creadoEn: Date;
  }