// backend/src/module/policy/policy.controller.ts
import { Controller, Post, Body, Req } from '@nestjs/common';
import {
  ApiHeader,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { PolicyService } from './policy.service';
import {
  GetTermsListDto,
  GetTermsDetailDto,
  GetPrivacyListDto,
  GetPrivacyDetailDto,
} from './dto/policy.dto';

@ApiTags('WEB')
@ApiSecurity('csrf-token')
@Controller('policy')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @ApiOperation({ summary: '피키톡 이용약관 목록 조회' })
  @ApiBody({ type: GetTermsListDto })
  @ApiResponse({ status: 200, description: '피키톡 이용약관 목록 조회 성공' })
  @Post('getTermsList')
  async getTermsList(@Body() dto: GetTermsListDto) {
    return this.policyService.getTermsList(dto);
  }

  @ApiOperation({ summary: '피키톡 이용약관 상세 조회' })
  @ApiBody({ type: GetTermsDetailDto })
  @ApiResponse({ status: 200, description: '피키톡 이용약관 상세 조회 성공' })
  @Post('getTermsDetail')
  async getTermsDetail(@Body() dto: GetTermsDetailDto) {
    return this.policyService.getTermsDetail(dto);
  }

  @ApiOperation({ summary: '피키톡 개인정보처리방침 목록 조회' })
  @ApiBody({ type: GetPrivacyListDto })
  @ApiResponse({
    status: 200,
    description: '피키톡 개인정보처리방침 목록 조회 성공',
  })
  @Post('getPrivacyList')
  async getPrivacyList(@Body() dto: GetPrivacyListDto) {
    return this.policyService.getPrivacyList(dto);
  }

  @ApiOperation({ summary: '피키톡 개인정보처리방침 상세 조회' })
  @ApiBody({ type: GetPrivacyDetailDto })
  @ApiResponse({
    status: 200,
    description: '피키톡 개인정보처리방침 상세 조회 성공',
  })
  @Post('getPrivacyDetail')
  async getPrivacyDetail(@Body() dto: GetPrivacyDetailDto) {
    return this.policyService.getPrivacyDetail(dto);
  }
}
