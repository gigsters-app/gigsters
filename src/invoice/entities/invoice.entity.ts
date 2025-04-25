// src/invoice/entities/invoice.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';


import { BusinessSnapshot } from './invoice-business-snapshot.entity';
import { ClientSnapshot } from './invoice-client-snapshot.entity';
import { InvoiceItem } from './invoice-item.entity';
import { BusinessProfile } from 'src/business-profile/business-profile.entity';

export enum InvoiceStatus {
  DRAFT     = 'DRAFT',
  PENDING   = 'PENDING',
  PAID      = 'PAID',
  OVERDUE   = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

@Entity('invoices')
export class Invoice {
  @ApiProperty({ description: 'Primary key as UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─── Core Invoice Fields ─────────────────────────────
  @ApiProperty({ description: 'Invoice title', example: 'Website redesign' })
  @Column({ length: 255 })
  title: string;

  @ApiProperty({ description: 'Unique invoice number', example: 'INV-1001' })
  @Column({ unique: true })
  invoiceNumber: string;

  @ApiProperty({ description: 'Date when invoice was issued' })
  @Column('date')
  issueDate: Date;

  @ApiProperty({ description: 'Date when payment is due' })
  @Column('date')
  dueDate: Date;

  @ApiProperty({
    description: 'Current status of the invoice',
    enum: InvoiceStatus,
    example: InvoiceStatus.PENDING,
  })
  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @Column({ length: 3, default: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Subtotal before tax and discount', example: 1500.00 })
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  subTotal: number;

  @ApiProperty({ description: 'Total tax amount', example: 225.00 })
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  tax: number;

  @ApiProperty({ description: 'Tax rate as percentage', example: 15.0 })
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @ApiProperty({ description: 'Discount amount applied', example: 50.00 })
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  discount: number;

  @ApiProperty({ description: 'Total amount due', example: 1675.00 })
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  total: number;

  @ApiProperty({ description: 'Optional notes', example: 'Thank you for your business!', required: false })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({ description: 'Payment terms or conditions', required: false })
  @Column({ type: 'text', nullable: true })
  terms?: string;

  @Column('uuid')
  businessProfileId: string;


 // ← update your relation to use that column:
 @ManyToOne(() => BusinessProfile, bp => bp.invoices, {
  onDelete: 'CASCADE',
})
@JoinColumn({ name: 'businessProfileId' })
businessProfile: BusinessProfile;
  // ─── Snapshot Relations ─────────────────────────────
  @ApiProperty({ description: 'Business snapshot record' })
  @OneToOne(() => BusinessSnapshot, bs => bs.invoice, {
    cascade: ['insert'],
    eager: true,
  })
  @JoinColumn({ name: 'businessSnapshotId' })
  businessSnapshot: BusinessSnapshot;

  @ApiProperty({ description: 'Client snapshot record', required: false })
  @OneToOne(() => ClientSnapshot, cs => cs.invoice, {
    cascade: ['insert'],
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'clientSnapshotId' })
  clientSnapshot?: ClientSnapshot;

  // ─── Line Items & Timestamps ───────────────────────
  @ApiProperty({ type: () => [InvoiceItem], description: 'Line items' })
  @OneToMany(() => InvoiceItem, item => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @ApiProperty({ description: 'Created at' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  @UpdateDateColumn()
  updatedAt: Date;
}
