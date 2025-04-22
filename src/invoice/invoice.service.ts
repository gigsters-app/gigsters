// src/invoice/invoice.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';

import { Invoice, InvoiceStatus } from './invoice.entity';
import { InvoiceItem } from 'src/invoice-item/invoice-item.entity';
import { BusinessProfile } from 'src/business-profile/business-profile.entity';
import { CreateInvoiceDto } from './dtos/create-invoice.dto';
import { UpdateInvoiceDto } from './dtos/update-invoice.dto';
import { Client } from 'src/client/client.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}


  async findFull(id: string): Promise<Invoice> {
    const invoice = await this.entityManager.findOne(Invoice, {
      where: { id },
      relations: [
        'businessProfile',
        'client',
        'items',
      ],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }
 /**
   * Create a new Invoice (and its items) in a single transaction,
   * now requiring a clientId that must belong to the same BusinessProfile.
   */
 async create(dto: CreateInvoiceDto): Promise<Invoice> {
  return this.entityManager.transaction(async tx => {
    // 1) Load and validate BusinessProfile
    const profile = await tx.findOne(BusinessProfile, {
      where: { id: dto.businessProfileId },
    });
    if (!profile) {
      throw new NotFoundException('BusinessProfile not found');
    }

    // 2) Load and validate Client
    const client = await tx.findOne(Client, {
      where: { id: dto.clientId },
      relations: ['businessProfile'],
    });
    if (!client || client.businessProfile.id !== profile.id) {
      throw new NotFoundException('Client not found for this BusinessProfile');
    }

    // 3) Build Invoice entity with profile‑ & client‑snapshot fields
    const invoice = tx.create(Invoice, {
      // ── invoice core fields ───────────────────────
      title:         dto.title,
      invoiceNumber: dto.invoiceNumber,
      issueDate:     new Date(dto.issueDate),
      dueDate:       new Date(dto.dueDate),
      status:        dto.status ?? InvoiceStatus.DRAFT,
      currency:      dto.currency ?? 'USD',
      taxRate:       dto.taxRate ?? 0,
      discount:      dto.discount ?? 0,
      notes:         dto.notes,
      terms:         dto.terms,

      // ── relation FKs ──────────────────────────────
      businessProfile: profile,
      client,
      clientId:        client.id,

      // ── profile snapshot ──────────────────────────
      businessProfileId:     profile.id,
      businessProfileType:   profile.profileType,
      businessDisplayName:   profile.displayName,
      businessLegalName:     profile.legalName,
      businessJobPosition:   profile.jobPosition,
      businessTitle:         profile.title,
      businessMobile:        profile.mobile,
      businessPhone:         profile.phone,
      businessWebsite:       profile.website,
      businessVatNumber:     profile.vatNumber,
      businessStreet:        profile.street,
      businessStreet2:       profile.street2,
      businessCity:          profile.city,
      businessState:         profile.state,
      businessZip:           profile.zip,
      businessCountry:       profile.country,
      businessCompanyLogo:   profile.companyLogo,
      businessLicenseNumber: profile.licenseNumber,

      // ── client snapshot ───────────────────────────
      clientName:        client.name,
      clientContactName: client.contactName,
      clientEmail:       client.email,
      clientPhone:       client.phone,
      clientCountry:     client.country,
      clientAddress:     client.address,
      clientVatNumber:   client.vatNumber,
    });

    // 4) Build InvoiceItem entities
    invoice.items = dto.items.map(i =>
      tx.create(InvoiceItem, {
        description: i.description,
        quantity:    i.quantity,
        unitPrice:   i.unitPrice,
        total:       i.quantity * i.unitPrice,
      }),
    );

    // 5) Calculate subtotals and totals
    invoice.subTotal = invoice.items.reduce((sum, it) => sum + Number(it.total), 0);
    invoice.tax     = Number(((invoice.subTotal * invoice.taxRate) / 100).toFixed(2));
    invoice.total   = Number((invoice.subTotal + invoice.tax - invoice.discount).toFixed(2));

    // 6) Persist (cascades into items)
    return tx.save(invoice);
  });
}




  /**
   * Fetch all invoices, including relations.
   */
  async findAll(): Promise<Invoice[]> {
    return this.entityManager.find(Invoice, {
      relations: ['businessProfile', 'items'],
    });
  }

  /**
   * Fetch a single invoice by ID.
   */
  async findOne(id: string): Promise<Invoice> {
    const inv = await this.entityManager.findOne(Invoice, {
      where: { id },
      relations: ['businessProfile', 'items'],
    });
    if (!inv) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return inv;
  }

  /**
   * Update an existing invoice. Wrap in transaction for safety.
   */
  async update(
    id: string,
    dto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    return this.entityManager.transaction(async tx => {
      const repo = tx.getRepository(Invoice);
      let invoice = await repo.findOne({
        where: { id },
        relations: ['businessProfile', 'items'],
      });
      if (!invoice) {
        throw new NotFoundException(`Invoice ${id} not found`);
      }

      // Merge simple fields
      repo.merge(invoice, dto);

      // If items were provided, you could delete old ones & recreate:
      if (dto.items) {
        await tx.delete(InvoiceItem, { invoice: { id } });
        invoice.items = dto.items.map(i =>
          tx.create(InvoiceItem, {
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.quantity * i.unitPrice,
          }),
        );

        // Recalculate subtotal & totals
        invoice.subTotal = invoice.items.reduce(
          (sum, it) => sum + Number(it.total),
          0,
        );
        invoice.tax = Number(
          ((invoice.subTotal * invoice.taxRate) / 100).toFixed(2),
        );
        invoice.total = Number(
          (invoice.subTotal + invoice.tax - invoice.discount).toFixed(2),
        );
      }

      return repo.save(invoice);
    });
  }

  /**
   * Delete an invoice by ID.
   */
  async remove(id: string): Promise<void> {
    const res = await this.entityManager.delete(Invoice, id);
    if (res.affected === 0) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
  }
}
