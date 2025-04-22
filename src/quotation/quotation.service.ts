// src/quotation/quotation.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager }          from '@nestjs/typeorm';
import { EntityManager }                from 'typeorm';

import { Quotation, QuotationStatus }        from './quotation.entity';
import { QuotationItem }                     from '../quotation-item/quotation-item.entity';
import { BusinessProfile }                   from '../business-profile/business-profile.entity';
import { Client }                            from '../client/client.entity';
import { CreateQuotationDto } from './dtos/create-quotation.dto';
import { UpdateQuotationDto } from './dtos/update-quotation.dto';

@Injectable()
export class QuotationService {
  constructor(
    @InjectEntityManager()
    private readonly em: EntityManager,
  ) {}
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
      // 1) Load BusinessProfile
      const bp = await tx.findOne(BusinessProfile, { where: { id: dto.businessProfileId } });
      if (!bp) throw new NotFoundException('BusinessProfile not found');

      // 2) Load Client and verify it belongs to that profile
      const client = await tx.findOne(Client, {
        where: { id: dto.clientId },
        relations: ['businessProfile'],
      });
      if (!client || client.businessProfile.id !== bp.id) {
        throw new NotFoundException('Client not found for this BusinessProfile');
      }

      // 3) Build Quotation entity
      const q = tx.create(Quotation, {
        title: dto.title,
        quotationNumber: dto.quotationNumber,
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

      // 4) Build QuotationItem entities
      q.items = dto.items.map(i =>
        tx.create(QuotationItem, {
          businessItemId: i.businessItemId,
          description:  i.description,
          quantity:     i.quantity,
          unitPrice:    i.unitPrice,
          total:        i.quantity * i.unitPrice,
        }),
      );

      // 5) Calculate subtotals and totals
      q.subTotal = q.items.reduce((sum, it) => sum + Number(it.total), 0);
      q.tax      = Number(((q.subTotal * q.taxRate) / 100).toFixed(2));
      q.total    = Number((q.subTotal + q.tax - q.discount).toFixed(2));

      // 6) Persist quotation + items
      return tx.save(q);
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
