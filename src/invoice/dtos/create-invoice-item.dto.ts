// src/invoice/dto/create-invoice-item.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsNumber,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateInvoiceItemDto {
  @ApiProperty({
    description: 'Use an existing BusinessItem by ID',
    required: false,
    example: 'c3f4g5h6-7i8j-9k0l-1m2n-34567890abcd',
  })
  @IsOptional()
  @IsUUID()
  businessItemId?: string;

  @ApiProperty({ description: 'Description of the line item', required: false })
  @ValidateIf(o => !o.businessItemId)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Unit price for a single item', example: 99.99, required: false })
  @ValidateIf(o => !o.businessItemId)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @ApiProperty({ description: 'Total price (computed)', example: 199.98, required: false })
  @ValidateIf(o => !o.businessItemId)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  total?: number;

  @ApiProperty({ description: 'Quantity of the item', example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

