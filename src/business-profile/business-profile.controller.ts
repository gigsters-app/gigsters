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
    ForbiddenException,
    Logger,
  } from '@nestjs/common';
  import { BusinessProfileService } from './business-profile.service';
 
  import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateBusinessProfileDto } from './DTOs/create-business-profile.dto';
import { UpdateBusinessProfileDto } from './DTOs/update-business-profile.dto';

import { BusinessProfileGuard } from './guards/business-profile.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { UsersService } from 'src/users/users.service';

  @ApiBearerAuth('access-token') // name must match the one in addBearerAuth
  @ApiTags('Business Profiles')
  @Controller('business-profiles')
  @UseGuards(AuthGuard, BusinessProfileGuard)
  export class BusinessProfileController {
    private readonly logger = new Logger(BusinessProfileController.name);

    constructor(private readonly businessProfileService: BusinessProfileService, private readonly userService: UsersService) {}
  
    @Post()
    @ApiOperation({ 
      summary: 'Create a new business profile',
      description: 'Creates a new business profile with the provided details. You can specify fiscal year settings to customize invoice numbering based on your company\'s fiscal year.' 
    })
    create(@Body() dto: CreateBusinessProfileDto) {
      return this.businessProfileService.create(dto);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a business profile for the authenticated user' })
    register(@Body() dto: CreateBusinessProfileDto, @Req() req) {
      this.logger.debug('User from request:', req.user);
      console.log(req.user);
      if (!req.user || !req.user.id) {
        throw new ForbiddenException('User not found in request');
      }
      return this.businessProfileService.register(dto, req.user);
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all business profiles (admin/superadmin only)' })
    findAll() {
      return this.businessProfileService.findAll();
    }
  
    @Get('my-profile')
    @ApiOperation({ summary: 'Get the authenticated user\'s business profile' })
    findMyProfile(@Req() req) {
      return this.businessProfileService.findByUserId(req.user.id);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a business profile by ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
      return this.businessProfileService.findOne(id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update a business profile' })
    update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: UpdateBusinessProfileDto,
    ) {
      return this.businessProfileService.update(id, dto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a business profile' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.businessProfileService.remove(id);
    }
  }
  
