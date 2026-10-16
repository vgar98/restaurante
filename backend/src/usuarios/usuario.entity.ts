import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { Rol } from '../permisos/rol.entity';
  import { Exclude } from 'class-transformer';

  @Entity('usuarios')
  export class Usuario {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    nombre: string;
  
    @Column({ unique: true })
    usuario: string; // nombre con el que inicia sesión
  
    @Exclude()
    @Column()
    password: string; // se guarda encriptada (hash), nunca en texto plano
  
    @ManyToMany(() => Rol, { eager: true })
    @JoinTable({
      name: 'usuario_roles',
      joinColumn: { name: 'usuarioId', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'rolId', referencedColumnName: 'id' },
    })
    roles: Rol[];
  
    @Column({ default: true })
    activo: boolean;
  
    @CreateDateColumn()
    creadoEn: Date;
  }