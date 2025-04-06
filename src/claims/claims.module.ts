import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';
import { PermissionSyncService } from './PermissionSyncService.service';

@Module({
  providers: [ClaimsService,PermissionSyncService],
  controllers: [ClaimsController]
})
export class ClaimsModule {}
