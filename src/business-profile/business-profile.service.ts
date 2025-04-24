import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { BusinessProfile } from './business-profile.entity';
import { CreateBusinessProfileDto, InvoiceFormatType } from './DTOs/create-business-profile.dto';
import { UpdateBusinessProfileDto } from './DTOs/update-business-profile.dto';
import { User } from 'src/users/user.entity';
import { InvoiceNumberFormat } from 'src/invoice/entities/invoice-number-format.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class BusinessProfileService {
  private readonly logger = new Logger(BusinessProfileService.name);

  constructor(@InjectEntityManager() private em: EntityManager) {}

  async create(dto: CreateBusinessProfileDto): Promise<BusinessProfile> {
    const user = await this.em.findOne(User, { where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('Cannot create business profile: user not found.');
    }

    try {
      return this.em.transaction(async manager => {
        // Create business profile
        const businessProfile = manager.create(BusinessProfile, {
          ...dto,
          userId: user.id,  // Explicitly set the userId
          user: user,       // Set the user relation
        });
        await manager.save(businessProfile);

        // Create invoice number format based on user's choice
        const invoiceFormat = manager.create(InvoiceNumberFormat, {
          businessProfileId: businessProfile.id,
          prefix: dto.invoiceFormatType === InvoiceFormatType.DEFAULT ? 'INV' : dto.customInvoicePrefix,
          separator: dto.invoiceFormatType === InvoiceFormatType.DEFAULT ? '-' : dto.customInvoiceSeparator,
          paddingDigits: 5,
          startNumber: dto.invoiceFormatType === InvoiceFormatType.DEFAULT ? 1 : dto.customInvoiceStartNumber,
          includeYear: dto.invoiceFormatType === InvoiceFormatType.DEFAULT ? true : dto.customInvoiceIncludeYear,
          yearSeparator: '-',
          isCustomFormat: dto.invoiceFormatType === InvoiceFormatType.CUSTOM,
        });
        await manager.save(invoiceFormat);

        return businessProfile;
      });
    } catch (err) {
      this.logger.error('Failed to create business profile:', err);
      throw new BadRequestException('Failed to create business profile. Please check the provided data.');
    }
  }

  async register(dto: CreateBusinessProfileDto, user: User): Promise<BusinessProfile> {
    // Ensure the user doesn't already have a profile
    const existing = await this.findByUserId(user.id);
    if (existing) {
      throw new ConflictException('You already have a business profile.');
    }

    try {
      return this.em.transaction(async manager => {
        // Create profile with user's ID
        const profile = manager.create(BusinessProfile, {
          ...dto,
          userId: user.id,  // Explicitly set the userId
          user: user,       // Set the user relation
        });

        const savedProfile = await manager.save(profile);

        // Create invoice number format based on user's choice
        const invoiceFormat = manager.create(InvoiceNumberFormat, {
          businessProfileId: savedProfile.id,
          prefix: dto.invoiceFormatType === InvoiceFormatType.DEFAULT ? 'INV' : dto.customInvoicePrefix,
          separator: dto.invoiceFormatType === InvoiceFormatType.DEFAULT ? '-' : dto.customInvoiceSeparator,
          paddingDigits: 5,
          startNumber: dto.invoiceFormatType === InvoiceFormatType.DEFAULT ? 1 : dto.customInvoiceStartNumber,
          includeYear: dto.invoiceFormatType === InvoiceFormatType.DEFAULT ? true : dto.customInvoiceIncludeYear,
          yearSeparator: '-',
          isCustomFormat: dto.invoiceFormatType === InvoiceFormatType.CUSTOM,
        });
        await manager.save(invoiceFormat);

        return savedProfile;
      });
    } catch (err) {
      this.logger.error('Failed to create business profile:', err);
      throw new BadRequestException('Failed to create business profile. Please check the provided data.');
    }
  }

  async findByUserId(userId: string): Promise<BusinessProfile | null> {
    return this.em.findOne(BusinessProfile, {
      where: { userId },
    });
  }

  async findAll(): Promise<BusinessProfile[]> {
    return this.em.find(BusinessProfile);
  }

  async findOne(id: string): Promise<BusinessProfile> {
    const profile = await this.em.findOne(BusinessProfile, { where: { id } });
    if (!profile) {
      throw new NotFoundException('Business profile not found');
    }
    return profile;
  }

  async update(id: string, dto: UpdateBusinessProfileDto): Promise<BusinessProfile> {
    const profile = await this.findOne(id);
    this.em.merge(BusinessProfile, profile, dto);
    return this.em.save(profile);
  }

  async remove(id: string): Promise<void> {
    const profile = await this.findOne(id);
    await this.em.remove(profile);
  }
}
