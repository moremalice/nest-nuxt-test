// backend/src/module/community/controllers/notice.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { NoticeService } from '../services/notice.service';
import { GetNoticeListDto, GetNoticeDetailDto } from '../dto/notice.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('WEB')
@Controller('community')
export class NoticeController {
  constructor(
    private readonly noticeService: NoticeService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: '공지사항 목록 조회' })
  @ApiResponse({ status: 200, description: '공지사항 목록 조회 성공' })
  @Get('getNoticeList')
  async getNoticeList(@Query() dto: GetNoticeListDto) {
    return await this.noticeService.getNoticeList(dto);
  }

  @ApiOperation({ summary: '공지사항 상세 조회' })
  @ApiResponse({ status: 200, description: '공지사항 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '공지사항을 찾을 수 없음' })
  @ApiSecurity('csrf-token')
  @Post('getNoticeDetail')
  async getNoticeDetail(@Body() dto: GetNoticeDetailDto) {
    return await this.noticeService.getNoticeDetail(dto);
  }
}
