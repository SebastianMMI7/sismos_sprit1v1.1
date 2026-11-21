import { Column, Entity, PrimaryColumn } from 'typeorm';

export const LOCATION_TYPES = ['municipio', 'macrodistrito'] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

@Entity('locations')
export class Location {
  /** Identificador estable usado por los filtros (ej. "la-paz"). */
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  type: LocationType;

  /** Departamento al que pertenece la etiqueta; el catálogo público usa La Paz. */
  @Column({ type: 'text', default: 'La Paz' })
  department: string;
}
