// /backend/src/module/file/file.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { GetDownloadUrlQueryDto } from './dto/get-download-url.dto';

@ApiTags('WEB')
@Controller('file')
export class FileController {
  constructor(private readonly configService: ConfigService) {}

  @ApiOperation({ summary: '파일 다운로드용 외부 URL 반환' })
  @ApiResponse({ status: 200, description: '외부 파일서버 URL 반환 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '파일을 찾을 수 없음' })
  @ApiQuery({ name: 'file_path', required: true, type: String })
  @Get('get-download-url')
  getDownloadUrl(@Query() q: GetDownloadUrlQueryDto) {
    const filePath = q.file_path.replace(/^\/+/, '');

    const fileDomain = this.configService.get<string>(
      'PIKI_DOMAIN',
      'https://marketdev.pikit.space',
    );
    const fileDataPath = this.configService.get<string>(
      'FILE_DATA_PATH',
      '/data/',
    );

    const fileUrl = [
      fileDomain.replace(/\/+$/, ''),
      fileDataPath.replace(/^\/+|\/+$/g, ''),
      filePath,
    ].join('/');

    // TransformInterceptor로 최종 응답은 {status:'success', data:{ url }} 형태로 나감
    return { url: fileUrl };
  }
}
