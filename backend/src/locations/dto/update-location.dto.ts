import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { LOCATION_TYPES, type LocationType } from '../entities/location.entity';

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(LOCATION_TYPES, { message: 'El tipo debe ser municipio o macrodistrito.' })
  type?: LocationType;
}
