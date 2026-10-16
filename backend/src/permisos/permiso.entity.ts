import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('permisos')
export class Permiso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string; // ej: 'pedidos.crear', 'pedidos.cambiar_estado'

  @Column({ nullable: true })
  descripcion: string;
}