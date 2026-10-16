import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { EstadoItem } from '../common/enums/estado-item.enum';
  import { decimalTransformer } from '../common/transformers/decimal.transformer';
  import { Plato } from '../platos/plato.entity';
  import { Pedido } from './pedido.entity';
  
  @Entity('pedido_items')
  export class PedidoItem {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => Pedido, (pedido) => pedido.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pedidoId' })
    pedido: Pedido;
  
    @Column()
    pedidoId: number;
  
    @ManyToOne(() => Plato, { eager: true })
    @JoinColumn({ name: 'platoId' })
    plato: Plato;
  
    @Column()
    platoId: number;
  
    @Column({ default: 1 })
    cantidad: number;
  
    // Precio del plato EN EL MOMENTO de pedirlo. Si mañana sube el precio
    // en el menú, este pedido no cambia.
    @Column('decimal', {
      precision: 8,
      scale: 2,
      transformer: decimalTransformer,
    })
    precioUnitario: number;
  
    @Column({ nullable: true })
    notas: string;
  
    @Column({ type: 'enum', enum: EstadoItem, default: EstadoItem.NUEVO })
    estado: EstadoItem;
  
    @CreateDateColumn({ type: 'timestamptz' })
    creadoEn: Date;
  }