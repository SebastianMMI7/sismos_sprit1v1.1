import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: JwtPayload;
}

/**
 * Verifica el token JWT enviado en `Authorization: Bearer <token>`
 * y adjunta el payload a la petición (RNF03).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const rawHeader = Array.isArray(header) ? header[0] : header;
    const [scheme, token] = (rawHeader ?? '').split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Se requiere un token de sesión (Authorization: Bearer).');
    }

    try {
      request.user = await this.jwtService.verifyAsync<JwtPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException('El token de sesión es inválido o ha expirado.');
    }
  }
}
