import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignClaimsDto {
  @ApiProperty({ type: [String], description: 'List of Claim UUIDs to assign' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  claimIds: string[];
}
