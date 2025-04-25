import { Module } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationController } from './quotation.controller';
import { QuotationPdfService } from './quotation-pdf.service';
import { InvoiceModule } from '../invoice/invoice.module';

@Module({
  imports: [InvoiceModule],
  providers: [QuotationService,QuotationPdfService],
  controllers: [QuotationController],
  exports: [QuotationService]
})
export class QuotationModule {}
