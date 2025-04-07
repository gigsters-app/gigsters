import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Claim } from 'src/claims/claim.entity';
import { Role } from 'src/roles/role.entity';
import { User } from 'src/users/user.entity';
import { EntityManager, In } from 'typeorm';


@Injectable()
export class AclService {
  constructor(private readonly entityManager: EntityManager) {}

  /**
   * Assign (overwrite) one or more roles to a user by role name(s).
   */
  async assignRoleToUser(userId: string, roleName: string): Promise<User> {
    // 1. Find the user with current roles
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: ['roles'],
    });
  
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
  
    // 2. Find the role by name
    const role = await this.entityManager.findOne(Role, {
      where: { name: roleName },
    });
  
    if (!role) {
      throw new NotFoundException(`Role "${roleName}" not found`);
    }
  
    // 3. Overwrite the user's roles with the single role
    user.roles = [role];
  
    // 4. Save and return updated user
    return this.entityManager.save(user);
  }
  


  async assignClaims(roleId: string, claimIds: string[]): Promise<Role> {
    const role = await this.entityManager.findOne(Role, {
      where: { id: roleId },
      relations: ['claims'],
    });
  
    if (!role) {
      throw new NotFoundException('Role not found');
    }
  
    const claimsToAssign = await this.entityManager.find(Claim, {
      where: { id: In(claimIds) },
    });
  
    if (claimsToAssign.length === 0) {
      throw new NotFoundException('No valid claims found to assign');
    }
  
    // ✅ Overwrite the claims directly
    role.claims = claimsToAssign;
  
    return await this.entityManager.save(role);
  }
  
}
