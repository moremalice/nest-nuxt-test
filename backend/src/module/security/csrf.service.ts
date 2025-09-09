// backend/src/module/security/csrf.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { doubleCsrf, type CsrfRequestMethod } from 'csrf-csrf';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfService {
  private csrfUtils: ReturnType<typeof doubleCsrf> | null = null;
  private enabled = false;
  private failOpen = true;
  private reason = '';

  constructor(private readonly config: ConfigService) {
    this.initializeCsrf();
  }

  private initializeCsrf() {
    const nodeEnv = this.config.get<string>('NODE_ENV', 'local');
    const isProd = nodeEnv === 'production';
    this.failOpen =
      String(this.config.get('CSRF_STRICT') ?? 'false') !== 'true';

    try {
      this.csrfUtils = doubleCsrf({
        getSecret: this.getCsrfSecret.bind(this),
        getCsrfTokenFromRequest: this.getCsrfTokenFromRequest,
        getSessionIdentifier: this.getSessionIdentifier,
        cookieName: isProd ? '__Host-csrf-token' : 'csrf-token',
        cookieOptions: {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? 'strict' : 'lax',
          path: '/',
          maxAge: Number(
            this.config.get('CSRF_COOKIE_MAX_AGE') ?? 25 * 60 * 1000,
          ),
        },
        size: Number(this.config.get('CSRF_SIZE') ?? 128),
        ignoredMethods: ['GET', 'HEAD', 'OPTIONS'] as CsrfRequestMethod[],
      });

      this.enabled = true;
      this.reason = '';
      console.log('[CSRF] protection enabled');
    } catch (error: any) {
      this.enabled = false;
      this.reason = error?.message || 'unknown error';
      console.error('❌ Failed to initialize CSRF utilities:', error);

      if (!this.failOpen) {
        // Fail-fast 모드: 부팅 실패
        throw new Error(
          `CSRF initialization failed (strict mode): ${this.reason}`,
        );
      }
      // Fail-open 모드: no-op 미들웨어로 계속 서비스
      console.warn(
        '⚠️ CSRF protection is disabled (fail-open mode). Service continues to run.',
      );
    }
  }

  private getCsrfSecret(): string {
    const nodeEnv = this.config.get<string>('NODE_ENV', 'local');
    const isProd = nodeEnv === 'production';
    const secret = this.config.get<string>('CSRF_SECRET');

    if (secret) return secret;

    if (isProd) {
      console.error('CSRF_SECRET is missing in production!');
      return `prod-emergency-fallback-${Date.now()}`;
    }

    return 'dev-fallback-key-configure-in-production';
  }

  private getCsrfTokenFromRequest(req: Request): string | undefined {
    const token =
      (req.headers['x-csrf-token'] as string) ||
      (req.headers['csrf-token'] as string) ||
      (req.headers['x-xsrf-token'] as string) ||
      req.body?._token;
    return token;
  }

  private getSessionIdentifier(req: Request): string {
    // 세션 식별자 쿠키가 있으면 사용
    const sid = req.cookies?.['csrf-sid'];
    if (sid) {
      return sid;
    }

    // fallback: IP + User-Agent 해시 (모바일/프록시 환경에서 불안정할 수 있음)
    const ip = req.ip || (req.socket as any)?.remoteAddress || 'unknown';
    const ua = req.get?.('user-agent') || 'unknown';

    // 해시를 통해 식별자 길이를 일정하게 유지하고 민감 정보 난독화
    return crypto
      .createHash('sha256')
      .update(`${ip}-${ua}`)
      .digest('hex')
      .slice(0, 32);
  }

  get protection() {
    if (this.enabled && this.csrfUtils?.doubleCsrfProtection) {
      return this.csrfUtils.doubleCsrfProtection;
    }
    // no-op 미들웨어
    return (req: any, res: any, next: any) => {
      if (this.reason) {
        res.setHeader('X-CSRF-Disabled-Reason', this.reason);
      }
      next();
    };
  }

  generateToken(req: Request, res: Response): string {
    if (!this.enabled || !this.csrfUtils) {
      console.warn('CSRF token generation is disabled (fail-open mode)');
      return 'csrf-disabled';
    }
    return this.csrfUtils.generateCsrfToken(req, res);
  }

  // 상태 확인용 (헬스체크/운영 대시보드)
  status() {
    return {
      enabled: this.enabled,
      failOpen: this.failOpen,
      reason: this.reason,
    };
  }

  // 모바일 클라이언트 체크
  shouldSkipCsrf(req: Request): boolean {
    // 1. Check X-Client-Type header
    const clientTypeHeader = req.headers['x-client-type'] as string;
    if (clientTypeHeader?.toLowerCase().trim() === 'mobile') {
      return true;
    }

    // 2. Check User-Agent for mobile app patterns
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    const mobilePatterns = [
      'ios-app', 'android-app', 'mobile-app',
      'react-native', 'flutter', 'xamarin', 'cordova', 'phonegap',
      'expo', 'capacitor',
      'okhttp', 'alamofire', 'retrofit',
    ];
    
    return mobilePatterns.some(pattern => userAgent.includes(pattern));
  }
}
