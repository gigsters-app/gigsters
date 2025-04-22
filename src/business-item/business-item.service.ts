// src/business-item/business-item.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

import { BusinessItem } from './business-item.entity';
import { BusinessProfile } from '../business-profile/business-profile.entity';
import { UpdateBusinessItemDto } from './dtos/update-business-item.dto';
import { CreateBusinessItemDto } from './dtos/create-business-item.dto';

@Injectable()
export class BusinessItemService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,
  ) {}

  async create(dto: CreateBusinessItemDto): Promise<BusinessItem> {
    return this.manager.transaction(async tx => {
      const profile = await tx.findOne(BusinessProfile, {
        where: { id: dto.businessProfileId },
      });
      if (!profile) {
        throw new NotFoundException('BusinessProfile not found');
      }
      const item = tx.create(BusinessItem, {
        name: dto.name,
        description: dto.description,
        defaultUnitPrice: dto.defaultUnitPrice,
        businessProfile: profile,
      });
      return tx.save(BusinessItem, item);
    });
  }

  async findAllByProfile(profileId: string): Promise<BusinessItem[]> {
    return this.manager.find(BusinessItem, {
      where: { businessProfile: { id: profileId } },
    });
  }

  async findOne(id: string): Promise<BusinessItem> {
    const item = await this.manager.findOne(BusinessItem, { where: { id } });
    if (!item) {
      throw new NotFoundException(`BusinessItem ${id} not found`);
    }
    return item;
  }

  async update(id: string, dto: UpdateBusinessItemDto): Promise<BusinessItem> {
    return this.manager.transaction(async tx => {
      const item = await tx.findOne(BusinessItem, {
        where: { id },
        relations: ['businessProfile'],
      });
      if (!item) {
        throw new NotFoundException(`BusinessItem ${id} not found`);
      }
      if (dto.businessProfileId) {
        const profile = await tx.findOne(BusinessProfile, {
          where: { id: dto.businessProfileId },
        });
        if (!profile) {
          throw new NotFoundException('BusinessProfile not found');
        }
        item.businessProfile = profile;
      }
      tx.merge(BusinessItem, item, dto);
      return tx.save(BusinessItem, item);
    });
  }

  async remove(id: string): Promise<void> {
    const res = await this.manager.delete(BusinessItem, id);
    if (res.affected === 0) {
      throw new NotFoundException(`BusinessItem ${id} not found`);
    }
  }
}
