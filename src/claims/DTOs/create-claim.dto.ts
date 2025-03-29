import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClaimDto {
  @ApiProperty({ example: 'user:create' })
  @IsString()
  @MinLength(2)
  name: string;
}
