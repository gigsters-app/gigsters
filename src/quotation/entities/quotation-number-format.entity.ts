import { Entity, PrimaryColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('quotation_number_formats')
export class QuotationNumberFormat {
  @PrimaryColumn('uuid')
  businessProfileId: string;

  @ApiProperty({
    description: 'Prefix for quotation numbers (e.g., "QUO", "GP", "FSG")',
    example: 'QUO',
  })
  @Column({ length: 10, default: 'QUO' })
  prefix: string;

  @ApiProperty({
    description: 'Separator between prefix and number (e.g., "-", "/", "")',
    example: '-',
  })
  @Column({ length: 5, default: '-' })
  separator: string;

  @ApiProperty({
    description: 'Number of digits to pad the sequence number',
    example: 3,
  })
  @Column({ type: 'int', default: 3 })
  paddingDigits: number;

  @ApiProperty({
    description: 'Starting number for the sequence',
    example: 1,
  })
  @Column({ type: 'int', default: 1 })
  startNumber: number;

  @ApiProperty({
    description: 'Whether to include year in the quotation number',
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