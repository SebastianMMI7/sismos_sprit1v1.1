import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('estados_sismo')
export class EstadoSismo {
  @PrimaryGeneratedColumn({ name: 'id_estado_sismo', type: 'int' })
  idEstadoSismo: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;
}
