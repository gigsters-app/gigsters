// src/business-item/business-item.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, In } from 'typeorm';

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
    const item = await this.manager.findOne(BusinessItem, { 
      where: { id },
      relations: ['businessProfile'] 
    });
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

  /**
   * Find all business items for a user based on their business profiles.
   * For regular users, this returns only business items from their business profiles.
   * For superadmins or users with businessitem:manage:any claim, it returns all business items.
   */
  async findBusinessItemsByUser(user: any): Promise<BusinessItem[]> {
    console.log('findBusinessItemsByUser called with user:', JSON.stringify({
      id: user.id,
      email: user.email,
      roles: user.roles?.map(r => ({ name: r.name, isSuperAdmin: r.isSuperAdmin })) || [],
      businessProfiles: user.businessProfiles?.map(bp => ({ id: bp.id })) || 'undefined'
    }, null, 2));
    
    // Check if user is superadmin or has manage:any claim
    const isSuperadmin = user.roles?.some((role: any) => 
      role.name === 'superadmin' && role.isSuperAdmin === true
    ) || false;
    console.log('User is superadmin:', isSuperadmin);
    
    const allClaims = user.roles?.flatMap((role: any) => {
      const claims = role.claims?.map((claim: any) => claim.name) || [];
      return claims;
    }) || [];
    
    const hasManageAnyClaim = allClaims.includes('businessitem:manage:any');
    console.log('User has businessitem:manage:any claim:', hasManageAnyClaim);
    
    // Superadmin or user with manage:any claim can see all business items
    if (isSuperadmin || hasManageAnyClaim) {
      console.log('Getting all business items for superadmin or user with manage:any claim');
      return this.manager.find(BusinessItem);
    }
    
    // If the user has no business profiles, return an empty array
    if (!user.businessProfiles || user.businessProfiles.length === 0) {
      console.log('User has no business profiles, returning empty array');
      return [];
    }
    
    // Regular user can only see business items from their business profiles
    const businessProfileIds = user.businessProfiles.map(profile => profile.id);
    console.log('User business profile IDs:', businessProfileIds);
    
    console.log('Querying business items for business profiles:', businessProfileIds);
    
    try {
      const items = await this.manager.find(BusinessItem, {
        where: { 
          businessProfile: { 
            id: In(businessProfileIds) 
          } 
        }
      });
      
      console.log(`Found ${items.length} business items`);
      return items;
    } catch (error) {
      console.error('Error querying business items:', error);
      throw error;
    }
  }
}
