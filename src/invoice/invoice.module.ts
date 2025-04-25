import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoicePdfService } from './invoice-pdf.service';
import { BusinessProfileModule } from 'src/business-profile/business-profile.module';
import { ClientModule } from 'src/client/client.module';
import { InvoiceGuard } from './guards/invoice.guard';
import { UsersModule } from 'src/users/users.module';
import { BusinessItemModule } from 'src/business-item/business-item.module';
import { UserInvoicesGuard } from './guards/user-invoices.guard';
// import { InvoicePdfService } from './invoice-pdf-json.service';

@Module({
  imports: [
    BusinessProfileModule,
    ClientModule,
    UsersModule,
    BusinessItemModule
  ],
  providers: [
    InvoiceService,
    InvoicePdfService,
    InvoiceGuard,
    UserInvoicesGuard
  ],
  controllers: [InvoiceController],
  exports: [InvoiceService]
})
export class InvoiceModule {}
