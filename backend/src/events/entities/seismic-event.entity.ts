import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Location } from '../../locations/entities/location.entity';

export const MAGNITUDE_TYPES = ['Mw', 'Ml'] as const;

export type MagnitudeType = (typeof MAGNITUDE_TYPES)[number];

/**
 * Catálogo sísmico. La columna `epicenter` es `geography(Point, 4326)`
 * (PostGIS) y se escribe con ST_MakePoint desde el servicio.
 */
@Entity('seismic_events')
export class SeismicEvent {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @Column({ type: 'numeric', precision: 3, scale: 1 })
  magnitude: string;

  @Column({ name: 'magnitude_type', type: 'text' })
  magnitudeType: MagnitudeType;

  @Column({ name: 'depth_km', type: 'numeric', precision: 7, scale: 2 })
  depthKm: string;

  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  epicenter: string;

  @ManyToOne(() => Location, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'location_id' })
  location: Location | null;

  @Column({ type: 'text' })
  source: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
