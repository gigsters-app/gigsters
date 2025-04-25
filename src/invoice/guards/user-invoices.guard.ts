import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';
import { Request } from 'express';

@Injectable()
export class UserInvoicesGuard implements CanActivate {
  private readonly logger = new Logger(UserInvoicesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    if (!user) {
      throw new ForbiddenException('Authentication required.');
    }

    // Check for superadmin role - they can access all invoices
    const isSuperadmin = user.roles?.some((role: any) => {
      return role.name === 'superadmin' && role.isSuperAdmin === true;
    });

    if (isSuperadmin) {
      return true;
    }

    // Check for invoice:manage:any claim - they can access all invoices
    const allClaims = user.roles?.flatMap((role: any) => {
      const claims = role.claims?.map((claim: any) => claim.name) || [];
      return claims;
    }) || [];
    const hasManageAnyClaim = allClaims.includes('invoice:manage:any');

    if (hasManageAnyClaim) {
      return true;
    }

    // For regular users, we'll check in the controller/service if they're
    // accessing only their own invoices, using their business profile IDs
    return true;
  }
} 