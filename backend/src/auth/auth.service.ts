import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { CreateUserDto } from '../users/dto/create-user.dto';
import type { PublicUser } from '../users/entities/user.entity';
import { toPublicUser, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

export interface LoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{ user: PublicUser }> {
    // El auto-registro público siempre crea cuentas ciudadanas: los perfiles
    // técnicos solo los asigna un administrador (RF5.03).
    const user = await this.usersService.create({
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      password: createUserDto.password,
      role: 'ciudadano',
    });
    return { user };
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const user = await this.usersService.verifyCredentials(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Correo electrónico o contraseña incorrectos.');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') ?? '60m',
      user: toPublicUser(user),
    };
  }

  async profile(userId: string): Promise<PublicUser> {
    return toPublicUser(await this.usersService.findOne(userId));
  }
}
