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
import { Invoice } from 'src/invoice/invoice.entity';
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
  clients:       Client[];

  @OneToMany(() => Invoice, invoice => invoice.businessProfile, { cascade: true })
  invoices:      Invoice[];

  @OneToMany(() => Quotation, quotation => quotation.businessProfile, { cascade: true })
  quotations:    Quotation[];
  }
  