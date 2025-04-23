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



  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    try {
      return await this.entityManager.transaction(async manager => {
        // ── A) Lock & increment per-profile counter ─────────────────
        let counter = await manager.findOne(InvoiceCounter, {
          where: { businessProfileId: dto.businessProfileId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!counter) {
          counter = manager.create(InvoiceCounter, {
            businessProfileId: dto.businessProfileId,
            lastNumber: 1,
          });
        } else {
          counter.lastNumber++;
        }
        await manager.save(counter);

        // ── B) Generate invoiceNumber prefix ───────────────────────
        const year = new Date().getFullYear();
        const prefix = 'GP'; // Or derive from profile if desired
        const seq = String(counter.lastNumber).padStart(6, '0');
        const generatedInvoiceNumber = `${prefix}${year}-${seq}`;

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
  // async update(
  //   id: string,
  //   dto: UpdateInvoiceDto,
  // ): Promise<Invoice> {
  //   return this.entityManager.transaction(async tx => {
  //     const repo = tx.getRepository(Invoice);
  //     let invoice = await repo.findOne({
  //       where: { id },
  //       relations: ['businessProfile', 'items'],
  //     });
  //     if (!invoice) {
  //       throw new NotFoundException(`Invoice ${id} not found`);
  //     }

  //     // Merge simple fields
  //     repo.merge(invoice, dto);

  //     // If items were provided, you could delete old ones & recreate:
  //     if (dto.items) {
  //       await tx.delete(InvoiceItem, { invoice: { id } });
  //       invoice.items = dto.items.map(i =>
  //         tx.create(InvoiceItem, {
  //           description: i.description,
  //           quantity: i.quantity,
  //           unitPrice: i.unitPrice,
  //           total: i.quantity * i.unitPrice,
  //         }),
  //       );

  //       // Recalculate subtotal & totals
  //       invoice.subTotal = invoice.items.reduce(
  //         (sum, it) => sum + Number(it.total),
  //         0,
  //       );
  //       invoice.tax = Number(
  //         ((invoice.subTotal * invoice.taxRate) / 100).toFixed(2),
  //       );
  //       invoice.total = Number(
  //         (invoice.subTotal + invoice.tax - invoice.discount).toFixed(2),
  //       );
  //     }

  //     return repo.save(invoice);
  //   });
  // }

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
