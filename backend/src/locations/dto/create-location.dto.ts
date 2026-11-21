import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { LOCATION_TYPES, type LocationType } from '../entities/location.entity';

export class CreateLocationDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]{2,50}$/, {
    message: 'El identificador debe usar minúsculas, números y guiones (ej. la-paz).',
  })
  id?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsIn(LOCATION_TYPES, { message: 'El tipo debe ser municipio o macrodistrito.' })
  type: LocationType;
}
