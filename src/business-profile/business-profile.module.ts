import { Module } from '@nestjs/common';
import { BusinessProfileService } from './business-profile.service';
import { BusinessProfileController } from './business-profile.controller';

@Module({
  providers: [BusinessProfileService],
  controllers: [BusinessProfileController]
})
export class BusinessProfileModule {}
