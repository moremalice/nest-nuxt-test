// backend/src/module/security/middleware/smart-csrf.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CsrfService } from '../csrf.service';

@Injectable()
export class SmartCsrfMiddleware implements NestMiddleware {
    constructor(private readonly csrfService: CsrfService) {}

    use(req: Request, res: Response, next: NextFunction) {
        // 중앙화된 모바일 건너뛰기 로직
        if (this.csrfService.shouldSkipCsrf(req)) {
            res.setHeader('X-CSRF-Skipped', 'mobile-client');
            return next();
        }

        // CSRF 라이브러리를 위한 쿠키 객체 존재 보장
        if (!(req as any).cookies) {
            (req as any).cookies = {};
        }

        // 웹 클라이언트용 이중 CSRF 보호 적용
        return this.csrfService.protection(req as any, res as any, next as any);
    }
}