// backend/src/module/auth/dto/auth-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';


export class RegisterResponseDto {
  @ApiProperty({ 
    example: 1,
    description: 'Created user unique identifier' 
  })
  idx: number;

  @ApiProperty({ 
    example: 'user@example.com',
    description: 'Registered user email for confirmation' 
  })
  email: string;
}

export class ProfileResponseDto {
  @ApiProperty({ example: 1, description: 'User unique identifier' })
  idx: number;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({ example: true, description: 'Account activation status' })
  isActive: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Account creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Account last update date',
  })
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ 
    description: 'JWT refresh token (only for mobile clients)',
    required: false 
  })
  refreshToken?: string;

  @ApiProperty({ description: 'User information' })
  user: {
    idx: number;
    email: string;
    isActive: boolean;
  };
}

export class RefreshResponseDto {
  @ApiProperty({ description: 'New JWT access token' })
  accessToken: string;

  @ApiProperty({ 
    description: 'New JWT refresh token (only for mobile clients)',
    required: false 
  })
  refreshToken?: string;

  @ApiProperty({ description: 'User information' })
  user: {
    idx: number;
    email: string;
    isActive: boolean;
  };
}

export class LogoutResponseDto {
  @ApiProperty({ 
    description: 'Logout confirmation message (mobile clients only)',
    required: false 
  })
  message?: string;

  @ApiProperty({ 
    description: 'Logout timestamp (mobile clients only)',
    required: false 
  })
  loggedOutAt?: string;

  @ApiProperty({ 
    description: 'Token cleanup instructions (mobile clients only)',
    required: false,
    type: () => Object
  })
  cleanup?: {
    clearTokens: boolean;
    tokenTypes: string[];
  };
}
