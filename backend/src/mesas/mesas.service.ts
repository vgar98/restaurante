import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoMesa } from '../common/enums/estado-mesa.enum';
import { ActualizarMesaDto } from './dto/actualizar-mesa.dto';
import { CrearMesaDto } from './dto/crear-mesa.dto';
import { Mesa } from './mesa.entity';

@Injectable()
export class MesasService {
  constructor(
    @InjectRepository(Mesa)
    private readonly repo: Repository<Mesa>,
  ) {}

  async crear(dto: CrearMesaDto): Promise<Mesa> {
    const existente = await this.repo.findOne({
      where: { numero: dto.numero },
    });
    if (existente) {
      throw new ConflictException(`Ya existe la mesa ${dto.numero}`);
    }
    const mesa = this.repo.create(dto);
    return this.repo.save(mesa);
  }

  listar(soloActivas = false): Promise<Mesa[]> {
    return this.repo.find({
      where: soloActivas ? { activa: true } : {},
      order: { numero: 'ASC' },
    });
  }

  async buscar(id: number): Promise<Mesa> {
    const mesa = await this.repo.findOne({ where: { id } });
    if (!mesa) throw new NotFoundException('Mesa no encontrada');
    return mesa;
  }

  async cambiarEstado(id: number, estado: EstadoMesa): Promise<Mesa> {
    const mesa = await this.buscar(id);
    mesa.estado = estado;
    return this.repo.save(mesa);
  }

  async actualizar(id: number, dto: ActualizarMesaDto): Promise<Mesa> {
    const mesa = await this.buscar(id);

    if (dto.numero !== undefined && dto.numero !== mesa.numero) {
      const existente = await this.repo.findOne({
        where: { numero: dto.numero },
      });
      if (existente) {
        throw new ConflictException(`Ya existe la mesa ${dto.numero}`);
      }
    }

    if (dto.activa === false && mesa.estado !== EstadoMesa.LIBRE) {
      throw new BadRequestException(
        'No puedes deshabilitar una mesa que tiene un pedido abierto',
      );
    }

    await this.repo.update(id, dto);
    return this.buscar(id);
  }
}