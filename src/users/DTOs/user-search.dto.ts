import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class UserSearchDto extends PaginationDto {
  @ApiProperty({
    description: 'Search by email',
    required: false,
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Search by first name',
    required: false,
    example: 'John',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Search by last name',
    required: false,
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Search term for any field',
    required: false,
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;
} 