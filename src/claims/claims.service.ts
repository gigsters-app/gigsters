import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Claim } from './claim.entity';
import { CreateClaimDto } from './DTOs/create-claim.dto';
import { UpdateClaimDto } from './DTOs/update-claim.dto';


@Injectable()
export class ClaimsService {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  async create(createClaimDto: CreateClaimDto): Promise<Claim> {
    const existing = await this.entityManager.findOne(Claim, { where: { name: createClaimDto.name } });
    if (existing) throw new ConflictException('Claim already exists');

    const claim = this.entityManager.create(Claim, createClaimDto);
    return this.entityManager.save(claim);
  }

  findAll(): Promise<Claim[]> {
    return this.entityManager.find(Claim);
  }

  async findOne(id: string): Promise<Claim> {
    const claim = await this.entityManager.findOne(Claim, { where: { id } });
    if (!claim) throw new NotFoundException(`Claim not found`);
    return claim;
  }

  async update(id: string, updateClaimDto: UpdateClaimDto): Promise<Claim> {
    const claim = await this.findOne(id);
    this.entityManager.merge(Claim, claim, updateClaimDto);
    return this.entityManager.save(claim);
  }

  async remove(id: string): Promise<void> {
    const claim = await this.findOne(id);
    await this.entityManager.remove(claim);
  }
}
