import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({ example: 'superadmin@example.com', description: 'Registered email address of the user.' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123', description: 'Password of the user.' })
  @IsString()
  @MinLength(6)
  password: string;
}
