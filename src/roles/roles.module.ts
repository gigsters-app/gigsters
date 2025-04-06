import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RoleSyncService } from './RoleSyncService.service';

@Module({
  controllers: [RolesController],
  providers: [RolesService,RoleSyncService],
  exports: [RolesService],
})
export class RolesModule {}
