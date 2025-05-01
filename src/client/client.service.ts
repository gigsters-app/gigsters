// src/client/client.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, In } from 'typeorm';

import { Client } from './client.entity';
import { BusinessProfile } from '../business-profile/business-profile.entity';
import { CreateClientDto, CreateClientWithoutProfileDto } from './dtos/create-client.dto';
import { UpdateClientDto } from './dtos/update-client.dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,
  ) {}

  /**
   * Create a new Client under a BusinessProfile.
   */
  async create(dto: CreateClientDto): Promise<Client> {
    return this.manager.transaction(async tx => {
      // Get the business profile
      const profile = await tx.findOne(BusinessProfile, {
        where: { id: dto.businessProfileId },
      });
      if (!profile) {
        throw new NotFoundException('BusinessProfile not found');
      }

      // Check if client with this email already exists under the same business profile
      if (dto.email) {
        const existingClient = await tx
          .createQueryBuilder(Client, 'client')
          .innerJoin('client.businessProfile', 'bp')
          .where('client.email = :email', { email: dto.email })
          .andWhere('bp.id = :profileId', { profileId: profile.id })
          .getOne();
        
        if (existingClient) {
          throw new ConflictException(`A client with email "${dto.email}" already exists for this business profile.`);
        }
      }

      const client = tx.create(Client, {
        name: dto.name,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone,
        country: dto.country,
        address: dto.address,
        vatNumber: dto.vatNumber,
        businessProfile: profile,
      });

      return tx.save(Client, client);
    });
  }

  /**
   * Create a new Client using the user's business profile.
   */
  async createWithUserProfile(dto: CreateClientWithoutProfileDto, userId: string): Promise<Client> {
    return this.manager.transaction(async tx => {
      // Get the user's business profile
      const profile = await tx.findOne(BusinessProfile, {
        where: { userId: userId },
      });
      
      if (!profile) {
        throw new NotFoundException('No business profile found for this user');
      }

      // Check if client with this email already exists under the same business profile
      if (dto.email) {
        const existingClient = await tx
          .createQueryBuilder(Client, 'client')
          .innerJoin('client.businessProfile', 'bp')
          .where('client.email = :email', { email: dto.email })
          .andWhere('bp.id = :profileId', { profileId: profile.id })
          .getOne();
        
        if (existingClient) {
          throw new ConflictException(`A client with email "${dto.email}" already exists for this business profile.`);
        }
      }

      const client = tx.create(Client, {
        name: dto.name,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone,
        country: dto.country,
        address: dto.address,
        vatNumber: dto.vatNumber,
        businessProfile: profile,
      });

      return tx.save(Client, client);
    });
  }

  /**
   * List all clients for a given BusinessProfile.
   */
  async findAllByProfile(profileId: string): Promise<Client[]> {
    return this.manager.find(Client, {
      relations: ['businessProfile'],
      where: { 
        businessProfile: { id: profileId } 
      },
    });
  }

  /**
   * Fetch a single client by its ID.
   */
  async findOne(id: string): Promise<Client> {
    const client = await this.manager.findOne(Client, {
      where: { id },
    });
    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }
    return client;
  }

  /**
   * Update an existing client.
   */
  async update(id: string, dto: UpdateClientDto): Promise<Client> {
    return this.manager.transaction(async tx => {
      const client = await tx.findOne(Client, {
        where: { id },
        relations: ['businessProfile'],
      });
      if (!client) {
        throw new NotFoundException(`Client ${id} not found`);
      }

      // Handle business profile change if specified
      let profile = client.businessProfile;
      if (dto.businessProfileId && dto.businessProfileId !== profile.id) {
        const newProfile = await tx.findOne(BusinessProfile, {
          where: { id: dto.businessProfileId },
        });
        if (!newProfile) {
          throw new NotFoundException('BusinessProfile not found');
        }
        profile = newProfile;
      }

      // If email is being updated, check for uniqueness within the business profile
      if (dto.email && dto.email !== client.email) {
        const duplicateCheck = await tx
          .createQueryBuilder(Client, 'client')
          .innerJoin('client.businessProfile', 'bp')
          .where('client.email = :email', { email: dto.email })
          .andWhere('bp.id = :profileId', { profileId: profile.id })
          .andWhere('client.id != :id', { id: client.id })
          .getOne();
        
        if (duplicateCheck) {
          throw new ConflictException(`A client with email "${dto.email}" already exists for this business profile.`);
        }
      }

      // Update the businessProfile relationship if necessary
      if (dto.businessProfileId && dto.businessProfileId !== client.businessProfile.id) {
        client.businessProfile = profile;
      }

      // Update other fields
      tx.merge(Client, client, dto);
      return tx.save(Client, client);
    });
  }

  /**
   * Remove a client by ID.
   */
  async remove(id: string): Promise<void> {
    const result = await this.manager.delete(Client, id);
    if (result.affected === 0) {
      throw new NotFoundException(`Client ${id} not found`);
    }
  }

  /**
   * Find all clients for a user based on their business profiles.
   * For regular users, this returns only clients from their business profiles.
   * For superadmins or users with client:manage:any claim, it returns all clients.
   */
  async findClientsByUser(user: any): Promise<Client[]> {
    console.log('findClientsByUser called with user:', JSON.stringify({
      id: user.id,
      email: user.email,
      roles: user.roles?.map(r => ({ name: r.name, isSuperAdmin: r.isSuperAdmin })),
      businessProfiles: user.businessProfiles?.map(bp => ({ id: bp.id }))
    }, null, 2));
    
    // Check if user is superadmin or has manage:any claim
    const isSuperadmin = user.roles?.some((role: any) => 
      role.name === 'superadmin' && role.isSuperAdmin === true
    );
    console.log('User is superadmin:', isSuperadmin);
    
    const allClaims = user.roles?.flatMap((role: any) => {
      const claims = role.claims?.map((claim: any) => claim.name) || [];
      return claims;
    }) || [];
    
    const hasManageAnyClaim = allClaims.includes('client:manage:any');
    console.log('User has client:manage:any claim:', hasManageAnyClaim);
    
    // Superadmin or user with manage:any claim can see all clients
    if (isSuperadmin || hasManageAnyClaim) {
      console.log('Getting all clients for superadmin or user with manage:any claim');
      return this.manager.find(Client, {
        relations: ['businessProfile']
      });
    }
    
    // Regular user can only see clients from their business profiles
    const businessProfileIds = user.businessProfiles?.map(profile => profile.id) || [];
    console.log('User business profile IDs:', businessProfileIds);
    
    if (businessProfileIds.length === 0) {
      console.log('No business profiles found for user, returning empty array');
      return [];
    }
    
    console.log('Querying clients for business profiles:', businessProfileIds);
    
    try {
      const clients = await this.manager.find(Client, {
        relations: ['businessProfile'],
        where: { 
          businessProfile: { 
            id: In(businessProfileIds) 
          } 
        }
      });
      
      console.log(`Found ${clients.length} clients`);
      return clients;
    } catch (error) {
      console.error('Error querying clients:', error);
      throw error;
    }
  }
}
