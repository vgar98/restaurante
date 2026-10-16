import {
    ConflictException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { Categoria } from './categoria.entity';
  import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';
  import { CrearCategoriaDto } from './dto/crear-categoria.dto';
  
  @Injectable()
  export class CategoriasService {
    constructor(
      @InjectRepository(Categoria)
      private readonly repo: Repository<Categoria>,
    ) {}
  
    async crear(dto: CrearCategoriaDto): Promise<Categoria> {
      const nombre = dto.nombre.trim();
      await this.validarNombreLibre(nombre);
      return this.repo.save(this.repo.create({ nombre }));
    }
  
    listar(soloActivas = false): Promise<Categoria[]> {
      return this.repo.find({
        where: soloActivas ? { activa: true } : {},
        order: { nombre: 'ASC' },
      });
    }
  
    async buscar(id: number): Promise<Categoria> {
      const categoria = await this.repo.findOne({ where: { id } });
      if (!categoria) throw new NotFoundException('Categoría no encontrada');
      return categoria;
    }
  
    async actualizar(id: number, dto: ActualizarCategoriaDto): Promise<Categoria> {
      const categoria = await this.buscar(id);
  
      if (dto.nombre !== undefined) {
        const nombre = dto.nombre.trim();
        if (nombre.toLowerCase() !== categoria.nombre.toLowerCase()) {
          await this.validarNombreLibre(nombre);
        }
        categoria.nombre = nombre;
      }
      if (dto.activa !== undefined) {
        categoria.activa = dto.activa;
      }
      return this.repo.save(categoria);
    }
  
    private async validarNombreLibre(nombre: string): Promise<void> {
      const existente = await this.repo
        .createQueryBuilder('c')
        .where('LOWER(c.nombre) = LOWER(:nombre)', { nombre })
        .getOne();
      if (existente) {
        throw new ConflictException(`Ya existe la categoría "${existente.nombre}"`);
      }
    }
  }