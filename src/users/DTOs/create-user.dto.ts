import { 
    IsEmail, 
    IsString, 
    MinLength, 
    MaxLength, 
    IsOptional, 
    IsBoolean 
  } from 'class-validator';
  import { ApiProperty } from '@nestjs/swagger';
  
  export class CreateUserDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;
  
    @ApiProperty({ example: 'StrongPass123' })
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    password: string;
  
    @ApiProperty({ example: 'John', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(30)
    firstName?: string;
  
    @ApiProperty({ example: 'Doe', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(30)
    lastName?: string;
  
    @ApiProperty({ example: true, required: false, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
  }
  