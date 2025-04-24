import { Module } from '@nestjs/common';
import { BusinessProfileService } from './business-profile.service';
import { BusinessProfileController } from './business-profile.controller';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/common/mail/mail.service';

@Module({
  providers: [BusinessProfileService, UsersService, MailService],
  controllers: [BusinessProfileController],
  exports: [BusinessProfileService]
})
export class BusinessProfileModule {}
