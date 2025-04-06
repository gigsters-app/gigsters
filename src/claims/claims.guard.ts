import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  
  @Injectable()
  export class ClaimsGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      const requiredClaims = this.reflector.get<string[]>(
        'claims',
        context.getHandler(),
      );
  
      // ✅ No claims required → allow access
      if (!requiredClaims || requiredClaims.length === 0) {
        return true;
      }
  
      const request = context.switchToHttp().getRequest();
      const user = request.user;
  
      if (!user) {
        throw new ForbiddenException('No user found in request');
      }
  
      // ✅ Superadmin shortcut — skip claim checks
      if (user.roles.some(role => role.isSuperAdmin)) {
        return true;
      }
  
      // 🔐 Check user's claims
      const userClaims = user.roles?.flatMap((role: any) => role.claims || []) ?? [];
  
      const hasAll = requiredClaims.every((claim) => userClaims.includes(claim));
      if (!hasAll) {
        throw new ForbiddenException('You do not have the required permissions');
      }
  
      return true;
    }
  }
  