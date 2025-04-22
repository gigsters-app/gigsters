// src/business-item/business-item.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { BusinessProfile } from '../business-profile/business-profile.entity';

@Entity('business_items')
export class BusinessItem {
  @ApiProperty({
    description: 'Auto-generated UUID of the catalog item',
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Name of the item',
    example: 'Website Design',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Optional longer description of the item',
    example: 'Full responsive website design package',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Default unit price for this item',
    example: 1500.00,
    type: Number,
  })
  @Column('decimal', { precision: 12, scale: 2 })
  defaultUnitPrice: number;

  @ApiHideProperty()
  @ManyToOne(() => BusinessProfile, bp => bp.catalogItems, {
    onDelete: 'CASCADE',
  })
  businessProfile: BusinessProfile;

  @ApiProperty({
    description: 'Timestamp when this item was created',
    example: '2025-04-18T12:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when this item was last updated',
    example: '2025-04-18T12:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
