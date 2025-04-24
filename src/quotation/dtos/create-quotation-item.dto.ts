import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID, IsString,
  IsInt, IsNumber, Min,
  IsOptional,
} from 'class-validator';

export class CreateQuotationItemDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional() @IsUUID() businessItemId?: string;

  @ApiPropertyOptional() @IsString() @IsOptional()
  description?: string;

  @ApiProperty({ example: 1 }) @IsInt() @Min(1)
  quantity: number;

  @ApiProperty({ example: 100.00 }) @IsNumber() @Min(0)
  unitPrice: number;
} 