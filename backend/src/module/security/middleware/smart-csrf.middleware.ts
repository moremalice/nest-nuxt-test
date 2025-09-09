// backend/src/module/security/middleware/smart-csrf.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CsrfService } from '../csrf.service';

@Injectable()
export class SmartCsrfMiddleware implements NestMiddleware {
    constructor(private readonly csrfService: CsrfService) {}

    use(req: Request, res: Response, next: NextFunction) {
        // Centralized mobile skip logic
        if (this.csrfService.shouldSkipCsrf(req)) {
            res.setHeader('X-CSRF-Skipped', 'mobile-client');
            return next();
        }
        // Apply double-csrf protection for web clients
        return this.csrfService.protection(req as any, res as any, next as any);
    }
}
