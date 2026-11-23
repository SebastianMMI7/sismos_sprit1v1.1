import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tipos_magnitud')
export class TipoMagnitud {
  @PrimaryGeneratedColumn({ name: 'id_tipo_magnitud', type: 'int' })
  idTipoMagnitud: number;

  @Column({ type: 'varchar', length: 10, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;
}
