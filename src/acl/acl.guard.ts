import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';

@Injectable()
export class AclGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ✅ Allow if route is marked public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredClaims =
      this.reflector.get<string[]>('claims', context.getHandler()) || [];
    const requiredRoles =
      this.reflector.get<string[]>('roles', context.getHandler()) || [];

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // ✅ Superadmin bypass
    const isSuperAdmin =
    user.roles?.some((role: any) =>
      typeof role === 'string'
        ? role === 'superadmin'
        : role?.isSuperAdmin === true
    );
    console.log(isSuperAdmin);
    if (isSuperAdmin) {
      return true;
    }

    // ✅ Safely extract role names
    const userRoles: string[] = user.roles?.map((role: any) => role?.name) ?? [];

    // ✅ Safely extract claim names
    const roleClaims =
  user.roles?.flatMap((role: any) =>
    Array.isArray(role.claims)
      ? role.claims.map((claim: any) => claim?.name)
      : [],
  ) ?? [];

const topLevelClaims: string[] = Array.isArray(user.claims) ? user.claims : [];

const userClaims: string[] = [...new Set([...roleClaims, ...topLevelClaims])];

    const hasRole =
      requiredRoles.length === 0 || requiredRoles.some((role) => userRoles.includes(role));

    const hasClaim =
      requiredClaims.length === 0 || requiredClaims.every((claim) => userClaims.includes(claim));

    if (!hasRole || !hasClaim) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
