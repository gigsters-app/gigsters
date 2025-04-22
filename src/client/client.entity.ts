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
  
  @Entity()
  export class Client {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    name: string;              // e.g. “Acme Corp” or “John Doe”
  
    @Column({ nullable: true })
    contactName?: string;      // e.g. the person to address invoices to
  
    @Column({ nullable: true, unique: true })
    email?: string;
  
    @Column({ nullable: true })
    phone?: string;

    @Column()                   // ← new field
    country: string;
  
    @Column({ type: 'text', nullable: true })
    address?: string;          // free‑form address block
  
    @Column({ nullable: true })
    vatNumber?: string;        // if you bill clients with VAT
  
    @ManyToOne(() => BusinessProfile, bp => bp.clients, { onDelete: 'CASCADE' })
    businessProfile: BusinessProfile;
    
    @OneToMany(() => Quotation, quotation => quotation.client, {
      cascade: true,    // optional: if you delete a client, also delete its quotations
    })
    quotations: Quotation[];
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
  }
  