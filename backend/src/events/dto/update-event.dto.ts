import { Type } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MAGNITUDE_TYPES, type MagnitudeType } from '../entities/seismic-event.entity';

export class UpdateEventDto {
  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'La fecha y hora debe estar en formato ISO 8601 (UTC).' })
  occurredAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  magnitude?: number;

  @IsOptional()
  @IsIn(MAGNITUDE_TYPES, { message: 'El tipo de magnitud debe ser Mw o Ml.' })
  magnitudeType?: MagnitudeType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(700)
  depthKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  locationId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  source?: string;

  @IsOptional()
  @Matches(/^[A-Za-z0-9._:-]{4,64}$/, {
    message: 'El identificador solo admite letras, números, punto, guion, guion bajo y dos puntos.',
  })
  id?: string;
}
