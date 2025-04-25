import { Module } from '@nestjs/common';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './quotation.service';
import { QuotationPdfService } from './quotation-pdf.service';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { QuotationGuard } from './guards/quotation.guard';
import { BusinessProfileModule } from 'src/business-profile/business-profile.module';
import { UserQuotationsGuard } from './guards/user-quotations.guard';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    InvoiceModule, 
    BusinessProfileModule,
    UsersModule
  ],
  controllers: [QuotationController],
  providers: [QuotationService, QuotationPdfService, QuotationGuard, UserQuotationsGuard],
  exports: [QuotationService, QuotationPdfService]
})
export class QuotationModule {}
