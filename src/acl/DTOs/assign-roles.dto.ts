import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    example: 'ADMIN',
    description: 'The name or ID of the role to assign to the user',
  })
  @IsString()
  role: string;
}

