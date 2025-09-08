// backend/src/common/i18n/custom-language.resolver.ts
import { ExecutionContext } from '@nestjs/common';
import { I18nResolver } from 'nestjs-i18n';

interface RequestWithQuery {
  query?: { lang?: string };
  headers?: Record<string, string>;
}

export class CustomLanguageResolver implements I18nResolver {
  resolve(context: ExecutionContext): string | Promise<string> {
    let req: RequestWithQuery;

    try {
      // HTTP 컨텍스트에서 요청 객체 추출
      req = context.switchToHttp().getRequest();
    } catch (error) {
      console.error('Error getting request from context:', error);
      return 'en';
    }

    const getHeader = (headerName: string): string | undefined => {
      if (!req?.headers) return undefined;
      return req.headers[headerName];
    };

    try {
      // 1. 쿼리 파라미터 확인 (우선순위 1)
      if (req?.query?.lang) {
        return req.query.lang === 'en' ? 'en' : 'ko';
      }

      // 2. 커스텀 헤더 확인 (우선순위 2)
      const customLang = getHeader('x-custom-lang');
      if (customLang) {
        return customLang === 'en' ? 'en' : 'ko';
      }

      // 3. Accept-Language 헤더 확인 (우선순위 3)
      const acceptLang = getHeader('accept-language');
      if (acceptLang) {
        return acceptLang.toLowerCase().includes('en') ? 'en' : 'ko';
      }

      // 4. 기본값은 'ko'
      return 'en';
    } catch (error) {
      console.error('Error resolving language:', error);
      return 'en';
    }
  }
}
