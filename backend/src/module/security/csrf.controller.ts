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
        description: 'X-CSRF-Token header value'
    })
    csrfToken: string;
}

class CsrfStatusResponseDto {
    @ApiProperty({ example: true, description: 'Whether CSRF protection is enabled' })
    enabled: boolean;

    @ApiProperty({ example: true, description: 'Whether service continues on init failure' })
    failOpen: boolean;

    @ApiProperty({ example: '', description: 'Reason when CSRF is disabled' })
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
        summary: 'Issue CSRF token',
        description: 'Web: required for POST/PUT/DELETE | Mobile: not required'
    })
    @ApiResponse({
        status: 200,
        description: 'CSRF token issued',
        type: CsrfTokenResponseDto,
        headers: {
            'Set-Cookie': {
                description: 'CSRF session identifier cookie',
                schema: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 500, description: 'Failed to issue CSRF token' })
    async getCsrfToken(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{status: 'success'; data: CsrfTokenResponseDto}> {
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
            return { 
                status: 'success',
                data: { csrfToken: token }
            };
        } catch (error: any) {
            throw new InternalServerErrorException('Failed to generate CSRF Token');
        }
    }

    @Get('status')
    @ApiOperation({ summary: 'Get CSRF status', description: 'For monitoring / debugging' })
    @ApiResponse({ status: 200, description: 'Status ok', type: CsrfStatusResponseDto })
    async getCsrfStatus(): Promise<{status: 'success'; data: CsrfStatusResponseDto}> {
        return {
            status: 'success',
            data: this.csrfService.status(),
        };
    }
}

