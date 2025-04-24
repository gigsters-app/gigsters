// src/quotation/quotation.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager }          from '@nestjs/typeorm';
import { EntityManager }                from 'typeorm';

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

@Injectable()
export class QuotationService {
  constructor(
    @InjectEntityManager()
    private readonly em: EntityManager,
  ) {}

  /**
   * Get or create quotation number format for a business profile
   */
  async getQuotationNumberFormat(businessProfileId: string): Promise<QuotationNumberFormat> {
    let format = await this.em.findOne(QuotationNumberFormat, {
      where: { businessProfileId },
    });

    if (!format) {
      format = this.em.create(QuotationNumberFormat, {
        businessProfileId,
      });
      format = await this.em.save(format);
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
    const q = await this.em.findOne(Quotation, {
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
    return this.em.transaction(async tx => {
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
    return this.em.find(Quotation, {
      relations: ['businessProfile', 'client', 'items'],
    });
  }

  /**
   * Fetch one quotation by ID.
   */
  async findOne(id: string): Promise<Quotation> {
    const q = await this.em.findOne(Quotation, {
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
    return this.em.transaction(async tx => {
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
    const res = await this.em.delete(Quotation, id);
    if (res.affected === 0) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }
  }
}
