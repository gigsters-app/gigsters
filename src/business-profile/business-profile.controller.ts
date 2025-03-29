import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
    ParseUUIDPipe,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { BusinessProfileService } from './business-profile.service';
 
  import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateBusinessProfileDto } from './DTOs/create-business-profile.dto';
import { UpdateBusinessProfileDto } from './DTOs/update-business-profile.dto';
import { Roles } from 'src/roles/roles.decorator';
import { Claims } from 'src/claims/claims.decorator';
import { BusinessProfileUpdateGuard } from './guards/business-profile-update.guard';

  @ApiBearerAuth('access-token') // name must match the one in addBearerAuth
  @ApiTags('Business Profiles')
  @Controller('business-profiles')
  export class BusinessProfileController {
    constructor(private readonly businessProfileService: BusinessProfileService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a new business profile' })
    @Claims('business-profile:create')
    create(@Body() dto: CreateBusinessProfileDto) {
      return this.businessProfileService.create(dto);
    }

    @Post('register')
    @Roles('user') // Optional if your guard uses JWT roles
    @Claims('business-profile:register')
    register(@Body() dto: CreateBusinessProfileDto, @Req() req) {
      return this.businessProfileService.register(dto, req.user);
}
  
    @Get()
    @ApiOperation({ summary: 'Get all business profiles' })
    @Claims('business-profile:read:all')
    findAll() {
      return this.businessProfileService.findAll();
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a business profile by ID' })
    @Claims('business-profile:read')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
      return this.businessProfileService.findOne(id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update a business profile by ID' })
    @Claims('business-profile:update')
    @UseGuards(BusinessProfileUpdateGuard)
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBusinessProfileDto) {
      return this.businessProfileService.update(id, dto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a business profile by ID' })
    @Claims('business-profile:delete')
    remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.businessProfileService.remove(id);
    }
  }
  
