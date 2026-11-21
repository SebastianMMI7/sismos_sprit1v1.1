export const USER_ROLES = ['ciudadano', 'sismologo', 'administrador'] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Perfiles técnicos autorizados a registrar o revisar eventos sísmicos (RF7). */
export const TECHNICAL_ROLES: UserRole[] = ['sismologo', 'administrador'];
