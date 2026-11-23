import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Macrodistrito } from './macrodistrito.entity';

@Entity('municipios')
export class Municipio {
  @PrimaryGeneratedColumn({ name: 'id_municipio', type: 'int' })
  idMunicipio: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  departamento: string;

  @Column({ name: 'codigo_ine', type: 'varchar', length: 30, nullable: true })
  codigoIne: string | null;

  @OneToMany(() => Macrodistrito, (m) => m.municipio)
  macrodistritos: Macrodistrito[];
}
