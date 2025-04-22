import { Module } from '@nestjs/common';
import { BusinessItemService } from './business-item.service';
import { BusinessItemController } from './business-item.controller';

@Module({
  providers: [BusinessItemService],
  controllers: [BusinessItemController]
})
export class BusinessItemModule {}
