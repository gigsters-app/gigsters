// src/quotation/dto/create-quotation.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuotationStatus } from '../quotation.entity';
import { CreateQuotationItemDto } from 'src/quotation-item/dtos/create-quotation-item.dto';


export class CreateQuotationDto {
  @ApiProperty({
    description: 'UUID of the BusinessProfile issuing this quotation',
    format: 'uuid',
    example: 'a3f1c5d2-4e6b-11ec-81d3-0242ac130003',
  })
  @IsUUID()
  businessProfileId: string;

  @ApiProperty({
    description: 'Human‑readable title of the quotation',
    example: 'Website Proposal – May 2025',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Unique quotation number/code',
    example: 'QUO-2025-0001',
  })
  @IsString()
  quotationNumber: string;

  @ApiProperty({
    description: 'Date the quotation is issued (ISO date)',
    format: 'date',
    example: '2025-05-01',
  })
  @IsDateString()
  issueDate: string;

  @ApiProperty({
    description: 'Expiration date of the quotation (ISO date)',
    format: 'date',
    example: '2025-05-15',
  })
  @IsDateString()
  expirationDate: string;

  @ApiPropertyOptional({
    description: 'Status of the quotation',
    enum: QuotationStatus,
    default: QuotationStatus.DRAFT,
  })
  @IsEnum(QuotationStatus)
  @IsOptional()
  status?: QuotationStatus;

  @ApiProperty({
    description: 'UUID of the Client receiving this quotation',
    format: 'uuid',
    example: 'b4f2a6e3-5f7c-11ec-81d3-0242ac130003',
  })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'USD',
    default: 'USD',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Line items for this quotation',
    type: [CreateQuotationItemDto],
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items: CreateQuotationItemDto[];

  @ApiPropertyOptional({
    description: 'Tax rate to apply (percentage)',
    example: 5,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional({
    description: 'Flat discount amount to subtract',
    example: 100,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({
    description: 'Additional notes on the quotation',
    example: 'This quote is valid for 30 days',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Terms and conditions',
    example: 'Payment due within 30 days of acceptance',
  })
  @IsString()
  @IsOptional()
  terms?: string;
}
