import { Module } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationController } from './quotation.controller';
import { QuotationPdfService } from './quotation-pdf.service';

@Module({
  providers: [QuotationService,QuotationPdfService],
  controllers: [QuotationController]
})
export class QuotationModule {}
