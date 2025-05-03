import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards, NotFoundException, Query } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./DTOs/create-user.dto";
import { UpdateUserDto } from "./DTOs/update-user.dto";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { User } from "./user.entity";
import { Roles } from "src/roles/roles.decorator";
import { Claims } from "src/claims/claims.decorator";
import { UserUpdateGuard } from "./guards/user-update.guard";
import { Public } from "src/auth/decorators/public.decorator";
import { PaginationDto, PaginatedResponseDto } from './DTOs/pagination.dto';

@ApiBearerAuth('access-token') // name must match the one in addBearerAuth
@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UsersService) {}

  
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User successfully created.', type: User })
  // @Claims('user:create')
  @Public()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all users with pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users retrieved successfully.', 
    type: PaginatedResponseDto 
  })
  @Claims('user:read:all')
  findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponseDto<User>> {
    return this.userService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by UUID' })
  @ApiParam({ name: 'id', description: 'User UUID', type: String })
  @ApiResponse({ status: 200, description: 'User retrieved successfully.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Claims('user:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOneById(id);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get user by email' })
  @ApiParam({ name: 'email', description: 'User Email', type: String })
  @ApiResponse({ status: 200, description: 'User retrieved successfully.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Claims('user:read:email')
  async findByEmail(@Param('email') email: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user details by UUID' })
  @ApiParam({ name: 'id', description: 'User UUID', type: String })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Claims('user:update')
  @UseGuards( UserUpdateGuard) // 👈 Add the guard here
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto); 
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete user by UUID' })
  @ApiParam({ name: 'id', description: 'User UUID', type: String })
  @ApiResponse({ status: 204, description: 'User soft-deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Claims('user:delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user by UUID' })
  @ApiParam({ name: 'id', description: 'User UUID', type: String })
  @ApiResponse({ status: 200, description: 'User restored successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Claims('user:restore')
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.restore(id);
  }
}