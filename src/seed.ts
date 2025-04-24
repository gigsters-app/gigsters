import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { RoleSyncService } from './roles/RoleSyncService.service';
import { PermissionSyncService } from './claims/PermissionSyncService.service';

/**
 * This script manually seeds the database with roles and permissions.
 * Run this script with: npx ts-node src/seed.ts
 */
async function bootstrap() {
  const logger = new Logger('Seed');
  try {
    logger.log('Starting database seeding...');
    
    const app = await NestFactory.create(AppModule);
    
    // Get the role and permission sync services
    const roleSyncService = app.get(RoleSyncService);
    const permissionSyncService = app.get(PermissionSyncService);
    
    // Run the onApplicationBootstrap methods manually
    logger.log('Seeding roles...');
    await roleSyncService.onApplicationBootstrap();
    
    logger.log('Seeding permissions...');
    await permissionSyncService.onApplicationBootstrap();
    
    logger.log('Seeding completed successfully!');
    
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error during seeding:', error);
    process.exit(1);
  }
}

bootstrap(); 