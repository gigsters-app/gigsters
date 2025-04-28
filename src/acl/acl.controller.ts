import { Body, Controller, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { AclService } from './acl.service';
import { AssignRolesDto } from './DTOs/assign-roles.dto';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AssignClaimsDto } from './DTOs/assign-claims.dto';
import { Claims } from 'src/claims/claims.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiBearerAuth('access-token')
@ApiTags('ACL')
@Controller('acl')
export class AclController {
    constructor(private readonly aclService: AclService) {}

    @Public()
    @Patch('users/:userId/role')
    @Claims('acl:assign-roles')
    @ApiOperation({ 
        summary: 'Assign a role to a user',
        description: 'Assigns a specific role to a user identified by their userId'
    })
    @ApiParam({
        name: 'userId',
        description: 'The UUID of the user to assign the role to',
        type: 'string',
        format: 'uuid'
    })
    @ApiBody({
        type: AssignRolesDto,
        description: 'The role to assign to the user'
    })
    @ApiResponse({
        status: 200,
        description: 'Role successfully assigned to user',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Assigned role "admin" to user ID: 123e4567-e89b-12d3-a456-426614174000'
                },
                user: {
                    type: 'object',
                    description: 'The updated user object'
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 404, description: 'User not found' })
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
    @ApiOperation({ 
        summary: 'Assign claims to a role',
        description: 'Safely assigns claims to a role without creating duplicates'
    })
    @ApiParam({
        name: 'id',
        description: 'The UUID of the role to assign claims to',
        type: 'string',
        format: 'uuid'
    })
    @ApiBody({
        type: AssignClaimsDto,
        description: 'The claims to assign to the role'
    })
    @ApiResponse({
        status: 201,
        description: 'Claims successfully assigned to role',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Claims successfully assigned to role'
                },
                role: {
                    type: 'object',
                    description: 'The updated role object with assigned claims'
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    @Claims('acl:assign-claims')
    assignClaimsToRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignClaimsDto) {
        return this.aclService.assignClaims(id, dto.claimIds);
    }
}
