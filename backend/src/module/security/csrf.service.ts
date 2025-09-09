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
                throw new Error(
                    `CSRF initialization failed (strict mode): ${this.reason}`,
                );
            }
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
            (req.body as any)?._token;
        return token;
    }

    private getSessionIdentifier(req: Request): string {
        const sid = (req as any).cookies?.['csrf-sid'];
        if (sid) {
            return sid;
        }

        // fallback: IP + User-Agent hash
        const ip = (req as any).ip || (req.socket as any)?.remoteAddress || 'unknown';
        const ua = (req as any).get?.('user-agent') || 'unknown';

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
        // no-op middleware
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

    // health/status
    status() {
        return {
            enabled: this.enabled,
            failOpen: this.failOpen,
            reason: this.reason,
        };
    }

    // centralized mobile client detection
    shouldSkipCsrf(req: Request): boolean {
        const clientTypeHeader = (req.headers['x-client-type'] as string) || '';
        if (clientTypeHeader.toLowerCase().trim() === 'mobile') {
            return true;
        }

        const userAgent = (req.headers['user-agent'] || '').toLowerCase();
        const mobilePatterns = [
            'ios-app', 'android-app', 'mobile-app',
            'react-native', 'flutter', 'xamarin', 'cordova', 'phonegap',
            'expo', 'capacitor',
            'okhttp', 'alamofire', 'retrofit',
        ];

        return mobilePatterns.some(pattern => userAgent.includes(pattern));
    }
}
