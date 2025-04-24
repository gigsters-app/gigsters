// src/invoice/invoice.service.ts

import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { EntityManager, QueryFailedError } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';

import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { BusinessProfile } from 'src/business-profile/business-profile.entity';
import { CreateInvoiceDto } from './dtos/create-invoice.dto';
import { UpdateInvoiceDto } from './dtos/update-invoice.dto';
import { Client } from 'src/client/client.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { BusinessSnapshot } from './entities/invoice-business-snapshot.entity';
import { ClientSnapshot } from './entities/invoice-client-snapshot.entity';
import { BusinessItem } from 'src/business-item/business-item.entity';
import { InvoiceCounter } from './entities/invoice-counter.entity';
import { InvoiceNumberFormat } from './entities/invoice-number-format.entity';
import { UpdateInvoiceNumberFormatDto } from './dtos/update-invoice-number-format.dto';
import { CreateInvoiceNumberFormatDto } from './dtos/create-invoice-number-format.dto';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}
/**
   * Retrieve a single Invoice by ID, including its snapshots and line items.
   */
async findOne(invoiceId: string): Promise<Invoice> {
  const invoice = await this.entityManager.findOne(Invoice, {
    where: { id: invoiceId },
    relations: [
      'businessSnapshot',
      'clientSnapshot',
      'items',
    ],
  });

  if (!invoice) {
    throw new NotFoundException(
      `Invoice with ID "${invoiceId}" not found.`,
    );
  }

  return invoice;
}

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
   * Get or create invoice number format for a business profile
   */
  async getInvoiceNumberFormat(businessProfileId: string): Promise<InvoiceNumberFormat> {
    let format = await this.entityManager.findOne(InvoiceNumberFormat, {
      where: { businessProfileId },
    });

    if (!format) {
      format = this.entityManager.create(InvoiceNumberFormat, {
        businessProfileId,
      });
      format = await this.entityManager.save(format);
    }

    return format;
  }

  /**
   * Update invoice number format for a business profile
   */
  async updateInvoiceNumberFormat(
    businessProfileId: string,
    dto: UpdateInvoiceNumberFormatDto,
  ): Promise<InvoiceNumberFormat> {
    const format = await this.getInvoiceNumberFormat(businessProfileId);
    
    // If setting to custom format, allow year to be optional
    if (dto.isCustomFormat !== undefined) {
      format.isCustomFormat = dto.isCustomFormat;
    }
    
    // If not custom format, force year inclusion
    if (!format.isCustomFormat) {
      format.includeYear = true;
    }
    
    // Update other fields
    Object.assign(format, dto);
    
    return this.entityManager.save(format);
  }

  /**
   * Generate invoice number based on format and counter
   */
  private generateInvoiceNumber(
    format: InvoiceNumberFormat,
    counter: InvoiceCounter,
  ): string {
    const year = new Date().getFullYear();
    const paddedNumber = String(counter.lastNumber).padStart(format.paddingDigits, '0');
    
    let invoiceNumber = `${format.prefix}${format.separator}`;
    
    // Always include year for default format, optional for custom
    if (format.includeYear || !format.isCustomFormat) {
      invoiceNumber += `${year}${format.yearSeparator}`;
    }
    
    invoiceNumber += paddedNumber;
    
    return invoiceNumber;
  }

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    try {
      return await this.entityManager.transaction(async manager => {
        // ── A) Get format and counter ─────────────────────────────
        const format = await this.getInvoiceNumberFormat(dto.businessProfileId);
        let counter = await manager.findOne(InvoiceCounter, {
          where: { businessProfileId: dto.businessProfileId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!counter) {
          counter = manager.create(InvoiceCounter, {
            businessProfileId: dto.businessProfileId,
            lastNumber: format.startNumber,
          });
        } else {
          counter.lastNumber++;
        }
        await manager.save(counter);

        // ── B) Generate invoiceNumber ───────────────────────────
        const generatedInvoiceNumber = this.generateInvoiceNumber(format, counter);

        // ── 1) Load and validate BusinessProfile ────────────────────
        const businessProfile = await manager.findOne(BusinessProfile, {
          where: { id: dto.businessProfileId },
        });
        if (!businessProfile) {
          throw new NotFoundException(
            `Business profile "${dto.businessProfileId}" not found.`
          );
        }

        // ── 2) Load or create Client ───────────────────────────────
        let client: Client;
        if (dto.clientId) {
          const existingClient = await manager.findOne(Client, {
            where: { id: dto.clientId },
            relations: ['businessProfile'],
          });
          if (
            !existingClient ||
            existingClient.businessProfile.id !== businessProfile.id
          ) {
            throw new NotFoundException(
              `Client "${dto.clientId}" not found under this business profile.`
            );
          }
          client = existingClient;
        } else {
          if (dto.client?.email) {
            const dup = await manager.findOne(Client, {
              where: { email: dto.client.email },
            });
            if (dup) {
              throw new ConflictException(
                `A client with email "${dto.client.email}" already exists.`
              );
            }
          }
          client = manager.create(Client, {
            ...dto.client!,
            businessProfile,
          });
          client = await manager.save(client);
        }

        // ── 3) Create the Invoice record ────────────────────────────
        const invoice = manager.create(Invoice, {
          title:             dto.title,
          invoiceNumber:     generatedInvoiceNumber,
          issueDate:         new Date(dto.issueDate),
          dueDate:           new Date(dto.dueDate),
          status:            dto.status ?? InvoiceStatus.DRAFT,
          currency:          dto.currency ?? 'USD',
          businessProfile,
          businessProfileId: businessProfile.id,
          notes:             dto.notes,
          terms:             dto.terms,
        });
        await manager.save(invoice);

        // ── 4) Create and save snapshots ────────────────────────────
        const businessSnapshot = manager.create(BusinessSnapshot, {
          invoice,
          profileType:   businessProfile.profileType,
          displayName:   businessProfile.displayName,
          legalName:     businessProfile.legalName,
          jobPosition:   businessProfile.jobPosition,
          title:         businessProfile.title,
          mobile:        businessProfile.mobile,
          phone:         businessProfile.phone,
          website:       businessProfile.website,
          vatNumber:     businessProfile.vatNumber,
          street:        businessProfile.street,
          street2:       businessProfile.street2,
          city:          businessProfile.city,
          state:         businessProfile.state,
          zip:           businessProfile.zip,
          country:       businessProfile.country,
          companyLogo:   businessProfile.companyLogo,
          licenseNumber: businessProfile.licenseNumber,
          // Bank Details
          bankName:      businessProfile.bankName,
          bankAccountNumber: businessProfile.bankAccountNumber,
          iban:          businessProfile.iban,
          swiftBic:      businessProfile.swiftBic,
          bankBranchCode: businessProfile.bankBranchCode,
          bankAddress:   businessProfile.bankAddress,
          bankCity:      businessProfile.bankCity,
          bankCountry:   businessProfile.bankCountry,
        });
        const savedBusinessSnapshot = await manager.save(businessSnapshot);

        const clientSnapshot = manager.create(ClientSnapshot, {
          invoice,
          name:        client.name,
          contactName: client.contactName,
          email:       client.email,
          phone:       client.phone,
          country:     client.country,
          address:     client.address,
          vatNumber:   client.vatNumber,
        });
        const savedClientSnapshot = await manager.save(clientSnapshot);

        invoice.businessSnapshot = savedBusinessSnapshot;
        invoice.clientSnapshot   = savedClientSnapshot;
        await manager.save(invoice);

        // ── 5) Process InvoiceItems and subtotal ──────────────────
        let subTotal = 0;
        for (const itemDto of dto.items) {
          let businessItem: BusinessItem;
          if (itemDto.businessItemId) {
            const found = await manager.findOne(BusinessItem, {
              where: {
                id: itemDto.businessItemId,
                businessProfile: { id: businessProfile.id },
              },
            });
            if (!found) {
              throw new NotFoundException(
                `Business item "${itemDto.businessItemId}" not found.`
              );
            }
            businessItem = found;
          } else {
            const existing = await manager.findOne(BusinessItem, {
              where: {
                name: itemDto.description,
                businessProfile: { id: businessProfile.id },
              },
            });
            if (existing) {
              businessItem = existing;
            } else {
              businessItem = manager.create(BusinessItem, {
                name:             itemDto.description,
                defaultUnitPrice: itemDto.unitPrice!,
                businessProfile,
              });
              businessItem = await manager.save(businessItem);
            }
          }

          const unitPrice = Number(businessItem.defaultUnitPrice);
          const lineTotal = Number((unitPrice * itemDto.quantity).toFixed(2));
          const invoiceItem = manager.create(InvoiceItem, {
            invoice,
            description: businessItem.description ?? businessItem.name,
            quantity:    itemDto.quantity,
            unitPrice,
            total:       lineTotal,
          });
          await manager.save(invoiceItem);
          subTotal += lineTotal;
        }

        // ── 6) Compute totals & update ────────────────────────────
        const taxRate = dto.taxRate ?? 0;
        const discount = dto.discount ?? 0;
        const tax = Number(((subTotal * taxRate) / 100).toFixed(2));
        const total = Number((subTotal + tax - discount).toFixed(2));

        await manager.update(
          Invoice,
          { id: invoice.id },
          { subTotal, taxRate, tax, discount, total },
        );

        // ── 7) Return fully populated invoice ────────────────────
        return await manager.findOneOrFail(Invoice, {
          where: { id: invoice.id },
          relations: [
            'businessProfile',
            'businessSnapshot',
            'clientSnapshot',
            'items',
          ],
        });
      });
    } catch (error) {
      // Known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      // Handle unique constraint violations
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          `Duplicate entry: ${(error as any).driverError.sqlMessage}`
        );
      }
      // Fallback
      throw new InternalServerErrorException(
        `Failed to create invoice: ${error.message}`
      );
    }
  }

  /**
   * Create initial invoice number format for a business profile
   */
  async createInvoiceNumberFormat(
    businessProfileId: string,
    dto: CreateInvoiceNumberFormatDto,
  ): Promise<InvoiceNumberFormat> {
    // Check if format already exists
    const existingFormat = await this.entityManager.findOne(InvoiceNumberFormat, {
      where: { businessProfileId },
    });

    if (existingFormat) {
      throw new ConflictException(
        `Invoice number format already exists for business profile ${businessProfileId}`,
      );
    }

    // Create new format
    const format = this.entityManager.create(InvoiceNumberFormat, {
      businessProfileId,
      ...dto,
    });

    // If not custom format, force year inclusion
    if (!format.isCustomFormat) {
      format.includeYear = true;
    }

    return this.entityManager.save(format);
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
   * Update an existing invoice. Wrap in transaction for safety.
   */
  async update(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    return this.entityManager.transaction(async manager => {
      const invoice = await manager.findOne(Invoice, {
        where: { id },
        relations: ['businessProfile', 'clientSnapshot', 'items'],
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice ${id} not found`);
      }

      // Update basic fields
      if (dto.title) invoice.title = dto.title;
      if (dto.issueDate) invoice.issueDate = new Date(dto.issueDate);
      if (dto.dueDate) invoice.dueDate = new Date(dto.dueDate);
      if (dto.status) invoice.status = dto.status;
      if (dto.currency) invoice.currency = dto.currency;
      if (dto.notes) invoice.notes = dto.notes;
      if (dto.terms) invoice.terms = dto.terms;

      // Update tax rate and recalculate tax
      if (dto.taxRate !== undefined) {
        invoice.taxRate = dto.taxRate;
        invoice.tax = Number(((invoice.subTotal * dto.taxRate) / 100).toFixed(2));
      }

      // Update discount
      if (dto.discount !== undefined) {
        invoice.discount = dto.discount;
      }

      // Update items if provided
      if (dto.items && dto.items.length > 0) {
        // Remove existing items
        await manager.remove(invoice.items);

        // Add new items
        let subTotal = 0;
        for (const itemDto of dto.items) {
          let businessItem: BusinessItem;
          if (itemDto.businessItemId) {
            const found = await manager.findOne(BusinessItem, {
              where: {
                id: itemDto.businessItemId,
                businessProfile: { id: invoice.businessProfile.id },
              },
            });
            if (!found) {
              throw new NotFoundException(
                `Business item "${itemDto.businessItemId}" not found.`
              );
            }
            businessItem = found;
          } else {
            const existing = await manager.findOne(BusinessItem, {
              where: {
                name: itemDto.description,
                businessProfile: { id: invoice.businessProfile.id },
              },
            });
            if (existing) {
              businessItem = existing;
            } else {
              businessItem = manager.create(BusinessItem, {
                name: itemDto.description,
                defaultUnitPrice: itemDto.unitPrice!,
                businessProfile: invoice.businessProfile,
              });
              businessItem = await manager.save(businessItem);
            }
          }

          const unitPrice = Number(businessItem.defaultUnitPrice);
          const lineTotal = Number((unitPrice * itemDto.quantity).toFixed(2));
          const invoiceItem = manager.create(InvoiceItem, {
            invoice,
            description: businessItem.description ?? businessItem.name,
            quantity: itemDto.quantity,
            unitPrice,
            total: lineTotal,
          });
          await manager.save(invoiceItem);
          subTotal += lineTotal;
        }

        // Update totals
        invoice.subTotal = subTotal;
        invoice.tax = Number(((subTotal * invoice.taxRate) / 100).toFixed(2));
        invoice.total = Number((subTotal + invoice.tax - invoice.discount).toFixed(2));
      }

      return manager.save(invoice);
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
