import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Quotation } from '../quotation.entity';

@Entity('quotation_items')
export class QuotationItem {
  @ApiProperty({ description: 'Primary key as UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Item name' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Item description' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'Item quantity' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @ApiProperty({ description: 'Item unit price' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ApiProperty({ description: 'Item total price' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @ApiProperty({ description: 'Item total' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @ApiProperty({ description: 'Item tax rate' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @ApiProperty({ description: 'Item tax amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @ApiProperty({ description: 'Item discount rate' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountRate: number;

  @ApiProperty({ description: 'Item discount amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @ApiProperty({ description: 'Item final price' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalPrice: number;

  @Column('uuid')
  quotationId: string;

  @ManyToOne(() => Quotation, quotation => quotation.items)
  @JoinColumn({ name: 'quotationId' })
  quotation: Quotation;
} 