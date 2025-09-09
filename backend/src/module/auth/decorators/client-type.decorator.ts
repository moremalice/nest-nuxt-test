// /backend/src/module/auth/decorators/client-type.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export enum ClientType {
    WEB = 'web',
    MOBILE = 'mobile',
}

function determineClientType(request: Request): ClientType {
    // 1. 커스텀 헤더 먼저 확인 (최우선)
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

    // 2. User-Agent 감지로 폴백 (중간 우선순위)
    const userAgent = request.headers['user-agent']?.toLowerCase() || '';

    // 모바일 앱 패턴 (네이티브 및 하이브리드 프레임워크)
    const mobilePatterns = [
        // 네이티브 앱 식별자
        'ios-app', 'android-app', 'mobile-app',
        // 크로스플랫폼 프레임워크
        'react-native', 'flutter', 'xamarin', 'cordova', 'phonegap',
        // 특정 앱 식별자 (여기에 앱 이름을 추가하세요)
        'nest-nuxt-app', 'your-app-name',
        // 개발 도구
        'expo', 'capacitor',
    ];

    // 모바일 감지에서 제외할 웹 브라우저 패턴
    const webBrowserPatterns = [
        'mozilla', 'webkit', 'chrome', 'safari', 'firefox', 'edge', 'opera'
    ];

    // 확실히 모바일 앱인지 확인
    const isMobileApp = mobilePatterns.some(pattern => userAgent.includes(pattern));

    // 모바일 기기에서 웹 브라우저로 접근하는지 확인
    const isWebBrowser = webBrowserPatterns.some(pattern => userAgent.includes(pattern));

    // 모바일 앱이 모바일 브라우저보다 우선
    if (isMobileApp) {
        return ClientType.MOBILE;
    }

    // 웹 브라우저라면 기기에 관계없이 웹으로 분류
    if (isWebBrowser) {
        return ClientType.WEB;
    }

    // 3. 알 수 없는 User-Agent의 경우 웹으로 기본 설정
    return ClientType.WEB;
}

/**
 * 우선순위: 1. X-Client-Type 헤더 2. User-Agent 패턴 3. 웹으로 기본 설정
 */
export const GetClientType = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): ClientType => {
        const request = ctx.switchToHttp().getRequest<Request>();
        return determineClientType(request);
    },
);

export const IsMobileClient = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): boolean => {
        const request = ctx.switchToHttp().getRequest<Request>();
        const clientType = determineClientType(request);
        return clientType === ClientType.MOBILE;
    },
);