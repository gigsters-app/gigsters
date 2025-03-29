import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AclGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredClaims = this.reflector.get<string[]>('claims', context.getHandler()) || [];
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler()) || [];

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found');
    }
 // Superadmin Bypass
 if (user.roles.some(role => role.isSuperAdmin)) {
  return true;
}
    const userRoles = user.roles.map(role => role.name);
    const userClaims = user.roles.flatMap(role => role.claims.map(claim => claim.name));

    const hasRole = requiredRoles.length ? requiredRoles.some(role => userRoles.includes(role)) : true;
    const hasClaim = requiredClaims.length ? requiredClaims.every(claim => userClaims.includes(claim)) : true;

    if (!hasRole || !hasClaim) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
