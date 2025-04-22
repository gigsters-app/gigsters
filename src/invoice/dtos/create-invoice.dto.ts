// src/invoice/dto/create-invoice.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '../invoice.entity';
import { CreateInvoiceItemDto } from 'src/invoice-item/dtos/create-invoice-item.dto';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'ID of the BusinessProfile issuing this invoice',
    format: 'uuid',
    example: 'a3f1c5d2-4e6b-11ec-81d3-0242ac130003',
  })
  @IsUUID()
  businessProfileId: string;

  @ApiProperty({
    description: 'Human‑readable title or subject of the invoice',
    example: 'Web Dev Services – May 2025',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Unique invoice number/code',
    example: 'INV-2025-0001',
  })
  @IsString()
  invoiceNumber: string;

  @ApiProperty({
    description: 'Date the invoice is issued (ISO 8601 date)',
    format: 'date',
    example: '2025-05-01',
  })
  @IsDateString()
  issueDate: string;

  @ApiProperty({
    description: 'Due date for payment (ISO 8601 date)',
    format: 'date',
    example: '2025-05-15',
  })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({
    description: 'Status of the invoice',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    description: 'Currency (ISO 4217 code)',
    example: 'USD',
    default: 'USD',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Tax rate to apply (percentage)',
    example: 5,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional({
    description: 'Flat discount amount to subtract',
    example: 50,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({
    description: 'Additional notes on the invoice',
    example: 'Thank you for your business!',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Payment terms or T&C text',
    example: 'Net 30 days',
  })
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiPropertyOptional({
    description: 'UUID of the client to bill',
    format: 'uuid',
    example: 'b4f2a6e3-5f7c-11ec-81d3-0242ac130003',
  })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiProperty({
    description: 'Line items on this invoice (at least one)',
    type: [CreateInvoiceItemDto],
    minItems: 1,
    example: [
      { description: 'Logo design services', quantity: 2, unitPrice: 150.5 },
      { description: 'Website hosting (6 months)', quantity: 6, unitPrice: 10 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
