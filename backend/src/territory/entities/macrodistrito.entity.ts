import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Municipio } from './municipio.entity';

@Entity('macrodistritos')
export class Macrodistrito {
  @PrimaryGeneratedColumn({ name: 'id_macrodistrito', type: 'int' })
  idMacrodistrito: number;

  @Column({ name: 'id_municipio', type: 'int' })
  idMunicipio: number;

  @ManyToOne(() => Municipio, (m) => m.macrodistritos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_municipio' })
  municipio: Municipio;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;
}
