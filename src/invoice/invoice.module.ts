import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoicePdfService } from './invoice-pdf.service';
import { BusinessProfileModule } from 'src/business-profile/business-profile.module';
import { ClientModule } from 'src/client/client.module';
import { InvoiceGuard } from './guards/invoice.guard';
import { UsersModule } from 'src/users/users.module';
// import { InvoicePdfService } from './invoice-pdf-json.service';

@Module({
  imports: [
    BusinessProfileModule,
    ClientModule,
    UsersModule
  ],
  providers: [
    InvoiceService,
    InvoicePdfService,
    InvoiceGuard
  ],
  controllers: [InvoiceController],
  exports: [InvoiceService]
})
export class InvoiceModule {}
