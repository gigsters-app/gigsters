// src/business-item/business-item.controller.ts

import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
    ApiBearerAuth,
  } from '@nestjs/swagger';
  
  import { BusinessItemService } from './business-item.service';
  import { BusinessItem } from './business-item.entity';
import { CreateBusinessItemDto } from './dtos/create-business-item.dto';
import { UpdateBusinessItemDto } from './dtos/update-business-item.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { BusinessItemGuard } from './guards/business-item.guard';
import { UserBusinessItemsGuard } from './guards/user-business-items.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
  
  @ApiTags('Business Items')
  @ApiBearerAuth('access-token')
  @Controller('business-items')
  @UseGuards(AuthGuard)
  export class BusinessItemController {
    constructor(private readonly service: BusinessItemService) {}
  
    @Post()
    @UseGuards(BusinessItemGuard)
    @ApiOperation({ summary: 'Create a new catalog item' })
    @ApiBody({ type: CreateBusinessItemDto })
    @ApiResponse({ status: 201, description: 'Item created', type: BusinessItem })
    async create(@Body() dto: CreateBusinessItemDto): Promise<BusinessItem> {
      return this.service.create(dto);
    }
  
    @Get('profile/:profileId')
    @UseGuards(BusinessItemGuard)
    @ApiOperation({ summary: 'List all catalog items for a BusinessProfile' })
    @ApiParam({
      name: 'profileId',
      description: 'BusinessProfile UUID',
      example: 'a3f1c5d2-4e6b-11ec-81d3-0242ac130003',
    })
    @ApiResponse({ status: 200, description: 'Array of items', type: [BusinessItem] })
    async findAllByProfile(
      @Param('profileId') profileId: string,
    ): Promise<BusinessItem[]> {
      return this.service.findAllByProfile(profileId);
    }

    @Get('my-business-items')
    @UseGuards(UserBusinessItemsGuard)
    @ApiOperation({ summary: 'Get all business items for the current user based on JWT token' })
    @ApiResponse({
      status: 200,
      description: 'List of business items for the current user.',
      type: [BusinessItem],
    })
    async findMyBusinessItems(@CurrentUser() user: any): Promise<BusinessItem[]> {
      return this.service.findBusinessItemsByUser(user);
    }
  
    @Get(':id')
    @UseGuards(BusinessItemGuard)
    @ApiOperation({ summary: 'Get a single catalog item by ID' })
    @ApiParam({
      name: 'id',
      description: 'BusinessItem UUID',
      example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @ApiResponse({ status: 200, description: 'The found item', type: BusinessItem })
    @ApiResponse({ status: 404, description: 'Item not found' })
    async findOne(@Param('id') id: string): Promise<BusinessItem> {
      return this.service.findOne(id);
    }
  
    @Patch(':id')
    @UseGuards(BusinessItemGuard)
    @ApiOperation({ summary: 'Update a catalog item' })
    @ApiParam({
      name: 'id',
      description: 'BusinessItem UUID',
      example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @ApiBody({ type: UpdateBusinessItemDto })
    @ApiResponse({ status: 200, description: 'Item updated', type: BusinessItem })
    @ApiResponse({ status: 404, description: 'Item not found' })
    async update(
      @Param('id') id: string,
      @Body() dto: UpdateBusinessItemDto,
    ): Promise<BusinessItem> {
      return this.service.update(id, dto);
    }
  
    @Delete(':id')
    @UseGuards(BusinessItemGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a catalog item' })
    @ApiParam({
      name: 'id',
      description: 'BusinessItem UUID',
      example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @ApiResponse({ status: 204, description: 'Item deleted' })
    @ApiResponse({ status: 404, description: 'Item not found' })
    async remove(@Param('id') id: string): Promise<void> {
      await this.service.remove(id);
    }
  }
  