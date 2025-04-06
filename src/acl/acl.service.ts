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
  async assignRolesToUser(userId: string, roleNames: string[]): Promise<User> {
    // 1. Find the user, including current roles
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
  
    // 2. Find the roles (by name) to assign
    const roles = await this.entityManager.find(Role, {
      where: { name: In(roleNames) },
    });
    if (!roles.length) {
      throw new NotFoundException(
        `No matching roles found for: ${roleNames.join(', ')}`,
      );
    }
  
    // 3. **Overwrite** the user's roles with these new roles
    //    (this removes old roles from the user_roles table)
    user.roles = roles;
  
    // 4. Save (automatically updates the user_roles join table)
    return this.entityManager.save(user);
  }


  async assignClaims(roleId: string, claimIds: string[]): Promise<Role> {
    const role = await this.entityManager.findOne(Role, { where: { id: roleId }, relations: ['claims'] });
    if (!role) throw new NotFoundException(`Role not found`);

    const claimsToAdd = await this.entityManager.find(Claim, { where: { id: In(claimIds) } });
    
    if (claimsToAdd.length === 0) {
      throw new NotFoundException('No valid claims found to assign');
    }

    // Prevent duplication:
    const existingClaimIds = new Set(role.claims.map(c => c.id));

    for (const claim of claimsToAdd) {
      if (!existingClaimIds.has(claim.id)) {
        role.claims.push(claim); // Only add if not already associated
      }
    }

    return this.entityManager.save(role);
  }
}
