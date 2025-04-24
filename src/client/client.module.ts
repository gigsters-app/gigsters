import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { BusinessProfileModule } from 'src/business-profile/business-profile.module';
import { UsersModule } from 'src/users/users.module';
import { ClientGuard } from './guards/client.guard';

@Module({
  imports: [
    BusinessProfileModule,
    UsersModule
  ],
  providers: [ClientService, ClientGuard],
  controllers: [ClientController],
  exports: [ClientService]
})
export class ClientModule {}
