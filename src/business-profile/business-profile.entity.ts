import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
  } from 'typeorm';
  import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/user.entity';
import { BusinessItem } from 'src/business-item/business-item.entity';
import { Client } from 'src/client/client.entity';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { Quotation } from 'src/quotation/quotation.entity';
  
  @Entity('business_profiles')
  export class BusinessProfile {
    @ApiProperty({ format: 'uuid' })
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ApiProperty({ example: 'company', enum: ['individual', 'company'] })
    @Column()
    profileType: 'individual' | 'company';
  
    @ApiProperty()
    @Column()
    displayName: string;
  
    @ApiProperty()
    @Column({unique: true})
    legalName: string;
  
    @ApiProperty({ required: false })
    @Column({ nullable: true })
    jobPosition?: string;
  
    @ApiProperty({ required: false })
    @Column({ nullable: true })
    title?: string;
  
    @ApiProperty()
    @Column({unique: true})
    mobile: string;
  
    @ApiProperty({ required: false })
    @Column({ nullable: true,unique: true })
    phone?: string;
  
    @ApiProperty({ required: false })
    @Column({ nullable: true })
    website?: string;
  
    @ApiProperty()
    @Column({unique: true})
    vatNumber: string;
  
    @ApiProperty()
    @Column()
    street: string;
  
    @ApiProperty({ required: false })
    @Column({ nullable: true })
    street2?: string;
  
    @ApiProperty()
    @Column()
    city: string;
  
    @ApiProperty({ required: false })
    @Column({ nullable: true })
    state?: string;
  
    @ApiProperty({ required: false })
    @Column({ nullable: true })
    zip?: string;
  
    @ApiProperty()
    @Column()
    country: string;
  
    @ApiProperty({ required: false })
    @Column({ nullable: true })
    companyLogo?: string;
  
    @ApiProperty({ required: false })
    @Column({ nullable: true ,unique: true})
    licenseNumber?: string;

    // Bank Details
    @ApiProperty({ required: false, description: 'Name of the bank' })
    @Column({ nullable: true })
    bankName?: string;

    @ApiProperty({ required: false, description: 'Bank account number' })
    @Column({ nullable: true })
    bankAccountNumber?: string;

    @ApiProperty({ required: false, description: 'International Bank Account Number (IBAN)' })
    @Column({ nullable: true })
    iban?: string;

    @ApiProperty({ required: false, description: 'SWIFT/BIC code' })
    @Column({ nullable: true })
    swiftBic?: string;

    @ApiProperty({ required: false, description: 'Bank branch code or routing number' })
    @Column({ nullable: true })
    bankBranchCode?: string;

    @ApiProperty({ required: false, description: 'Bank address' })
    @Column({ nullable: true })
    bankAddress?: string;

    @ApiProperty({ required: false, description: 'Bank city' })
    @Column({ nullable: true })
    bankCity?: string;

    @ApiProperty({ required: false, description: 'Bank country' })
    @Column({ nullable: true })
    bankCountry?: string;

    @ApiProperty({ required: false, description: 'Fiscal year start month (1-12)', example: 4 })
    @Column({ type: 'int', default: 1, nullable: true })
    fiscalYearStartMonth?: number;

    @ApiProperty({ required: false, description: 'Fiscal year start day (1-31)', example: 1 })
    @Column({ type: 'int', default: 1, nullable: true })
    fiscalYearStartDay?: number;

    @ApiProperty({ required: false, description: 'Fiscal year end month (1-12)', example: 3 })
    @Column({ type: 'int', default: 12, nullable: true })
    fiscalYearEndMonth?: number;

    @ApiProperty({ required: false, description: 'Fiscal year end day (1-31)', example: 31 })
    @Column({ type: 'int', default: 31, nullable: true })
    fiscalYearEndDay?: number;

      /**
   * Indicates whether the business profile is active.
   * Set to `false` to disable the profile without deleting it.
   */
  @ApiProperty({ description: 'Flag indicating if the profile is active', default: true })
  @Column({ default: true })
  isActive: boolean;
  
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
  
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
  
    @ApiProperty({ required: false })
    @Column({ nullable: true })
    updatedBy?: string;

    @ManyToOne(() => User, (user) => user.businessProfiles, { onDelete: 'CASCADE' })
    user: User;

    @Column({ type: 'uuid' , unique: true})
    userId: string;

    @OneToMany(() => BusinessItem, item => item.businessProfile, { cascade: true })
    catalogItems: BusinessItem[];

    @OneToMany(() => Client, client => client.businessProfile, { cascade: true })
    clients: Client[];

    @OneToMany(() => Invoice, invoice => invoice.businessProfile, { cascade: true })
    invoices: Invoice[];

    @OneToMany(() => Quotation, quotation => quotation.businessProfile, { cascade: true })
    quotations: Quotation[];
  }
  