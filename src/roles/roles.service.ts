import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { CreateRoleDto } from './DTOs/create-role.dto';
import { Role } from './role.entity';
import { UpdateRoleDto } from './DTOs/update-role';

@Injectable()
export class RolesService {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
      ) {}
      async create(createRoleDto: CreateRoleDto): Promise<Role> {
        const role = this.entityManager.create(Role, createRoleDto);
        return this.entityManager.save(role);
      }
    
      async findAll(): Promise<Role[]> {
        return this.entityManager.find(Role);
      }
    
      async findOne(id: string): Promise<Role> {
        const role = await this.entityManager.findOne(Role, { where: { id } });
        if (!role) {
          throw new NotFoundException(`Role with id ${id} not found`);
        }
        return role;
      }
    
      async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
        const role = await this.findOne(id);
        this.entityManager.merge(Role, role, updateRoleDto);
        return this.entityManager.save(role);
      }
    
      async remove(id: string): Promise<void> {
        const role = await this.findOne(id);
        await this.entityManager.remove(role);
      }
}
