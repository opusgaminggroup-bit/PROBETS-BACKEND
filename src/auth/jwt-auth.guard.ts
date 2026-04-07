import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Role } from '../common/enums/role.enum';

type JwtLikePayload = {
  sub?: string | number;
  userId?: string | number;
  id?: string | number;
  role?: Role | string;
  username?: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = auth.slice(7).trim();
    const parts = token.split('.');
    if (parts.length < 2) {
      throw new UnauthorizedException('Invalid JWT format');
    }

    let payload: JwtLikePayload;
    try {
      const json = Buffer.from(parts[1], 'base64url').toString('utf8');
      payload = JSON.parse(json) as JwtLikePayload;
    } catch {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    const userId = String(payload.sub ?? payload.userId ?? payload.id ?? '');
    if (!userId) {
      throw new ForbiddenException('JWT missing user id');
    }

    req.user = {
      userId,
      role: String(payload.role ?? '').toLowerCase(),
      username: payload.username ?? null,
      raw: payload,
    };

    return true;
  }
}
