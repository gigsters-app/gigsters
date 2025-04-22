import { Module } from '@nestjs/common';
import { InvoiceItemService } from './invoice-item.service';
import { InvoiceItemController } from './invoice-item.controller';

@Module({
  providers: [InvoiceItemService],
  controllers: [InvoiceItemController]
})
export class InvoiceItemModule {}
