// src/invoice/entities/invoice-client-snapshot.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
  } from 'typeorm';
  import { Invoice } from './invoice.entity';
  
  @Entity('invoice_client_snapshots')
  export class ClientSnapshot {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column('uuid', { name: 'invoice_id' })
    invoiceId: string;
  
    @Column({ length: 255, nullable: true, update: false })
    name?: string;
  
    @Column({ length: 255, nullable: true, update: false })
    contactName?: string;
  
    @Column({ length: 255, nullable: true, update: false })
    email?: string;
  
    @Column({ length: 20, nullable: true, update: false })
    phone?: string;
  
    @Column({ length: 100, nullable: true, update: false })
    country?: string;
  
    @Column({ type: 'text', nullable: true, update: false })
    address?: string;
  
    @Column({ length: 100, nullable: true, update: false })
    vatNumber?: string;
  
    @OneToOne(() => Invoice, inv => inv.clientSnapshot, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'invoice_id' })
    invoice: Invoice;
  }
  