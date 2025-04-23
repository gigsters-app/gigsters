import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoicePdfService } from './invoice-pdf.service';
// import { InvoicePdfService } from './invoice-pdf-json.service';


@Module({
  providers: [InvoiceService, InvoicePdfService],
  controllers: [InvoiceController]
})
export class InvoiceModule {}
