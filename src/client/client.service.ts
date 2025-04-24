// src/client/client.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

import { Client } from './client.entity';
import { BusinessProfile } from '../business-profile/business-profile.entity';
import { CreateClientDto } from './dtos/create-client.dto';
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
      // Check if client with this email already exists
      if (dto.email) {
        const existingClient = await tx.findOne(Client, {
          where: { email: dto.email }
        });
        if (existingClient) {
          throw new ConflictException(`A client with email "${dto.email}" already exists.`);
        }
      }

      const profile = await tx.findOne(BusinessProfile, {
        where: { id: dto.businessProfileId },
      });
      if (!profile) {
        throw new NotFoundException('BusinessProfile not found');
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
      where: { businessProfile: { id: profileId } },
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

      if (dto.businessProfileId) {
        const profile = await tx.findOne(BusinessProfile, {
          where: { id: dto.businessProfileId },
        });
        if (!profile) {
          throw new NotFoundException('BusinessProfile not found');
        }
        client.businessProfile = profile;
      }

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
}
