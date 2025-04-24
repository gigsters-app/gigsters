import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('quotation_counters')
export class QuotationCounter {
  @PrimaryColumn('uuid')
  businessProfileId: string;

  @Column({ type: 'int' })
  lastNumber: number;
} 