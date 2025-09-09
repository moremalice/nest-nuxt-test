// backend/src/module/security/csrf.controller.ts
import {
  Controller,
  Get,
  Req,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { CsrfService } from './csrf.service';

class CsrfTokenResponseDto {
  @ApiProperty({ 
    example: 'csrf_token_example_string',
    description: 'X-CSRF-Token 헤더에 포함할 CSRF 토큰' 
  })
  csrfToken: string;
}

class CsrfStatusResponseDto {
  @ApiProperty({ 
    example: true,
    description: 'CSRF 보호 활성화 여부' 
  })
  enabled: boolean;

  @ApiProperty({ 
    example: true,
    description: 'CSRF 초기화 실패 시 계속 동작 여부' 
  })
  failOpen: boolean;

  @ApiProperty({ 
    example: '',
    description: 'CSRF 비활성화 이유' 
  })
  reason: string;
}

@ApiTags('CSRF')
@Controller('csrf')
export class CsrfController {
  constructor(
    private readonly csrfService: CsrfService,
    private readonly configService: ConfigService,
  ) {}

  @Get('token')
  @ApiOperation({ 
    summary: 'CSRF 토큰 발급',
    description: '웹: POST/PUT/DELETE 요청에 필수 | 모바일: 불필요'
  })
  @ApiResponse({
    status: 200,
    description: 'CSRF 토큰 발급 성공',
    type: CsrfTokenResponseDto,
    headers: {
      'Set-Cookie': {
        description: 'CSRF 세션 식별자 쿠키',
        schema: { type: 'string' },
      },
    },
  })
  @ApiResponse({ 
    status: 500, 
    description: 'CSRF 토큰 발급 실패' 
  })
  async getCsrfToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CsrfTokenResponseDto> {
    try {
      // 세션 식별자 쿠키가 없으면 새로 발급하고 req.cookies에 즉시 반영
      if (!req.cookies?.['csrf-sid']) {
        const nodeEnv = this.configService.get<string>('NODE_ENV', 'local');
        const isProd = nodeEnv === 'production';
        const sessionId = randomUUID();

        // 쿠키 설정
        res.cookie('csrf-sid', sessionId, {
          httpOnly: true,
          sameSite: isProd ? 'strict' : 'lax',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          secure: isProd,
        });

        // req.cookies에 즉시 반영 (토큰 생성에서 사용할 수 있도록)
        if (!req.cookies) req.cookies = {};
        req.cookies['csrf-sid'] = sessionId;
      }

      const token = this.csrfService.generateToken(req, res);

      // passthrough: true 옵션으로 TransformInterceptor 작동 보장
      return {
        csrfToken: token,
      };
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to generate CSRF token');
    }
  }

  @Get('status')
  @ApiOperation({ 
    summary: 'CSRF 보호 상태 확인',
    description: '모니터링 및 디버깅용'
  })
  @ApiResponse({
    status: 200,
    description: 'CSRF 상태 조회 성공',
    type: CsrfStatusResponseDto,
  })
  async getCsrfStatus(): Promise<CsrfStatusResponseDto> {
    return this.csrfService.status();
  }
}
