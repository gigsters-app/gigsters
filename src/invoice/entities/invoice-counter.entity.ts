// src/invoice/entities/invoice-counter.entity.ts
import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('invoice_counters')
export class InvoiceCounter {
  @PrimaryColumn('uuid')
  businessProfileId: string;

  @Column('bigint', { default: 0 })
  lastNumber: number;

  @Column({ nullable: true })
  fiscalYearLabel: string;

  @Column({ type: 'int', nullable: true })
  fiscalYearStart: number;

  @Column({ type: 'int', nullable: true })
  fiscalYearEnd: number;
}
