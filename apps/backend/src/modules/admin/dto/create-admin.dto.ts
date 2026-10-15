import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobileNumber: string;

  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @IsOptional()
  @IsBoolean()
  isTwoFactorEnabled?: boolean;
}
