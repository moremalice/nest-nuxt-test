import { IsString, IsNotEmpty, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RecaptchaValidationDto {
  @ApiProperty({
    description: 'reCAPTCHA response token',
    example: '03AGdBq26BxiyKJH8slM4pqfZNzgSo1sSKP6rJ8F...'
  })
  @IsString()
  @IsNotEmpty()
  readonly recaptchaToken: string

  @ApiProperty({
    description: 'Expected action for validation',
    example: 'register',
    required: false
  })
  @IsOptional()
  @IsString()
  readonly expectedAction?: string

  @ApiProperty({
    description: 'Client IP address',
    example: '192.168.1.1',
    required: false
  })
  @IsOptional()
  @IsString()
  readonly remoteIp?: string
}

export class RecaptchaValidationResultDto {
  @ApiProperty({
    description: 'Validation result',
    example: true
  })
  readonly isValid: boolean

  @ApiProperty({
    description: 'reCAPTCHA score (0.0 - 1.0)',
    example: 0.8,
    required: false
  })
  readonly score?: number

  @ApiProperty({
    description: 'Action that was validated',
    example: 'form_submit',
    required: false
  })
  readonly action?: string

  @ApiProperty({
    description: 'Hostname where validation occurred',
    example: 'localhost',
    required: false
  })
  readonly hostname?: string

  @ApiProperty({
    description: 'Validation message',
    example: 'reCAPTCHA validation successful',
    required: false
  })
  readonly message?: string
}

export class DemoFormSubmissionDto {
  @ApiProperty({
    description: 'Form submission success status',
    example: true
  })
  readonly success: boolean

  @ApiProperty({
    description: 'Response message',
    example: 'Form submitted successfully'
  })
  readonly message: string

  @ApiProperty({
    description: 'Submitted form data with timestamp',
    example: {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello world',
      timestamp: '2024-01-01T00:00:00.000Z'
    }
  })
  readonly submittedData: any

  @ApiProperty({
    description: 'reCAPTCHA validation result',
    type: RecaptchaValidationResultDto,
    required: false
  })
  readonly recaptchaResult?: RecaptchaValidationResultDto | { message: string }
}