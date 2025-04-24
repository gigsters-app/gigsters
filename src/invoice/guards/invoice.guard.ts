import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { InvoiceService } from '../invoice.service';
import { BusinessProfileService } from 'src/business-profile/business-profile.service';

@Injectable()
export class InvoiceGuard implements CanActivate {
  private readonly logger = new Logger(InvoiceGuard.name);

  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly businessProfileService: BusinessProfileService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    const invoiceId = request.params.id;

    if (!user) {
      throw new ForbiddenException('Authentication required.');
    }

    // Debug logging
    this.logger.debug('User object:', JSON.stringify(user, null, 2));
    this.logger.debug('User roles:', JSON.stringify(user.roles, null, 2));

    // Check for superadmin role
    const isSuperadmin = user.roles?.some((role: any) => {
      const isSuper = role.name === 'superadmin' || role.isSuperAdmin === true;
      this.logger.debug(`Checking role ${role.name}: isSuper = ${isSuper}`);
      return isSuper;
    });

    this.logger.debug('Is superadmin:', isSuperadmin);

    // Check for invoice:manage:any claim
    const allClaims = user.roles?.flatMap((role: any) => {
      const claims = role.claims?.map((claim: any) => claim.name) || [];
      this.logger.debug(`Claims for role ${role.name}:`, claims);
      return claims;
    }) || [];

    this.logger.debug('All claims:', allClaims);
    const hasManageAnyClaim = allClaims.includes('invoice:manage:any');
    this.logger.debug('Has manage:any claim:', hasManageAnyClaim);

    // Superadmin or user with manage:any claim can do anything
    if (isSuperadmin || hasManageAnyClaim) {
      this.logger.debug('Access granted: superadmin or manage:any claim');
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
        throw new ForbiddenException('You are not allowed to create invoices for this business profile.');
      }

      return true;
    }

    // For other operations (GET, PATCH, DELETE) - check invoice ownership
    if (invoiceId) {
      const invoice = await this.invoiceService.findOne(invoiceId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found.');
      }

      const businessProfile = await this.businessProfileService.findOne(invoice.businessProfileId);
      if (!businessProfile) {
        throw new NotFoundException('Business profile not found.');
      }

      const isOwner = businessProfile.userId === user.id;
      if (!isOwner) {
        throw new ForbiddenException('You are not allowed to manage this invoice.');
      }
    }

    return true;
  }
} 