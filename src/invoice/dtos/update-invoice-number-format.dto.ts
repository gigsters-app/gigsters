import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, Min, MaxLength, IsOptional } from 'class-validator';

export class UpdateInvoiceNumberFormatDto {
  @ApiPropertyOptional({
    description: 'Prefix for invoice numbers (e.g., "INV", "GP", "FSG")',
    example: 'INV',
  })
  @IsString()
  @MaxLength(10)
  @IsOptional()
  prefix?: string;

  @ApiPropertyOptional({
    description: 'Separator between prefix and number (e.g., "-", "/", "")',
    example: '-',
  })
  @IsString()
  @MaxLength(5)
  @IsOptional()
  separator?: string;

  @ApiPropertyOptional({
    description: 'Number of digits to pad the sequence number',
    example: 5,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  paddingDigits?: number;

  @ApiPropertyOptional({
    description: 'Starting number for the sequence',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  startNumber?: number;

  @ApiPropertyOptional({
    description: 'Whether to include year in the invoice number',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  includeYear?: boolean;

  @ApiPropertyOptional({
    description: 'Year separator (if includeYear is true)',
    example: '-',
  })
  @IsString()
  @MaxLength(5)
  @IsOptional()
  yearSeparator?: string;

  @ApiPropertyOptional({
    description: 'Whether this is a custom format (allows year to be optional)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isCustomFormat?: boolean;
} 