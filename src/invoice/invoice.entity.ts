import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessProfile } from '../business-profile/business-profile.entity';
import { InvoiceItem }     from 'src/invoice-item/invoice-item.entity';
import { Client }          from 'src/client/client.entity';

export enum InvoiceStatus {
  DRAFT     = 'DRAFT',
  PENDING   = 'PENDING',
  PAID      = 'PAID',
  OVERDUE   = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class Invoice {
  // ─── Primary Invoice Fields ──────────────────────────────────────────────

  @ApiProperty({ description: 'Primary key as UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
  @Column('decimal', { precision: 12, scale: 2 })
  total: number;

  @ApiProperty({ description: 'Optional notes', example: 'Thank you for your business!', required: false })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({ description: 'Payment terms or conditions', required: false })
  @Column({ type: 'text', nullable: true })
  terms?: string;


  // ─── BusinessProfile Snapshot Fields ────────────────────────────────────



  @ApiProperty({ description: 'Profile type', example: 'company' })
  @Column({ length: 20 })
  businessProfileType: 'individual' | 'company';

  @ApiProperty({ description: 'Display name', example: 'Acme Co.' })
  @Column({ length: 255 })
  businessDisplayName: string;

  @ApiProperty({ description: 'Legal name', example: 'Acme Corporation' })
  @Column({ length: 255 })
  businessLegalName: string;

  @ApiProperty({ description: 'Job position (optional)', required: false })
  @Column({ length: 100, nullable: true })
  businessJobPosition?: string;

  @ApiProperty({ description: 'Title (optional)', required: false })
  @Column({ length: 100, nullable: true })
  businessTitle?: string;

  @ApiProperty({ description: 'Mobile number', example: '+1234567890' })
  @Column({ length: 20 })
  businessMobile: string;

  @ApiProperty({ description: 'Phone (optional)', required: false })
  @Column({ length: 20, nullable: true })
  businessPhone?: string;

  @ApiProperty({ description: 'Website (optional)', required: false, example: 'https://acme.co' })
  @Column({ length: 255, nullable: true })
  businessWebsite?: string;

  @ApiProperty({ description: 'VAT number', example: 'VAT-123456' })
  @Column({ length: 100 })
  businessVatNumber: string;

  @ApiProperty({ description: 'Street address', example: '123 Main St.' })
  @Column({ length: 255 })
  businessStreet: string;

  @ApiProperty({ description: 'Address line 2 (optional)', required: false })
  @Column({ length: 255, nullable: true })
  businessStreet2?: string;

  @ApiProperty({ description: 'City', example: 'Muscat' })
  @Column({ length: 100 })
  businessCity: string;

  @ApiProperty({ description: 'State (optional)', required: false })
  @Column({ length: 100, nullable: true })
  businessState?: string;

  @ApiProperty({ description: 'ZIP/postal code (optional)', required: false })
  @Column({ length: 20, nullable: true })
  businessZip?: string;

  @ApiProperty({ description: 'Country', example: 'Oman' })
  @Column({ length: 100 })
  businessCountry: string;

  @ApiProperty({ description: 'Company logo URL (optional)', required: false })
  @Column({ length: 255, nullable: true })
  businessCompanyLogo?: string;

  @ApiProperty({ description: 'License number (optional)', required: false })
  @Column({ length: 100, nullable: true })
  businessLicenseNumber?: string;

 // ─── Client Snapshot Fields ─────────────────────────────────────────────
 @ApiProperty({ description: 'Snapshot of client name', example: 'Acme Corp' })
 @Column({ length: 255, nullable: true })
 clientName?: string;

 @ApiProperty({ description: 'Snapshot of client contact person', example: 'Jane Doe', required: false })
 @Column({ length: 255, nullable: true })
 clientContactName?: string;

 @ApiProperty({ description: 'Snapshot of client email', example: 'jane@acme.com', required: false })
 @Column({ length: 255, nullable: true })
 clientEmail?: string;

 @ApiProperty({ description: 'Snapshot of client phone', example: '+1234567890', required: false })
 @Column({ length: 20, nullable: true })
 clientPhone?: string;

 @ApiProperty({ description: 'Snapshot of client country', example: 'Oman', required: false })
 @Column({ length: 100, nullable: true })
 clientCountry?: string;

 @ApiProperty({ description: 'Snapshot of client address block', required: false })
 @Column({ type: 'text', nullable: true })
 clientAddress?: string;

 @ApiProperty({ description: 'Snapshot of client VAT number', example: 'VAT-987654', required: false })
 @Column({ length: 100, nullable: true })
 clientVatNumber?: string;

 // ─── Relation & FK for Client ────────────────────────────────────────────
 @ApiProperty({ description: 'Foreign-key to live Client entity', required: false, format: 'uuid' })
 @Column('uuid', { nullable: true })
 clientId?: string;

 @ManyToOne(() => Client, { nullable: true, onDelete: 'SET NULL' })
 @JoinColumn({ name: 'clientId' })
 client?: Client;

  // ─── Relations & Line‑Items ─────────────────────────────────────────────

  @ManyToOne(() => BusinessProfile, bp => bp.invoices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessProfileId' })
  businessProfile: BusinessProfile;
  



  @ApiProperty({ type: () => [InvoiceItem], description: 'Line items for this invoice' })
  @OneToMany(() => InvoiceItem, item => item.invoice, { cascade: true })
  items: InvoiceItem[];


  // ─── Timestamps ─────────────────────────────────────────────────────────

  @ApiProperty({ description: 'Timestamp when created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
