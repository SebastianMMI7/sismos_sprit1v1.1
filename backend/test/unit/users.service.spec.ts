import { BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { Repository } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import { UsersService } from '../../src/users/users.service';

type RepositoryMock = {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  delete: jest.Mock;
  createQueryBuilder: jest.Mock;
};

function createRepositoryMock(): RepositoryMock {
  return {
    create: jest.fn((value: Partial<User>) => value),
    save: jest.fn(async (value: Partial<User>) => ({
      ...value,
      id: '11111111-1111-1111-1111-111111111111',
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
}

function buildService(repository: RepositoryMock): UsersService {
  return new UsersService(repository as unknown as Repository<User>);
}

describe('UsersService', () => {
  it('crea la cuenta con la contraseña cifrada y sin exponer el hash', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue(null);
    const service = buildService(repository);

    const result = await service.create({
      fullName: 'Ana Quispe',
      email: 'ANA@Example.com ',
      password: 'Sismo2026seguro',
      role: 'ciudadano',
    });

    expect(result.email).toBe('ana@example.com');
    expect(result).not.toHaveProperty('password');

    const stored = repository.save.mock.calls[0][0] as User;
    expect(stored.password).not.toBe('Sismo2026seguro');
    await expect(bcrypt.compare('Sismo2026seguro', stored.password)).resolves.toBe(true);
  });

  it('rechaza un correo ya registrado', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue({ id: 'existente' });
    const service = buildService(repository);

    await expect(
      service.create({
        fullName: 'Ana Quispe',
        email: 'ana@example.com',
        password: 'Sismo2026seguro',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('exige licencia profesional al perfil sismólogo', async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue(null);
    const service = buildService(repository);

    await expect(
      service.create({
        fullName: 'Carlos Mamani',
        email: 'carlos@example.com',
        password: 'Sismo2026seguro',
        role: 'sismologo',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida las credenciales incluyendo el hash de la contraseña', async () => {
    const repository = createRepositoryMock();
    const password = await bcrypt.hash('Sismo2026seguro', 4);
    const user = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'ana@example.com',
      password,
      role: 'ciudadano',
      isActive: true,
    } as User;

    const queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(user),
    };
    repository.createQueryBuilder.mockReturnValue(queryBuilder);
    const service = buildService(repository);

    await expect(service.verifyCredentials('ana@example.com', 'Sismo2026seguro')).resolves.toBe(user);
    await expect(service.verifyCredentials('ana@example.com', 'incorrecta')).resolves.toBeNull();
  });
});
