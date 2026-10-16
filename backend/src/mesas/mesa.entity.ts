import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoMesa } from '../common/enums/estado-mesa.enum';

@Entity('mesas')
export class Mesa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  numero: number;

  @Column({ default: 4 })
  capacidad: number;

  @Column({ type: 'enum', enum: EstadoMesa, default: EstadoMesa.LIBRE })
  estado: EstadoMesa;

  @Column({ default: true })
  activa: boolean;
}