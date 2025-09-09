// backend/src/module/security/middleware/smart-csrf.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CsrfService } from '../csrf.service';

@Injectable()
export class SmartCsrfMiddleware implements NestMiddleware {
  constructor(private readonly csrfService: CsrfService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for mobile clients
    if (this.isMobileClient(req)) {
      // Add header to indicate CSRF was skipped
      res.setHeader('X-CSRF-Skipped', 'mobile-client');
      return next();
    }

    // Apply CSRF protection for web clients
    const protection = this.csrfService.protection;
    protection(req, res, next);
  }

  private isMobileClient(req: Request): boolean {
    // 1. Check X-Client-Type header (highest priority)
    const clientTypeHeader = req.headers['x-client-type'] as string;
    if (clientTypeHeader) {
      const normalizedHeader = clientTypeHeader.toLowerCase().trim();
      return normalizedHeader === 'mobile';
    }

    // 2. Check User-Agent for mobile app patterns
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    
    // Mobile app patterns (native and hybrid frameworks)
    const mobilePatterns = [
      // Native app identifiers
      'ios-app', 'android-app', 'mobile-app',
      // Cross-platform frameworks
      'react-native', 'flutter', 'xamarin', 'cordova', 'phonegap',
      // Specific app identifiers
      'nest-nuxt-app', 'your-app-name',
      // Development tools
      'expo', 'capacitor',
      // HTTP clients commonly used by mobile apps
      'okhttp', 'alamofire', 'retrofit',
    ];
    
    // Check if it's a mobile app
    return mobilePatterns.some(pattern => userAgent.includes(pattern));
  }
}