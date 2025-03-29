import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({ example: ['ADMIN', 'USER'] })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}
