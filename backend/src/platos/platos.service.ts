import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { FindOptionsWhere, Repository } from 'typeorm';
  import { CategoriasService } from '../categorias/categorias.service';
  import { ActualizarPlatoDto } from './dto/actualizar-plato.dto';
  import { CrearPlatoDto } from './dto/crear-plato.dto';
  import { Plato } from './plato.entity';
  
  @Injectable()
  export class PlatosService {
    constructor(
      @InjectRepository(Plato)
      private readonly repo: Repository<Plato>,
      private readonly categoriasService: CategoriasService,
    ) {}
  
    async crear(dto: CrearPlatoDto): Promise<Plato> {
      await this.validarCategoria(dto.categoriaId);
      const guardado = await this.repo.save(this.repo.create(dto));
      return this.buscar(guardado.id);
    }
  
    listar(soloDisponibles = false, categoriaId?: number): Promise<Plato[]> {
      const where: FindOptionsWhere<Plato> = {};
      if (soloDisponibles) where.disponible = true;
      if (categoriaId) where.categoriaId = categoriaId;
      return this.repo.find({ where, order: { nombre: 'ASC' } });
    }
  
    async buscar(id: number): Promise<Plato> {
      const plato = await this.repo.findOne({ where: { id } });
      if (!plato) throw new NotFoundException('Plato no encontrado');
      return plato;
    }
  
    async actualizar(id: number, dto: ActualizarPlatoDto): Promise<Plato> {
      const plato = await this.buscar(id);
      if (dto.categoriaId !== undefined && dto.categoriaId !== plato.categoriaId) {
        await this.validarCategoria(dto.categoriaId);
      }
      await this.repo.update(id, dto);
      return this.buscar(id);
    }
  
    private async validarCategoria(categoriaId: number): Promise<void> {
      const categoria = await this.categoriasService.buscar(categoriaId);
      if (!categoria.activa) {
        throw new BadRequestException(
          `La categoría "${categoria.nombre}" está desactivada`,
        );
      }
    }
  }