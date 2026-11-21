import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

/** Inyecta el usuario autenticado (payload del JWT) en el controlador. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload => {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (!request.user) {
      throw new Error('CurrentUser requiere el JwtAuthGuard.');
    }
    return request.user;
  },
);
