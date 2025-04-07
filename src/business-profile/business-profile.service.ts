import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { BusinessProfile } from './business-profile.entity';
import { CreateBusinessProfileDto } from './DTOs/create-business-profile.dto';
import { UpdateBusinessProfileDto } from './DTOs/update-business-profile.dto';
import { User } from 'src/users/user.entity';


@Injectable()
export class BusinessProfileService {
  constructor(@InjectEntityManager() private em: EntityManager) {}

  async create(dto: CreateBusinessProfileDto): Promise<BusinessProfile> {
    const user = await this.em.findOne(User, { where: { id: dto.userId } });
  
    if (!user) {
      throw new NotFoundException('Cannot create business profile: user not found.');
    }
  
    try {
      const profile = this.em.create(BusinessProfile, dto);
      return await this.em.save(profile);
    } catch (err) {
      throw new BadRequestException('Failed to create business profile. Please check the provided data.');
    }
  }

  async register(dto: CreateBusinessProfileDto, user: User): Promise<BusinessProfile> {
    // Check if user has role 'user'
    const hasUserRole = user.roles.map(r => r.name).includes('user');

if (!hasUserRole) {
  throw new ForbiddenException('Only users with role "user" can register a business profile.');
}
  
    // Ensure the user doesn’t already have a profile
    const existing = await this.em.findOne(BusinessProfile, {
      where: { userId: user.id },
    });
  
    if (existing) {
      throw new ConflictException('You already have a business profile.');
    }
  
    const profile = this.em.create(BusinessProfile, {
      ...dto,
      userId: user.id,
    });
  
    return this.em.save(profile);
  } 

  async findAll(): Promise<BusinessProfile[]> {
    return this.em.find(BusinessProfile);
  }

  async findOne(id: string): Promise<BusinessProfile> {
    const profile = await this.em.findOne(BusinessProfile, { where: { id } });
    if (!profile) throw new NotFoundException('Business profile not found');
    return profile;
  }

  async update(id: string, dto: UpdateBusinessProfileDto): Promise<BusinessProfile> {
    const profile = await this.findOne(id);
    this.em.merge(BusinessProfile, profile, dto);
    return this.em.save(profile);
  }

  async remove(id: string): Promise<void> {
    const profile = await this.findOne(id);
    await this.em.remove(profile);
  }
}
