// backend/src/module/security/csrf.controller.ts
import {
  Controller,
  Get,
  Req,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { CsrfService } from './csrf.service';

interface CsrfTokenData {
  csrfToken: string;
}

interface CsrfStatusData {
  enabled: boolean;
  failOpen: boolean;
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
  @ApiOperation({ summary: 'CSRF 토큰 생성' })
  async getCsrfToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CsrfTokenData> {
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
  @ApiOperation({ summary: 'CSRF 보호 상태 확인 (운영 모니터링용)' })
  async getCsrfStatus(): Promise<CsrfStatusData> {
    return this.csrfService.status();
  }
}
