// backend/src/module/community/dto/faq.dto.ts
import { IsOptional, IsString, IsNumber, Min, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetFaqListDto {
  @IsOptional()
  @IsString()
  lang?: string = 'ko';
}
