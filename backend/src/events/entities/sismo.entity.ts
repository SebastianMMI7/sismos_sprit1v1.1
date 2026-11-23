import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TipoMagnitud } from '../../catalog/entities/tipo-magnitud.entity';
import { EstadoSismo } from '../../catalog/entities/estado-sismo.entity';
import { FuenteSismica } from '../../catalog/entities/fuente-sismica.entity';
import { Municipio } from '../../territory/entities/municipio.entity';
import { Macrodistrito } from '../../territory/entities/macrodistrito.entity';

@Entity('sismos')
export class Sismo {
  @PrimaryGeneratedColumn({ name: 'id_sismo', type: 'int' })
  idSismo: number;

  @Column({ name: 'id_tipo_magnitud', type: 'int' })
  idTipoMagnitud: number;

  @ManyToOne(() => TipoMagnitud)
  @JoinColumn({ name: 'id_tipo_magnitud' })
  tipoMagnitud: TipoMagnitud;

  @Column({ name: 'id_estado_sismo', type: 'int' })
  idEstadoSismo: number;

  @ManyToOne(() => EstadoSismo)
  @JoinColumn({ name: 'id_estado_sismo' })
  estadoSismo: EstadoSismo;

  @Column({ name: 'id_usuario_registro', type: 'int', default: 1 })
  idUsuarioRegistro: number;

  @Column({ name: 'id_municipio', type: 'int', nullable: true })
  idMunicipio: number | null;

  @ManyToOne(() => Municipio, { nullable: true })
  @JoinColumn({ name: 'id_municipio' })
  municipio: Municipio | null;

  @Column({ name: 'id_macrodistrito', type: 'int', nullable: true })
  idMacrodistrito: number | null;

  @ManyToOne(() => Macrodistrito, { nullable: true })
  @JoinColumn({ name: 'id_macrodistrito' })
  macrodistrito: Macrodistrito | null;

  @Column({ name: 'id_fuente', type: 'int', nullable: true })
  idFuente: number | null;

  @ManyToOne(() => FuenteSismica, { nullable: true })
  @JoinColumn({ name: 'id_fuente' })
  fuente: FuenteSismica | null;

  @Column({ name: 'fecha_hora_utc', type: 'timestamp' })
  fechaHoraUtc: Date;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  magnitud: number;

  @Column({ name: 'profundidad_km', type: 'decimal', precision: 7, scale: 2 })
  profundidadKm: number;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  latitud: number;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  longitud: number;

  @Column({ name: 'ubicacion_referencia', type: 'varchar', length: 255, nullable: true })
  ubicacionReferencia: string | null;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamp' })
  fechaRegistro: Date;

  @UpdateDateColumn({ name: 'fecha_ultima_actualizacion', type: 'timestamp', nullable: true })
  fechaUltimaActualizacion: Date | null;
}
