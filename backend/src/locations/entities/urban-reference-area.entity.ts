import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Áreas urbanas de referencia usadas para calcular la distancia del epicentro
 * a la ciudad (p. ej. el área metropolitana de La Paz). Solo se almacenan
 * geometrías oficiales verificadas; el proyecto no inventa límites.
 */
@Entity('urban_reference_areas')
export class UrbanReferenceArea {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  source: string;

  @Column({ type: 'geography', spatialFeatureType: 'MultiPolygon', srid: 4326 })
  area: string;
}
