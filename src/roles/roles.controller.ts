import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './DTOs/create-role.dto';
import { UpdateRoleDto } from './DTOs/update-role';
import { Claims } from 'src/claims/claims.decorator';

@ApiBearerAuth('access-token') // name must match the one in addBearerAuth
@ApiTags('Roles')
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new role' })
    @Claims('roles:create')
    create(@Body() createRoleDto: CreateRoleDto) {
      return this.rolesService.create(createRoleDto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all roles' })
    @Claims('roles:read:all')
    findAll() {
      return this.rolesService.findAll();
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get role by UUID' })
    @Claims('roles:read')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
      return this.rolesService.findOne(id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update role by UUID' })
    @Claims('roles:update')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateRoleDto: UpdateRoleDto) {
      return this.rolesService.update(id, updateRoleDto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete role by UUID' })
    @Claims('roles:delete')
    remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.rolesService.remove(id);
    }
}
