// backend/src/module/policy/dto/policy.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetTermsListDto {
  @ApiPropertyOptional({ description: 'Language code', example: 'ko' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === 'ko' ? 'ko' : 'en'))
  lang?: string = 'ko';

  @ApiPropertyOptional({ description: 'View type filter', example: 'talk' })
  @IsOptional()
  @IsString()
  view_type?: string;
}

export class GetTermsDetailDto {
  @ApiProperty({ description: 'Terms document IDX', example: 1 })
  @Type(() => Number)
  @IsNotEmpty()
  @IsInt()
  idx: number;

  @ApiPropertyOptional({ description: 'Language code', example: 'ko' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === 'ko' ? 'ko' : 'en'))
  lang?: string = 'ko';
}

export class GetPrivacyListDto {
  @ApiPropertyOptional({ description: 'Language code', example: 'ko' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === 'ko' ? 'ko' : 'en'))
  lang?: string = 'ko';

  @ApiPropertyOptional({ description: 'View type filter', example: 'talk' })
  @IsOptional()
  @IsString()
  view_type?: string;
}

export class GetPrivacyDetailDto {
  @ApiProperty({ description: 'Privacy document IDX', example: 1 })
  @Type(() => Number)
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  idx: number;

  @ApiPropertyOptional({ description: 'Language code', example: 'ko' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === 'ko' ? 'ko' : 'en'))
  lang?: string = 'ko';
}
