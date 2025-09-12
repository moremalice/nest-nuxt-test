// /backend/src/module/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    example: '03AGdBq26BxiyKJH8slM4pqfZNzgSo1sSKP6rJ8F...',
    description: 'reCAPTCHA response token',
    required: false
  })
  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}
