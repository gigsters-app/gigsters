import { Module } from '@nestjs/common';
import { AclService } from './acl.service';
import { AclController } from './acl.controller';
import { RolesModule } from 'src/roles/roles.module';
import { UsersModule } from 'src/users/users.module';
import { ClaimsModule } from 'src/claims/claims.module';

@Module({
  imports:[RolesModule,UsersModule,ClaimsModule],
  providers: [AclService],
  controllers: [AclController]
})
export class AclModule {}
