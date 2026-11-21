import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { UserRole } from '../../common/roles';

/**
 * Tabla base del sistema. TypeORM la crea automáticamente gracias a
 * `synchronize: true` definido en app.module.ts.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 160, unique: true })
  email: string;

  /** Nunca se devuelve en las consultas (select: false) ni en las respuestas. */
  @Column({ type: 'varchar', length: 100, select: false })
  password: string;

  @Column({ type: 'text', default: 'ciudadano' })
  role: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  /** Acreditación o licencia profesional exigida al perfil Sismólogo (RF5.03). */
  @Column({ name: 'professional_license', type: 'varchar', length: 120, nullable: true })
  professionalLicense: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

export type PublicUser = Omit<User, 'password'>;
