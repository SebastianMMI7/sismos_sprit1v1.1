import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../roles';

export const ROLES_KEY = 'roles';

/** Restringe un endpoint a los perfiles indicados (RF5.03). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
