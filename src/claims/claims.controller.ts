import { Controller, Post, Get, Patch, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateClaimDto } from './DTOs/create-claim.dto';
import { UpdateClaimDto } from './DTOs/update-claim.dto';
import { Claims } from './claims.decorator';

@ApiBearerAuth('access-token') // name must match the one in addBearerAuth
@ApiTags('Claims')
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new claim' })
  @Claims('claims:create')
  create(@Body() dto: CreateClaimDto) {
    return this.claimsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all claims' })
  @Claims('claims:read:all')
  findAll() {
    return this.claimsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get claim by ID' })
  @Claims('claims:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.claimsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update claim by ID' })
  @Claims('claims:update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClaimDto) {
    return this.claimsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete claim by ID' })
  @Claims('claims:delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.claimsService.remove(id);
  }
}
