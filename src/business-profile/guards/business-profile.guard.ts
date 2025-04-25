import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { BusinessProfileService } from '../business-profile.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class BusinessProfileGuard implements CanActivate {
  private readonly logger = new Logger(BusinessProfileGuard.name);

  constructor(
    private readonly businessProfileService: BusinessProfileService,
    private readonly userService: UsersService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    const profileId = request.params.id;

    if (!user) {
      throw new ForbiddenException('Authentication required.');
    }

    // Debug logging
    this.logger.debug('User object:', JSON.stringify(user, null, 2));
    this.logger.debug('User roles:', JSON.stringify(user.roles, null, 2));

    // Check for superadmin role
    const isSuperadmin = user.roles?.some((role: any) => {
      const isSuper = role.name === 'superadmin' && role.isSuperAdmin === true;
      this.logger.debug(`Checking role ${role.name}: isSuper = ${isSuper}`);
      return isSuper;
    });

    this.logger.debug('Is superadmin:', isSuperadmin);

    // Check for business-profile:manage:any claim
    const allClaims = user.roles?.flatMap((role: any) => {
      const claims = role.claims?.map((claim: any) => claim.name) || [];
      this.logger.debug(`Claims for role ${role.name}:`, claims);
      return claims;
    }) || [];

    this.logger.debug('All claims:', allClaims);
    const hasManageAnyClaim = allClaims.includes('business-profile:manage:any');
    this.logger.debug('Has manage:any claim:', hasManageAnyClaim);

    // Superadmin or user with manage:any claim can do anything
    if (isSuperadmin || hasManageAnyClaim) {
      this.logger.debug('Access granted: superadmin or manage:any claim');
      return true;
    }

    // For POST /register - ensure user doesn't have a profile
    if (request.method === 'POST' && request.path.endsWith('/register')) {
      this.logger.debug('Checking for existing profile for user:', user.id);
      const existingProfile = await this.businessProfileService.findByUserId(user.id);
      if (existingProfile) {
        this.logger.debug('Profile already exists for user');
        throw new ForbiddenException('You already have a business profile.');
      }
      this.logger.debug('No existing profile found, allowing registration');
      return true;
    }

    // For other operations - check ownership
    if (profileId) {
      const profile = await this.businessProfileService.findOne(profileId);
      if (!profile) {
        throw new ForbiddenException('Business profile not found.');
      }

      const isOwner = profile.userId === user.id;
      if (!isOwner) {
        throw new ForbiddenException('You are not allowed to manage this business profile.');
      }
    }

    return true;
  }
} 