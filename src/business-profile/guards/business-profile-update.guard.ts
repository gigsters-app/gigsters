import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
  } from '@nestjs/common';
  import { Request } from 'express';
  import { BusinessProfileService } from '../business-profile.service';
  
  @Injectable()
  export class BusinessProfileUpdateGuard implements CanActivate {
    constructor(private readonly businessProfileService: BusinessProfileService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const user = (request as any).user;
      const profileId = request.params.id;
    
      if (!user || !profileId) {
        throw new ForbiddenException('Invalid request.');
      }
    
      // ✅ Check for superadmin role or global claim
      const isSuperadmin = Array.isArray(user.roles)
        ? user.roles.includes('superadmin') || user.roles.some((r: any) => r.name === 'superadmin')
        : false;
    
      const allClaims = Array.isArray(user.roles)
        ? user.roles.flatMap((r: any) =>
            Array.isArray(r.claims) ? r.claims.map((c: any) => c.name) : []
          )
        : [];
    
      const hasClaim = allClaims.includes('business-profile:update:any');
      if (isSuperadmin || hasClaim) {
        return true;
      }
    
      // 🔍 Check ownership
      const profile = await this.businessProfileService.findOne(profileId);
      if (!profile) {
        throw new ForbiddenException('Business profile not found.');
      }
    
      const isOwner = profile.userId === user.id;
      if (!isOwner) {
        throw new ForbiddenException('You are not allowed to update this business profile.');
      }
    
      return true;
    }
  }
  