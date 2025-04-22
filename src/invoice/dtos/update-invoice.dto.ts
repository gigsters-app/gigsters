// src/invoice/dto/update-invoice.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateInvoiceDto } from './create-invoice.dto';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}
