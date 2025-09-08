// backend/src/module/community/controllers/faq.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { FaqService } from '../services/faq.service';
import { GetFaqListDto } from '../dto/faq.dto';

@ApiTags('WEB')
@ApiSecurity('csrf-token')
@Controller('community')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @ApiOperation({ summary: 'FAQ 목록 조회' })
  @ApiResponse({ status: 200, description: 'FAQ 목록 조회 성공' })
  @Post('getFaqList')
  async getFaqList(@Body() dto: GetFaqListDto) {
    return await this.faqService.getFaqList(dto);
  }
}
