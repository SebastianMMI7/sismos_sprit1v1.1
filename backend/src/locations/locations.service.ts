import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23503';
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationsRepository: Repository<Location>,
  ) {}

  findAll(): Promise<Location[]> {
    return this.locationsRepository.find({
      where: { department: 'La Paz' },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locationsRepository.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException('Ubicación no encontrada.');
    }
    return location;
  }

  async create(createLocationDto: CreateLocationDto): Promise<Location> {
    const id = createLocationDto.id ?? slugify(createLocationDto.name);
    if (!id) {
      throw new ConflictException('No fue posible generar un identificador para la ubicación.');
    }

    const existing = await this.locationsRepository.findOne({ where: { id } });
    if (existing) {
      throw new ConflictException('Ya existe una ubicación con ese identificador.');
    }

    const duplicate = await this.locationsRepository.findOne({
      where: { name: createLocationDto.name.trim(), type: createLocationDto.type },
    });
    if (duplicate) {
      throw new ConflictException('Ya existe una ubicación con ese nombre y tipo.');
    }

    const location = this.locationsRepository.create({
      id,
      name: createLocationDto.name.trim(),
      type: createLocationDto.type,
      department: 'La Paz',
    });
    return this.locationsRepository.save(location);
  }

  async update(id: string, updateLocationDto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOne(id);

    if (updateLocationDto.name !== undefined) {
      location.name = updateLocationDto.name.trim();
    }
    if (updateLocationDto.type !== undefined) {
      location.type = updateLocationDto.type;
    }

    const duplicate = await this.locationsRepository.findOne({
      where: { name: location.name, type: location.type },
    });
    if (duplicate && duplicate.id !== location.id) {
      throw new ConflictException('Ya existe una ubicación con ese nombre y tipo.');
    }

    return this.locationsRepository.save(location);
  }

  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    try {
      const result = await this.locationsRepository.delete({ id });
      if (!result.affected) {
        throw new NotFoundException('Ubicación no encontrada.');
      }
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ConflictException('La ubicación tiene eventos sísmicos asociados y no puede eliminarse.');
      }
      throw error;
    }
    return { id, deleted: true };
  }
}
