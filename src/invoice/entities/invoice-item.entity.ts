import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
  } from 'typeorm';
import { Invoice } from './invoice.entity';

  
  @Entity()
  export class InvoiceItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    description: string;
  
    @Column('int')
    quantity: number;
  
    @Column('decimal', { precision: 12, scale: 2 })
    unitPrice: number;
  
    @Column('decimal', { precision: 12, scale: 2 })
    total: number;  // quantity * unitPrice
  
    @ManyToOne(() => Invoice, invoice => invoice.items, { onDelete: 'CASCADE' })
    invoice: Invoice;
  }
  