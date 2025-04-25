import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { BusinessItemService } from '../business-item.service';
import { BusinessProfileService } from 'src/business-profile/business-profile.service';

@Injectable()
export class BusinessItemGuard implements CanActivate {
  private readonly logger = new Logger(BusinessItemGuard.name);

  constructor(
    private readonly businessItemService: BusinessItemService,
    private readonly businessProfileService: BusinessProfileService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    const itemId = request.params.id;
    const profileId = request.params.profileId;

    if (!user) {
      throw new ForbiddenException('Authentication required.');
    }

    // Check for superadmin role
    const isSuperadmin = user.roles?.some((role: any) => {
      const isSuper = role.name === 'superadmin' && role.isSuperAdmin === true;
      return isSuper;
    });

    if (isSuperadmin) {
      return true;
    }

    // Check for businessitem:manage:any claim
    const allClaims = user.roles?.flatMap((role: any) => {
      const claims = role.claims?.map((claim: any) => claim.name) || [];
      return claims;
    }) || [];
    
    const hasManageAnyClaim = allClaims.includes('businessitem:manage:any');

    if (hasManageAnyClaim) {
      return true;
    }

    // For POST /create - check if the business profile belongs to the user
    if (request.method === 'POST') {
      const businessProfileId = request.body.businessProfileId;
      if (!businessProfileId) {
        throw new ForbiddenException('Business profile ID is required.');
      }

      const businessProfile = await this.businessProfileService.findOne(businessProfileId);
      if (!businessProfile) {
        throw new NotFoundException('Business profile not found.');
      }

      const isOwner = businessProfile.userId === user.id;
      if (!isOwner) {
        throw new ForbiddenException('You are not allowed to create business items for this business profile.');
      }

      return true;
    }

    // For GET profile/:profileId - check profile ownership
    if (profileId) {
      const businessProfile = await this.businessProfileService.findOne(profileId);
      if (!businessProfile) {
        throw new NotFoundException('Business profile not found.');
      }

      const isOwner = businessProfile.userId === user.id;
      if (!isOwner) {
        throw new ForbiddenException('You are not allowed to view business items for this business profile.');
      }

      return true;
    }

    // For other operations (GET, PATCH, DELETE) - check business item ownership
    if (itemId) {
      const businessItem = await this.businessItemService.findOne(itemId);
      if (!businessItem) {
        throw new NotFoundException('Business item not found.');
      }

      const businessProfile = await this.businessProfileService.findOne(businessItem.businessProfile.id);
      if (!businessProfile) {
        throw new NotFoundException('Business profile not found.');
      }

      const isOwner = businessProfile.userId === user.id;
      if (!isOwner) {
        throw new ForbiddenException('You are not allowed to manage this business item.');
      }
    }

    return true;
  }
} 