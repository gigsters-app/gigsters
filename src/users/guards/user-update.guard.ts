import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class UserUpdateGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    const targetUserId = request.params.id;

    if (!user || !targetUserId) {
      throw new ForbiddenException('Invalid request');
    }

    // ✅ Superadmin has full access
    // const isSuperadmin = user.roles?.includes('superadmin');
    const isSuperAdmin =
    user.roles?.some((role: any) =>
      typeof role === 'string'
        ? role === 'superadmin'
        : role?.isSuperAdmin === true
    );
    // ✅ Collect all claims from roles (assuming user.roles is an array of { name: string, claims: { name: string }[] })
    const allClaims = user.roles?.flatMap((r: any) => r.claims?.map((c: any) => c.name)) || [];
    const hasClaim = allClaims.includes('user:update:any');

    if (isSuperAdmin || hasClaim) {
      return true;
    }

    // 🔍 Ownership check
    const isOwner = user.id === targetUserId;
    if (!isOwner) {
      throw new ForbiddenException('You are not allowed to update this user.');
    }

    return true;
  }
}

  