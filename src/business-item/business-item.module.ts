import { Module } from '@nestjs/common';
import { BusinessItemService } from './business-item.service';
import { BusinessItemController } from './business-item.controller';
import { BusinessItemGuard } from './guards/business-item.guard';
import { UserBusinessItemsGuard } from './guards/user-business-items.guard';
import { BusinessProfileModule } from 'src/business-profile/business-profile.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    BusinessProfileModule,
    UsersModule
  ],
  providers: [BusinessItemService, BusinessItemGuard, UserBusinessItemsGuard],
  controllers: [BusinessItemController],
  exports: [BusinessItemService]
})
export class BusinessItemModule {}
