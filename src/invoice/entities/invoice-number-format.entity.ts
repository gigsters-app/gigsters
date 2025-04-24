import { Entity, PrimaryColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invoice_number_formats')
export class InvoiceNumberFormat {
  @PrimaryColumn('uuid')
  businessProfileId: string;

  @ApiProperty({
    description: 'Prefix for invoice numbers (e.g., "INV", "GP", "FSG")',
    example: 'INV',
  })
  @Column({ length: 10, default: 'INV' })
  prefix: string;

  @ApiProperty({
    description: 'Separator between prefix and number (e.g., "-", "/", "")',
    example: '-',
  })
  @Column({ length: 5, default: '-' })
  separator: string;

  @ApiProperty({
    description: 'Number of digits to pad the sequence number',
    example: 5,
  })
  @Column({ type: 'int', default: 5 })
  paddingDigits: number;

  @ApiProperty({
    description: 'Starting number for the sequence',
    example: 1,
  })
  @Column({ type: 'int', default: 1 })
  startNumber: number;

  @ApiProperty({
    description: 'Whether to include year in the invoice number',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  includeYear: boolean;

  @ApiProperty({
    description: 'Year separator (if includeYear is true)',
    example: '-',
  })
  @Column({ length: 5, default: '-' })
  yearSeparator: string;

  @ApiProperty({
    description: 'Whether this is a custom format (allows year to be optional)',
    example: false,
  })
  @Column({ type: 'boolean', default: false })
  isCustomFormat: boolean;
} 