// src/client/client.controller.ts

import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBearerAuth,
    ApiBody,
  } from '@nestjs/swagger';
  
  import { ClientService } from './client.service';
  import { Client } from './client.entity';
import { CreateClientDto } from './dtos/create-client.dto';
import { UpdateClientDto } from './dtos/update-client.dto';
  
  @ApiTags('Clients')
  // @ApiBearerAuth() // uncomment if using authentication
  @Controller('clients')
  export class ClientController {
    constructor(private readonly service: ClientService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a new client' })
    @ApiBody({ type: CreateClientDto })
    @ApiResponse({
      status: 201,
      description: 'The client has been successfully created.',
      type: Client,
    })
    async create(@Body() dto: CreateClientDto): Promise<Client> {
      return this.service.create(dto);
    }
  
    @Get('profile/:profileId')
    @ApiOperation({ summary: 'Get all clients for a business profile' })
    @ApiParam({
      name: 'profileId',
      description: 'UUID of the BusinessProfile',
      example: 'a3f1c5d2-4e6b-11ec-81d3-0242ac130003',
    })
    @ApiResponse({
      status: 200,
      description: 'List of clients.',
      type: [Client],
    })
    async findAllByProfile(
      @Param('profileId') profileId: string,
    ): Promise<Client[]> {
      return this.service.findAllByProfile(profileId);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a single client by ID' })
    @ApiParam({
      name: 'id',
      description: 'UUID of the client to retrieve',
      example: 'b4f2a6e3-5f7c-11ec-81d3-0242ac130003',
    })
    @ApiResponse({
      status: 200,
      description: 'The found client.',
      type: Client,
    })
    @ApiResponse({ status: 404, description: 'Client not found.' })
    async findOne(@Param('id') id: string): Promise<Client> {
      return this.service.findOne(id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update an existing client' })
    @ApiParam({
      name: 'id',
      description: 'UUID of the client to update',
      example: 'b4f2a6e3-5f7c-11ec-81d3-0242ac130003',
    })
    @ApiBody({ type: UpdateClientDto })
    @ApiResponse({
      status: 200,
      description: 'The client has been successfully updated.',
      type: Client,
    })
    @ApiResponse({ status: 404, description: 'Client not found.' })
    async update(
      @Param('id') id: string,
      @Body() dto: UpdateClientDto,
    ): Promise<Client> {
      return this.service.update(id, dto);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a client' })
    @ApiParam({
      name: 'id',
      description: 'UUID of the client to delete',
      example: 'b4f2a6e3-5f7c-11ec-81d3-0242ac130003',
    })
    @ApiResponse({
      status: 204,
      description: 'The client has been successfully deleted.',
    })
    @ApiResponse({ status: 404, description: 'Client not found.' })
    async remove(@Param('id') id: string): Promise<void> {
      await this.service.remove(id);
    }
  }
  