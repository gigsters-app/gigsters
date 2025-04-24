import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Quotation } from '../quotation.entity';

@Entity('quotation_client_snapshots')
export class ClientSnapshot {
  @ApiProperty({ description: 'Primary key as UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'quotation_id' })
  quotationId: string;

  @ApiProperty({ description: 'Client name' })
  @Column({ length: 255, update: false })
  name: string;

  @ApiProperty({ description: 'Client email' })
  @Column({ length: 255, update: false })
  email: string;

  @ApiProperty({ description: 'Client phone number' })
  @Column({ length: 50, update: false })
  phone: string;

  @ApiProperty({ description: 'Client address' })
  @Column({ type: 'text', update: false })
  address: string;

  @ApiProperty({ description: 'Client tax number' })
  @Column({ length: 100, nullable: true, update: false })
  taxNumber?: string;

  @ApiProperty({ description: 'Client registration number' })
  @Column({ length: 100, nullable: true, update: false })
  registrationNumber?: string;

  @OneToOne(() => Quotation, q => q.clientSnapshot, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quotation_id' })
  quotation: Quotation;
} 