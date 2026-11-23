import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('fuentes_sismicas')
export class FuenteSismica {
  @PrimaryGeneratedColumn({ name: 'id_fuente', type: 'int' })
  idFuente: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  institucion: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url: string | null;

  @Column({ name: 'es_oficial', type: 'boolean', default: false })
  esOficial: boolean;

  @Column({ type: 'boolean', default: true })
  activa: boolean;
}
