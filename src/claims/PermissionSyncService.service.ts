// src/claims/permission-sync.service.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Claim } from './claim.entity';
import { STATIC_CLAIMS } from './permissions.seed';

@Injectable()
export class PermissionSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PermissionSyncService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    const repo = this.dataSource.getRepository(Claim);

    for (const { name, description } of STATIC_CLAIMS) {
      const existing = await repo.findOne({ where: { name } });
      if (!existing) {
        await repo.save(repo.create({ name, description }));
        this.logger.log(`Created claim: ${name}`);
      }
    }

    this.logger.log('✅ Permission sync complete.');
  }
}
