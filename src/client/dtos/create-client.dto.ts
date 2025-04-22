// src/client/dto/create-client.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    description: 'ID of the BusinessProfile this client belongs to',
    format: 'uuid',
    example: 'a3f1c5d2-4e6b-11ec-81d3-0242ac130003',
  })
  @IsUUID()
  businessProfileId: string;

  @ApiProperty({
    description: 'Client name (company or individual)',
    example: 'Acme Corp',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Contact person name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Client email address',
    example: 'john.doe@acme.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Client phone number',
    example: '+1-555-1234',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Client country',
    example: 'USA',
  })
  @IsString()
  country: string;

  @ApiPropertyOptional({
    description: 'Client full address',
    example: '123 Main St, Anytown, CA 12345',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Client VAT number, if applicable',
    example: 'VAT123456',
  })
  @IsOptional()
  @IsString()
  vatNumber?: string;
}
