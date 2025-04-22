import { Module } from '@nestjs/common';
import { QuotationItemService } from './quotation-item.service';
import { QuotationItemController } from './quotation-item.controller';

@Module({
  providers: [QuotationItemService],
  controllers: [QuotationItemController]
})
export class QuotationItemModule {}
