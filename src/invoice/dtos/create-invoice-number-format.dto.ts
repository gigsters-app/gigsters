import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, Min, MaxLength, IsOptional } from 'class-validator';

export class CreateInvoiceNumberFormatDto {
  @ApiProperty({
    description: 'Prefix for invoice numbers (e.g., "INV", "GP", "FSG")',
    example: 'INV',
  })
  @IsString()
  @MaxLength(10)
  prefix: string;

  @ApiProperty({
    description: 'Separator between prefix and number (e.g., "-", "/", "")',
    example: '-',
  })
  @IsString()
  @MaxLength(5)
  separator: string;

  @ApiProperty({
    description: 'Number of digits to pad the sequence number',
    example: 5,
  })
  @IsInt()
  @Min(1)
  paddingDigits: number;

  @ApiProperty({
    description: 'Starting number for the sequence',
    example: 1,
  })
  @IsInt()
  @Min(1)
  startNumber: number;

  @ApiProperty({
    description: 'Whether to include year in the invoice number',
    example: true,
  })
  @IsBoolean()
  includeYear: boolean;

  @ApiProperty({
    description: 'Year separator (if includeYear is true)',
    example: '-',
  })
  @IsString()
  @MaxLength(5)
  yearSeparator: string;

  @ApiProperty({
    description: 'Whether this is a custom format (allows year to be optional)',
    example: false,
  })
  @IsBoolean()
  isCustomFormat: boolean;
} 