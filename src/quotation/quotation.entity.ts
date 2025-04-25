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
  
  import { BusinessSnapshot } from './entities/quotation-business-snapshot.entity';
  import { ClientSnapshot } from './entities/quotation-client-snapshot.entity';
  import { QuotationItem } from './entities/quotation-item.entity';
  import { BusinessProfile } from 'src/business-profile/business-profile.entity';
  import { Client } from 'src/client/client.entity';
  
  export enum QuotationStatus {
    DRAFT     = 'DRAFT',
    SENT      = 'SENT',
    ACCEPTED  = 'ACCEPTED',
    REJECTED  = 'REJECTED',
    EXPIRED   = 'EXPIRED',
    CANCELLED = 'CANCELLED',
    INVOICED  = 'INVOICED',
  }
  
  @Entity('quotations')
  export class Quotation {
    @ApiProperty({ description: 'Primary key as UUID' })
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    // ─── Core Quotation Fields ─────────────────────────────
    @ApiProperty({ description: 'Quotation title', example: 'Website redesign proposal' })
    @Column({ length: 255 })
    title: string;
  
    @ApiProperty({ description: 'Unique quotation number', example: 'QUO-1001' })
    @Column({ unique: true })
    quotationNumber: string;
  
    @ApiProperty({ description: 'Date when quotation was issued' })
    @Column('date')
    issueDate: Date;
  
    @ApiProperty({ description: 'Date when quotation expires' })
    @Column('date')
    expirationDate: Date;
  
    @ApiProperty({
      description: 'Current status of the quotation',
      enum: QuotationStatus,
      example: QuotationStatus.DRAFT,
    })
    @Column({ type: 'enum', enum: QuotationStatus, default: QuotationStatus.DRAFT })
    status: QuotationStatus;
  
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
  
    @ApiProperty({ description: 'Total amount', example: 1675.00 })
    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    total: number;
  
    @ApiProperty({ description: 'Optional notes', example: 'Thank you for your interest!', required: false })
    @Column({ type: 'text', nullable: true })
    notes?: string;
  
    @ApiProperty({ description: 'Terms and conditions', required: false })
    @Column({ type: 'text', nullable: true })
    terms?: string;
  
    @Column('uuid')
    businessProfileId: string;
  
    @ManyToOne(() => BusinessProfile, bp => bp.quotations, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'businessProfileId' })
    businessProfile: BusinessProfile;
  
    @ApiProperty({ description: 'Client ID' })
    @Column('uuid')
    clientId: string;
  
    @ApiProperty({ description: 'Client', type: () => Client })
    @ManyToOne(() => Client, client => client.quotations)
    @JoinColumn({ name: 'clientId' })
    client: Client;
  
    // ─── Snapshot Relations ─────────────────────────────
    @ApiProperty({ description: 'Business snapshot record' })
    @OneToOne(() => BusinessSnapshot, bs => bs.quotation, {
      cascade: ['insert'],
      eager: true,
    })
    @JoinColumn({ name: 'businessSnapshotId' })
    businessSnapshot: BusinessSnapshot;
  
    @ApiProperty({ description: 'Client snapshot record', required: false })
    @OneToOne(() => ClientSnapshot, cs => cs.quotation, {
      cascade: ['insert'],
      eager: true,
      nullable: true,
    })
    @JoinColumn({ name: 'clientSnapshotId' })
    clientSnapshot?: ClientSnapshot;
  
    // ─── Line Items & Timestamps ───────────────────────
    @ApiProperty({ type: () => [QuotationItem], description: 'Line items' })
    @OneToMany(() => QuotationItem, item => item.quotation, { cascade: true })
    items: QuotationItem[];
  
    @ApiProperty({ description: 'Created at' })
    @CreateDateColumn()
    createdAt: Date;
  
    @ApiProperty({ description: 'Updated at' })
    @UpdateDateColumn()
    updatedAt: Date;
  }
  