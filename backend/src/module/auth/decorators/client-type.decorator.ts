// /backend/src/module/auth/decorators/client-type.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export enum ClientType {
  WEB = 'web',
  MOBILE = 'mobile',
}

/**
 * Shared logic for determining client type
 */
function determineClientType(request: Request): ClientType {
  // 1. Check custom header first (highest priority)
  const clientTypeHeader = request.headers['x-client-type'] as string;
  if (clientTypeHeader) {
    const normalizedHeader = clientTypeHeader.toLowerCase().trim();
    if (normalizedHeader === 'mobile') {
      return ClientType.MOBILE;
    }
    if (normalizedHeader === 'web') {
      return ClientType.WEB;
    }
  }
  
  // 2. Fallback to User-Agent detection (medium priority)
  const userAgent = request.headers['user-agent']?.toLowerCase() || '';
  
  // Mobile app patterns (native and hybrid frameworks)
  const mobilePatterns = [
    // Native app identifiers
    'ios-app', 'android-app', 'mobile-app',
    // Cross-platform frameworks
    'react-native', 'flutter', 'xamarin', 'cordova', 'phonegap',
    // Specific app identifiers (add your app name here)
    'nest-nuxt-app', 'your-app-name',
    // Development tools
    'expo', 'capacitor',
  ];
  
  // Web browser patterns to exclude from mobile detection
  const webBrowserPatterns = [
    'mozilla', 'webkit', 'chrome', 'safari', 'firefox', 'edge', 'opera'
  ];
  
  // Check if it's definitely a mobile app
  const isMobileApp = mobilePatterns.some(pattern => userAgent.includes(pattern));
  
  // Check if it's a web browser accessing via mobile device
  const isWebBrowser = webBrowserPatterns.some(pattern => userAgent.includes(pattern));
  
  // Mobile app takes precedence over mobile browser
  if (isMobileApp) {
    return ClientType.MOBILE;
  }
  
  // If it's a web browser, it's web regardless of device
  if (isWebBrowser) {
    return ClientType.WEB;
  }
  
  // 3. Default to web for unknown user agents
  return ClientType.WEB;
}

/**
 * Determines client type with improved detection logic
 * Priority: 1. X-Client-Type header 2. User-Agent patterns 3. Default to web
 */
export const GetClientType = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ClientType => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return determineClientType(request);
  },
);

/**
 * Simplified boolean check for mobile clients
 * Uses same logic as GetClientType for consistency
 */
export const IsMobileClient = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): boolean => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const clientType = determineClientType(request);
    return clientType === ClientType.MOBILE;
  },
);