// src/client/client.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
  } from 'typeorm';
  import { BusinessProfile } from '../business-profile/business-profile.entity';
import { Quotation } from 'src/quotation/quotation.entity';
import { ApiProperty } from '@nestjs/swagger';
  
  @Entity()
  export class Client {
    @ApiProperty({ description: 'Primary key as UUID' })
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ApiProperty({ description: 'Client name' })
    @Column()
    name: string;              // e.g. "Acme Corp" or "John Doe"
  
    @ApiProperty({ description: 'Contact name', required: false })
    @Column({ nullable: true })
    contactName?: string;      // e.g. the person to address invoices to
  
    @ApiProperty({ description: 'Email address', required: false })
    @Column({ nullable: true, unique: true })
    email?: string;
  
    @ApiProperty({ description: 'Phone number', required: false })
    @Column({ nullable: true })
    phone?: string;

    @ApiProperty({ description: 'Country' })
    @Column()                   // ← new field
    country: string;
  
    @ApiProperty({ description: 'Address', required: false })
    @Column({ type: 'text', nullable: true })
    address?: string;          // free‑form address block
  
    @ApiProperty({ description: 'VAT number', required: false })
    @Column({ nullable: true })
    vatNumber?: string;        // if you bill clients with VAT
  
    @ApiProperty({ description: 'Business profile', type: () => BusinessProfile })
    @ManyToOne(() => BusinessProfile, bp => bp.clients, { onDelete: 'CASCADE' })
    businessProfile: BusinessProfile;
    
    @ApiProperty({ description: 'Quotations', type: () => [Quotation] })
    @OneToMany(() => Quotation, quotation => quotation.client, {
      cascade: true,    // optional: if you delete a client, also delete its quotations
    })
    quotations: Quotation[];

    @ApiProperty({ description: 'Created at' })
    @CreateDateColumn() 
    createdAt: Date;

    @ApiProperty({ description: 'Updated at' })
    @UpdateDateColumn() 
    updatedAt: Date;
  }
  