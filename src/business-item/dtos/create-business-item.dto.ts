// src/business-item/dto/create-business-item.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateBusinessItemDto {
  @ApiProperty({
    description: 'UUID of the BusinessProfile this item belongs to',
    format: 'uuid',
    example: 'a3f1c5d2-4e6b-11ec-81d3-0242ac130003',
  })
  @IsUUID()
  businessProfileId: string;

  @ApiProperty({
    description: 'Name of the business item',
    example: 'Website Design',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Optional detailed description',
    example: 'Design a fully responsive website',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Default price per unit',
    example: 1200.00,
  })
  @IsNumber()
  @Min(0)
  defaultUnitPrice: number;
}
