import { Body, Controller, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { AclService } from './acl.service';
import { AssignRolesDto } from './DTOs/assign-roles.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AssignClaimsDto } from './DTOs/assign-claims.dto';
import { Claims } from 'src/claims/claims.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiBearerAuth('access-token')
@Controller('acl')
export class AclController {
    constructor(private readonly aclService: AclService) {}

    @Public()
    @Patch('users/:userId/role')
    @Claims('acl:assign-roles')
  async assignRolesToUser(
    @Param('userId') userId: string,
    @Body() { role }: AssignRolesDto,
  ) {
    // Call the service method to assign roles
    const updatedUser = await this.aclService.assignRoleToUser(userId, role);

    // Return something meaningful to the caller
    return {
      message: `Assigned role "${role}" to user ID: ${userId}`,
      user: updatedUser,
    };
  }


  @Post('roles/:id/assign-claims')
  @ApiOperation({ summary: 'Assign claims to a role safely (no duplicates)' })
  @Claims('acl:assign-claims')
  assignClaimsToRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignClaimsDto) {
    return this.aclService.assignClaims(id, dto.claimIds);
  }
}
