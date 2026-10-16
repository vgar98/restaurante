import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { Permiso } from './permiso.entity';
  
  @Entity('roles')
  export class Rol {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ unique: true })
    nombre: string; // ej: 'mozo', 'cocina', 'caja', 'admin'
  
    @Column({ nullable: true })
    descripcion: string;
  
    @ManyToMany(() => Permiso, { eager: true })
    @JoinTable({
      name: 'rol_permisos',
      joinColumn: { name: 'rolId', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'permisoId', referencedColumnName: 'id' },
    })
    permisos: Permiso[];
  }