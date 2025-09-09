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
        description: 'X-CSRF-Token 헤더 값'
    })
    csrfToken: string;
}

class CsrfStatusResponseDto {
    @ApiProperty({ example: true, description: 'CSRF 보호 활성화 여부' })
    enabled: boolean;

    @ApiProperty({ example: true, description: '초기화 실패 시 서비스 계속 여부' })
    failOpen: boolean;

    @ApiProperty({ example: '', description: 'CSRF가 비활성화된 이유' })
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
        summary: 'CSRF Token 발급',
        description: '웹: POST/PUT/DELETE 시 필수 | 모바일: 불필요'
    })
    @ApiResponse({
        status: 200,
        description: 'CSRF Token 발급 성공',
        type: CsrfTokenResponseDto,
        headers: {
            'Set-Cookie': {
                description: 'CSRF 세션 식별자 쿠키',
                schema: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 500, description: 'CSRF Token 발급 실패' })
    async getCsrfToken(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<CsrfTokenResponseDto> {
        try {
            if (!(req as any).cookies?.['csrf-sid']) {
                const nodeEnv = this.configService.get<string>('NODE_ENV', 'local');
                const isProd = nodeEnv === 'production';
                const sessionId = randomUUID();

                res.cookie('csrf-sid', sessionId, {
                    httpOnly: true,
                    sameSite: isProd ? 'strict' : 'lax',
                    path: '/',
                    maxAge: 24 * 60 * 60 * 1000,
                    secure: isProd,
                });

                (req as any).cookies = (req as any).cookies || {};
                (req as any).cookies['csrf-sid'] = sessionId;
            }

            const token = this.csrfService.generateToken(req, res);
            return { csrfToken: token };
        } catch (error: any) {
            throw new InternalServerErrorException('Failed to generate CSRF Token');
        }
    }

    @Get('status')
    @ApiOperation({ summary: 'CSRF 상태 조회', description: '모니터링 / 디버깅용' })
    @ApiResponse({ status: 200, description: '상태 조회 성공', type: CsrfStatusResponseDto })
    async getCsrfStatus(): Promise<CsrfStatusResponseDto> {
        return this.csrfService.status();
    }
}
