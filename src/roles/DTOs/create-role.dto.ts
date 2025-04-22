import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Unique name for the role',
    example: 'manager',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50, { message: 'Role name must be at most 50 characters' })
  name: string;

  @ApiProperty({
    description: 'Human‑readable description of the role’s purpose',
    example: 'Can view and edit project settings',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Description must be at most 255 characters' })
  description?: string;
}
