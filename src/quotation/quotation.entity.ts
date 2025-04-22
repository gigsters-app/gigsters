import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { BusinessProfile } from '../business-profile/business-profile.entity';
  import { Client }          from '../client/client.entity';
  import { QuotationItem }   from '../quotation-item/quotation-item.entity';
  
  export enum QuotationStatus {
    DRAFT     = 'DRAFT',
    SENT      = 'SENT',
    ACCEPTED  = 'ACCEPTED',
    REJECTED  = 'REJECTED',
    EXPIRED   = 'EXPIRED',
  }
  
  @Entity()
  export class Quotation {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ length: 255 })
    title: string;
  
    @Column({ unique: true })
    quotationNumber: string;
  
    @Column('date')
    issueDate: Date;
  
    @Column('date')
    expirationDate: Date;
  
    @Column({ type: 'enum', enum: QuotationStatus, default: QuotationStatus.DRAFT })
    status: QuotationStatus;
  
    @ManyToOne(() => BusinessProfile, bp => bp.quotations, { onDelete: 'CASCADE' })
    businessProfile: BusinessProfile;
  
    @ManyToOne(() => Client, { nullable: true, onDelete: 'SET NULL' })
    client?: Client;
  
    @Column('uuid', { nullable: true })
    clientId?: string;
  
    @Column({ length: 3, default: 'USD' })
    currency: string;
  
    @Column('decimal',{ precision: 12, scale: 2, default: 0 })
    subTotal: number;
  
    @Column('decimal',{ precision: 5, scale: 2, default: 0 })
    taxRate: number;
  
    @Column('decimal',{ precision: 12, scale: 2, default: 0 })
    tax: number;
  
    @Column('decimal',{ precision: 12, scale: 2, default: 0 })
    discount: number;
  
    @Column('decimal',{ precision: 12, scale: 2 })
    total: number;
  
    @Column({ type: 'text', nullable: true })
    notes?: string;
  
    @Column({ type: 'text', nullable: true })
    terms?: string;
  
    @OneToMany(() => QuotationItem, qi => qi.quotation, { cascade: true })
    items: QuotationItem[];
  
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;

   
  }
  