import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { USER_ROLES, type UserRole } from '../../common/roles';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'La contraseña debe tener al menos 10 caracteres.' })
  @MaxLength(72)
  @Matches(/[A-Za-z]/, { message: 'La contraseña debe incluir al menos una letra.' })
  @Matches(/\d/, { message: 'La contraseña debe incluir al menos un número.' })
  password?: string;

  @IsOptional()
  @IsIn(USER_ROLES, { message: 'El perfil debe ser ciudadano, sismologo o administrador.' })
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  professionalLicense?: string;
}
