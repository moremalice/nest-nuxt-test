// backend/src/module/community/dto/notice.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Matches,
  MaxLength,
  MinLength,
  Min,
  Max,
  IsDefined,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetNoticeListDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') return undefined;
    const s = value.trim();
    return s === '' ? undefined : s;
  })
  @IsString()
  @MaxLength(100)
  word?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  offset: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  current_page: number = 1;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === 'ko' ? 'ko' : 'en'))
  lang?: string = 'ko';
}

export class GetNoticeDetailDto {
  @Transform(
    ({ value }) => {
      if (value === undefined || value === null) return undefined;
      const s = String(value).trim();
      return s === '' ? undefined : Number(value);
    },
    { toClassOnly: true },
  )
  @Type(() => Number)
  @IsDefined()
  @IsInt()
  @Min(1)
  idx: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === 'ko' ? 'ko' : 'en'))
  lang?: string = 'ko';
}
