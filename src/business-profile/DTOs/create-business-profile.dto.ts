import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  Matches,
  MaxLength,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBusinessProfileDto {
  @ApiProperty({
    enum: ['individual', 'company'],
    description: 'Type of the business profile',
    example: 'company',
  })
  @IsEnum(['individual', 'company'])
  profileType: 'individual' | 'company';

  @ApiProperty({ description: 'Display name of the business', example: 'Gigsters Co.' })
  @IsString()
  @MaxLength(100)
  displayName: string;

  @ApiProperty({ description: 'Legal name of the business', example: 'Gigsters Technologies LLC' })
  @IsString()
  @MaxLength(100)
  legalName: string;

  @ApiProperty({ required: false, description: 'Job position of the business representative', example: 'Founder' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  jobPosition?: string;

  @ApiProperty({ required: false, description: 'Title of the business representative', example: 'Mr.' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  title?: string;

  @ApiProperty({ description: 'Mobile phone number', example: '+96891234567' })
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Mobile must be a valid phone number' })
  mobile: string;


  @ApiProperty({ required: false, description: 'Landline or alternative phone', example: '+96824445566' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Phone must be a valid phone number' })
  phone?: string;

  @ApiProperty({ required: false, description: 'Company website URL', example: 'https://gigsters.app' })
  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @ApiProperty({ description: 'VAT or tax registration number', example: 'VAT-123456' })
  @IsString()
  @MaxLength(50)
  vatNumber: string;

  @ApiProperty({ description: 'Primary street address', example: '123 Innovation Rd' })
  @IsString()
  @MaxLength(100)
  street: string;

  @ApiProperty({ required: false, description: 'Additional address line', example: 'Building B, 2nd Floor' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  street2?: string;

  @ApiProperty({ description: 'City of business', example: 'Muscat' })
  @IsString()
  @MaxLength(50)
  city: string;

  @ApiProperty({ required: false, description: 'State or region', example: 'Muscat Governorate' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  @ApiProperty({ required: false, description: 'Postal code or ZIP', example: '113' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip?: string;

  @ApiProperty({ description: 'Country of registration', example: 'Oman' })
  @IsString()
  @MaxLength(50)
  country: string;

  @ApiProperty({ required: false, description: 'Link to company logo or file name', example: 'https://cdn.gigsters.app/logo.png' })
  @IsOptional()
  @IsUrl({}, { message: 'Company logo must be a valid URL' })
  companyLogo?: string;

  @ApiProperty({ required: false, description: 'Business license or registration number', example: 'OM-123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNumber?: string;

  @ApiProperty({ required: false, description: 'User who last updated the profile (for internal use)', example: 'admin@gigsters.app' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  updatedBy?: string;

  @ApiProperty({
    required: false,
    description: 'Used by admins to assign this profile to a specific user',
    example: 'b84cbe25-1f10-420a-98dc-1b5c6573cb56',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
