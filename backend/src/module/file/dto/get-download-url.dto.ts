// backend/src/module/file/dto/get-download-url.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetDownloadUrlQueryDto {
  @ApiProperty({
    name: 'file_path',
    description: '파일 서버의 상대 경로 (예: images/2025/08/a.png)',
    example: 'images/2025/08/a.png',
    required: true,
  })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  @Matches(/^(?!\/)(?!.*\.\.)(?!.*:\/\/)(?!.*\\)[A-Za-z0-9._\-\/%]+$/, {
    message:
      'file_path must be a relative path without protocol, backslash, leading slash, or ".."',
  })
  file_path!: string;
}
