import {  Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserController } from './users.controller';
import { MailModule } from 'src/common/mail/mail.module';



@Module({
  imports:[MailModule],
  providers: [UsersService],
  controllers:[UserController],
  exports:[UsersService]
})
export class UsersModule {}
