import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class QuotationToInvoiceDto {
  @ApiProperty({
    description: 'UUID of the quotation to convert',
    format: 'uuid',
    example: 'a3f1c5d2-4e6b-11ec-81d3-0242ac130003',
  })
  @IsUUID()
  quotationId: string;
} 