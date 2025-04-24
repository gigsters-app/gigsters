import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Quotation } from '../quotation.entity';

@Entity('quotation_business_snapshots')
export class BusinessSnapshot {
  @ApiProperty({ description: 'Primary key as UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'quotation_id' })
  quotationId: string;

  @ApiProperty({ description: 'Business name' })
  @Column({ length: 255, update: false })
  name: string;

  @ApiProperty({ description: 'Business legal name' })
  @Column({ length: 255, update: false })
  legalName: string;

  @ApiProperty({ description: 'Business registration number' })
  @Column({ length: 100, update: false })
  registrationNumber: string;

  @ApiProperty({ description: 'Business tax number' })
  @Column({ length: 100, update: false })
  taxNumber: string;

  @ApiProperty({ description: 'Business address' })
  @Column({ type: 'text', update: false })
  address: string;

  @ApiProperty({ description: 'Business phone number' })
  @Column({ length: 50, update: false })
  phone: string;

  @ApiProperty({ description: 'Business email' })
  @Column({ length: 255, update: false })
  email: string;

  @ApiProperty({ description: 'Business website' })
  @Column({ length: 255, nullable: true, update: false })
  website?: string;

  @ApiProperty({ description: 'Business logo URL' })
  @Column({ length: 255, nullable: true, update: false })
  logoUrl?: string;

  @OneToOne(() => Quotation, q => q.businessSnapshot, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quotation_id' })
  quotation: Quotation;
} 