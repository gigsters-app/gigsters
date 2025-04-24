// src/invoice/entities/invoice-business-snapshot.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
  } from 'typeorm';
  import { Invoice } from './invoice.entity';
  
  @Entity('invoice_business_snapshots')
  export class BusinessSnapshot {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column('uuid', { name: 'invoice_id' })
    invoiceId: string;
  
    @Column({ length: 20, update: false })
    profileType: 'individual' | 'company';
  
    @Column({ length: 255, update: false })
    displayName: string;
  
    @Column({ length: 255, update: false })
    legalName: string;
  
    @Column({ length: 100, nullable: true, update: false })
    jobPosition?: string;
  
    @Column({ length: 100, nullable: true, update: false })
    title?: string;
  
    @Column({ length: 20, update: false })
    mobile: string;
  
    @Column({ length: 20, nullable: true, update: false })
    phone?: string;
  
    @Column({ length: 255, nullable: true, update: false })
    website?: string;
  
    @Column({ length: 100, update: false })
    vatNumber: string;
  
    @Column({ length: 255, update: false })
    street: string;
  
    @Column({ length: 255, nullable: true, update: false })
    street2?: string;
  
    @Column({ length: 100, update: false })
    city: string;
  
    @Column({ length: 100, nullable: true, update: false })
    state?: string;
  
    @Column({ length: 20, nullable: true, update: false })
    zip?: string;
  
    @Column({ length: 100, update: false })
    country: string;
  
    @Column({ length: 255, nullable: true, update: false })
    companyLogo?: string;
  
    @Column({ length: 100, nullable: true, update: false })
    licenseNumber?: string;

    // Bank Details
    @Column({ length: 100, nullable: true, update: false })
    bankName?: string;

    @Column({ length: 50, nullable: true, update: false })
    bankAccountNumber?: string;

    @Column({ length: 34, nullable: true, update: false })
    iban?: string;

    @Column({ length: 11, nullable: true, update: false })
    swiftBic?: string;

    @Column({ length: 50, nullable: true, update: false })
    bankBranchCode?: string;

    @Column({ length: 255, nullable: true, update: false })
    bankAddress?: string;

    @Column({ length: 100, nullable: true, update: false })
    bankCity?: string;

    @Column({ length: 100, nullable: true, update: false })
    bankCountry?: string;
  
    @OneToOne(() => Invoice, inv => inv.businessSnapshot, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'invoice_id' })
    invoice: Invoice;
  }
  