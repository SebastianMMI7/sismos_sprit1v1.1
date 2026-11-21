import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, type PublicUser } from './entities/user.entity';

/** RNF03: Bcrypt con factor de coste no menor a 12. */
export const PASSWORD_SALT_ROUNDS = 12;

export function toPublicUser(user: User): PublicUser {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();
    const role = dto.role ?? 'ciudadano';
    const professionalLicense = dto.professionalLicense?.trim() || null;

    await this.assertEmailAvailable(email);
    this.assertProfessionalLicense(role, professionalLicense);

    const user = this.usersRepository.create({
      fullName: dto.fullName.trim(),
      email,
      password: await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS),
      role,
      professionalLicense,
      isActive: true,
    });

    try {
      const saved = await this.usersRepository.save(user);
      return toPublicUser(saved);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Ya existe una cuenta registrada con ese correo electrónico.');
      }
      throw error;
    }
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    return user;
  }

  /** Incluye el hash de la contraseña solo para el proceso interno de autenticación. */
  findByEmailForAuth(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('lower(user.email) = :email', { email: email.trim().toLowerCase() })
      .getOne();
  }

  async verifyCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmailForAuth(email);
    if (!user || !user.isActive) {
      return null;
    }
    const matches = await bcrypt.compare(password, user.password);
    return matches ? user : null;
  }

  async update(id: string, dto: UpdateUserDto, actor: JwtPayload): Promise<PublicUser> {
    const user = await this.findOne(id);
    const isAdministrator = actor.role === 'administrador';

    if (!isAdministrator && dto.role !== undefined && dto.role !== user.role) {
      throw new ForbiddenException('Solo un administrador puede asignar perfiles técnicos.');
    }
    if (!isAdministrator && dto.isActive !== undefined && dto.isActive !== user.isActive) {
      throw new ForbiddenException('Solo un administrador puede habilitar o suspender cuentas.');
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      if (email !== user.email) {
        await this.assertEmailAvailable(email);
        user.email = email;
      }
    }
    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }
    if (dto.password !== undefined) {
      user.password = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
    }
    if (dto.role !== undefined) {
      user.role = dto.role;
    }
    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }
    if (dto.professionalLicense !== undefined) {
      user.professionalLicense = dto.professionalLicense.trim() || null;
    }

    this.assertProfessionalLicense(user.role, user.professionalLicense);

    try {
      const saved = await this.usersRepository.save(user);
      return toPublicUser(saved);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Ya existe una cuenta registrada con ese correo electrónico.');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    const result = await this.usersRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    return { id, deleted: true };
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta registrada con ese correo electrónico.');
    }
  }

  private assertProfessionalLicense(role: User['role'], professionalLicense: string | null): void {
    if (role === 'sismologo' && !professionalLicense) {
      throw new BadRequestException(
        'El perfil Sismólogo requiere registrar la acreditación o licencia profesional (RF5.03).',
      );
    }
  }
}
