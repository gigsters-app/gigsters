// src/quotation/quotation.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectEntityManager }          from '@nestjs/typeorm';
import { EntityManager }                from 'typeorm';
import { In } from 'typeorm';

import { Quotation, QuotationStatus }        from './quotation.entity';
import { QuotationItem }                     from './entities/quotation-item.entity';
import { BusinessProfile }                   from '../business-profile/business-profile.entity';
import { Client }                            from '../client/client.entity';
import { CreateQuotationDto } from './dtos/create-quotation.dto';
import { UpdateQuotationDto } from './dtos/update-quotation.dto';
import { QuotationNumberFormat } from './entities/quotation-number-format.entity';
import { QuotationCounter } from './entities/quotation-counter.entity';
import { BusinessSnapshot } from './entities/quotation-business-snapshot.entity';
import { ClientSnapshot } from './entities/quotation-client-snapshot.entity';
import { InvoiceService } from '../invoice/invoice.service';
import { Invoice, InvoiceStatus } from '../invoice/entities/invoice.entity';
import { QuotationToInvoiceDto } from './dtos/quotation-to-invoice.dto';
import { CreateInvoiceDto } from '../invoice/dtos/create-invoice.dto';

@Injectable()
export class QuotationService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly invoiceService: InvoiceService,
  ) {}

  /**
   * Get or create quotation number format for a business profile
   */
  async getQuotationNumberFormat(businessProfileId: string): Promise<QuotationNumberFormat> {
    let format = await this.entityManager.findOne(QuotationNumberFormat, {
      where: { businessProfileId },
    });

    if (!format) {
      format = this.entityManager.create(QuotationNumberFormat, {
        businessProfileId,
      });
      format = await this.entityManager.save(format);
    }

    return format;
  }

  /**
   * Generate quotation number based on format and counter
   */
  private generateQuotationNumber(
    format: QuotationNumberFormat,
    counter: QuotationCounter,
  ): string {
    const year = new Date().getFullYear();
    const paddedNumber = String(counter.lastNumber).padStart(format.paddingDigits, '0');
    
    let quotationNumber = `${format.prefix}${format.separator}`;
    
    // Always include year for default format, optional for custom
    if (format.includeYear || !format.isCustomFormat) {
      quotationNumber += `${year}${format.yearSeparator}`;
    }
    
    quotationNumber += paddedNumber;
    
    return quotationNumber;
  }

  /**
   * Fetch a single quotation with all relations:
   *  – businessProfile
   *  – client
   *  – items (and their optional businessItem)
   */
  async findFull(id: string): Promise<Quotation> {
    const q = await this.entityManager.findOne(Quotation, {
      where: { id },
      relations: [
        'businessProfile',
        'client',
        'items',
        'items.businessItem',
      ],
    });
    if (!q) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }
    return q;
  }

  /**
   * Create a new Quotation in a single transaction.
   */
  async create(dto: CreateQuotationDto): Promise<Quotation> {
    return this.entityManager.transaction(async tx => {
      // 1) Get format and counter
      const format = await this.getQuotationNumberFormat(dto.businessProfileId);
      let counter = await tx.findOne(QuotationCounter, {
        where: { businessProfileId: dto.businessProfileId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!counter) {
        counter = tx.create(QuotationCounter, {
          businessProfileId: dto.businessProfileId,
          lastNumber: format.startNumber,
        });
      } else {
        counter.lastNumber++;
      }
      await tx.save(counter);

      // 2) Generate quotationNumber
      const generatedQuotationNumber = this.generateQuotationNumber(format, counter);

      // 3) Load BusinessProfile
      const bp = await tx.findOne(BusinessProfile, { where: { id: dto.businessProfileId } });
      if (!bp) throw new NotFoundException('BusinessProfile not found');

      // 4) Load Client and verify it belongs to that profile
      const client = await tx.findOne(Client, {
        where: { id: dto.clientId },
        relations: ['businessProfile'],
      });
      if (!client || client.businessProfile.id !== bp.id) {
        throw new NotFoundException('Client not found for this BusinessProfile');
      }

      // 5) Create the Quotation record
      const q = tx.create(Quotation, {
        title: dto.title,
        quotationNumber: generatedQuotationNumber,
        issueDate: new Date(dto.issueDate),
        expirationDate: new Date(dto.expirationDate),
        status: dto.status ?? QuotationStatus.DRAFT,
        currency: dto.currency ?? 'USD',
        businessProfile: bp,
        client,
        clientId: client.id,
        taxRate: dto.taxRate ?? 0,
        discount: dto.discount ?? 0,
        notes: dto.notes,
        terms: dto.terms,
      });
      await tx.save(q);

      // 6) Create and save snapshots
      const businessSnapshot = tx.create(BusinessSnapshot, {
        quotation: q,
        name: bp.displayName,
        legalName: bp.legalName,
        registrationNumber: bp.licenseNumber || '',
        taxNumber: bp.vatNumber,
        address: `${bp.street}${bp.street2 ? `, ${bp.street2}` : ''}, ${bp.city}${bp.state ? `, ${bp.state}` : ''} ${bp.zip || ''}, ${bp.country}`,
        phone: bp.phone || bp.mobile,
        email: bp.user?.email || '',
        website: bp.website,
        logoUrl: bp.companyLogo,
      });
      const savedBusinessSnapshot = await tx.save(businessSnapshot);

      const clientSnapshot = tx.create(ClientSnapshot, {
        quotation: q,
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        taxNumber: client.vatNumber,
        registrationNumber: '',
      });
      const savedClientSnapshot = await tx.save(clientSnapshot);

      q.businessSnapshot = savedBusinessSnapshot;
      q.clientSnapshot = savedClientSnapshot;
      await tx.save(q);

      // 7) Create and save items
      const items = dto.items.map(i => {
        const total = i.quantity * i.unitPrice;
        return tx.create(QuotationItem, {
          quotation: q,
          name: i.description,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: total,
          total: total,
          taxRate: 0,
          taxAmount: 0,
          discountRate: 0,
          discountAmount: 0,
          finalPrice: total,
        });
      });
      await tx.save(items);

      // 8) Calculate subtotals and totals
      const subTotal = items.reduce((sum, it) => sum + Number(it.total), 0);
      const tax = Number(((subTotal * q.taxRate) / 100).toFixed(2));
      const total = Number((subTotal + tax - q.discount).toFixed(2));

      // 9) Update quotation with totals
      await tx.update(Quotation, { id: q.id }, { subTotal, tax, total });

      // 10) Return fully populated quotation
      return await tx.findOneOrFail(Quotation, {
        where: { id: q.id },
        relations: [
          'businessProfile',
          'businessSnapshot',
          'clientSnapshot',
          'items',
        ],
      });
    });
  }

  /**
   * List all quotations, including related profile, client & items.
   */
  async findAll(): Promise<Quotation[]> {
    return this.entityManager.find(Quotation, {
      relations: ['businessProfile', 'client', 'items'],
    });
  }

  /**
   * Fetch one quotation by ID.
   */
  async findOne(id: string): Promise<Quotation> {
    const q = await this.entityManager.findOne(Quotation, {
      where: { id },
      relations: ['businessProfile', 'client', 'items'],
    });
    if (!q) throw new NotFoundException(`Quotation ${id} not found`);
    return q;
  }

  /**
   * Update an existing quotation.
   */
  async update(id: string, dto: UpdateQuotationDto): Promise<Quotation> {
    return this.entityManager.transaction(async tx => {
      const repo = tx.getRepository(Quotation);
      let q = await repo.findOne({
        where: { id },
        relations: ['businessProfile', 'client', 'items'],
      });
      if (!q) throw new NotFoundException(`Quotation ${id} not found`);

      // Merge simple fields
      repo.merge(q, dto);

      // If items provided, delete old & recreate
      if (dto.items) {
        await tx.delete(QuotationItem, { quotation: { id } });
        q.items = dto.items.map(i =>
          tx.create(QuotationItem, {
            businessItemId: i.businessItemId,
            description:    i.description,
            quantity:       i.quantity,
            unitPrice:      i.unitPrice,
            total:          i.quantity * i.unitPrice,
          }),
        );
        q.subTotal = q.items.reduce((s, it) => s + Number(it.total), 0);
        q.tax      = Number(((q.subTotal * q.taxRate) / 100).toFixed(2));
        q.total    = Number((q.subTotal + q.tax - q.discount).toFixed(2));
      }

      return repo.save(q);
    });
  }

  /**
   * Delete a quotation by ID.
   */
  async remove(id: string): Promise<void> {
    const res = await this.entityManager.delete(Quotation, id);
    if (res.affected === 0) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }
  }

  /**
   * Convert an approved quotation into an invoice
   */
  async convertToInvoice(dto: QuotationToInvoiceDto): Promise<Invoice> {
    // Find the quotation with all relations
    const quotation = await this.entityManager.findOne(Quotation, {
      where: { id: dto.quotationId },
      relations: [
        'businessProfile',
        'client',
        'businessSnapshot',
        'clientSnapshot',
        'items',
      ],
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID "${dto.quotationId}" not found.`);
    }

    // Check if the quotation is in ACCEPTED status
    if (quotation.status !== QuotationStatus.ACCEPTED) {
      throw new BadRequestException(
        `Only accepted quotations can be converted to invoices. Current status: ${quotation.status}`
      );
    }

    // We don't need to provide invoiceNumber as it's generated by the invoice service
    const createInvoiceDto = {
      businessProfileId: quotation.businessProfileId,
      title: `Invoice for ${quotation.title}`,
      issueDate: new Date().toISOString().split('T')[0], // Current date
      dueDate: this.calculateDueDate(30).toISOString().split('T')[0], // 30 days from now
      status: InvoiceStatus.PENDING,
      clientId: quotation.clientId,
      currency: quotation.currency,
      taxRate: quotation.taxRate,
      discount: quotation.discount,
      notes: quotation.notes,
      terms: quotation.terms,
      items: quotation.items.map(item => ({
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    } as CreateInvoiceDto; // Type assertion to resolve the TypeScript error

    // Use the invoice service to create the invoice
    const invoice = await this.invoiceService.create(createInvoiceDto);

    // Update the quotation status
    await this.entityManager.update(Quotation, quotation.id, { status: QuotationStatus.INVOICED });

    return invoice;
  }

  /**
   * Helper method to calculate due date
   */
  private calculateDueDate(daysFromNow: number): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysFromNow);
    return dueDate;
  }

  /**
   * Find all quotations for a user based on their business profiles.
   * For regular users, this returns only quotations from their business profiles.
   * For superadmins or users with quotation:manage:any claim, it returns all quotations.
   */
  async findQuotationsByUser(user: any): Promise<Quotation[]> {
    console.log('findQuotationsByUser called with user:', JSON.stringify({
      id: user.id,
      email: user.email,
      roles: user.roles?.map(r => ({ name: r.name, isSuperAdmin: r.isSuperAdmin })),
      businessProfiles: user.businessProfiles?.map(bp => ({ id: bp.id }))
    }, null, 2));
    
    // Check if user is superadmin or has manage:any claim
    const isSuperadmin = user.roles?.some((role: any) => 
      role.name === 'superadmin' && role.isSuperAdmin === true
    );
    console.log('User is superadmin:', isSuperadmin);
    
    const allClaims = user.roles?.flatMap((role: any) => {
      const claims = role.claims?.map((claim: any) => claim.name) || [];
      return claims;
    }) || [];
    
    const hasManageAnyClaim = allClaims.includes('quotation:manage:any');
    console.log('User has quotation:manage:any claim:', hasManageAnyClaim);
    
    // Superadmin or user with manage:any claim can see all quotations
    if (isSuperadmin || hasManageAnyClaim) {
      console.log('Getting all quotations for superadmin or user with manage:any claim');
      return this.entityManager.find(Quotation, {
        relations: ['businessSnapshot', 'clientSnapshot', 'items'],
      });
    }
    
    // Regular user can only see quotations from their business profiles
    const businessProfileIds = user.businessProfiles?.map(profile => profile.id) || [];
    console.log('User business profile IDs:', businessProfileIds);
    
    if (businessProfileIds.length === 0) {
      console.log('No business profiles found for user, returning empty array');
      return [];
    }
    
    console.log('Querying quotations for business profiles:', businessProfileIds);
    
    try {
      const quotations = await this.entityManager.find(Quotation, {
        where: { 
          businessProfileId: In(businessProfileIds) 
        },
        relations: ['businessSnapshot', 'clientSnapshot', 'items'],
      });
      
      console.log(`Found ${quotations.length} quotations`);
      return quotations;
    } catch (error) {
      console.error('Error querying quotations:', error);
      throw error;
    }
  }
}