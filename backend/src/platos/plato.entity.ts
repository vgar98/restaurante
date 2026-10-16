import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { Categoria } from '../categorias/categoria.entity';
  
  @Entity('platos')
  export class Plato {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    nombre: string;
  
    @Column({ nullable: true })
    descripcion: string;
  
    @Column('decimal', {
      precision: 8,
      scale: 2,
      transformer: {
        to: (valor: number) => valor,
        from: (valor: string) => parseFloat(valor),
      },
    })
    precio: number;
  
    @ManyToOne(() => Categoria, { eager: true })
    @JoinColumn({ name: 'categoriaId' })
    categoria: Categoria;
  
    @Column()
    categoriaId: number;
  
    @Column({ default: true })
    disponible: boolean;
  }