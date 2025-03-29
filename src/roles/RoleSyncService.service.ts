// src/roles/role-sync.service.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from './role.entity';
import { STATIC_ROLES } from './roles.seed';

@Injectable()
export class RoleSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RoleSyncService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    const repo = this.dataSource.getRepository(Role);

    for (const { name, description, isSuperAdmin } of STATIC_ROLES) {
      const existing = await repo.findOne({ where: { name } });
      if (!existing) {
        await repo.save(repo.create({ name, description, isSuperAdmin }));
        this.logger.log(`Created role: ${name}`);
      }
    }

    this.logger.log('✅ Role sync complete.');
  }
}
