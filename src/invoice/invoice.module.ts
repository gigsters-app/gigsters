import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoicePdfJsonService } from './invoice-pdf-json.service';

@Module({
  providers: [InvoiceService,InvoicePdfJsonService],
  controllers: [InvoiceController]
})
export class InvoiceModule {}
