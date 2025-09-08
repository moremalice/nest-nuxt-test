// src/common/common.service.ts
import { Injectable } from '@nestjs/common';

/**
 * MySQL LIKE 패턴에서 와일드카드(%/_), ESCAPE 문자 자체를 이스케이프.
 * 기본 ESCAPE 문자는 '!' 사용 (NO_BACKSLASH_ESCAPES에서도 안전)
 */
export const LIKE_ESCAPE_CHAR = '!' as const;

const escapeForCharClass = (s: string) =>
  s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

@Injectable()
export class CommonService {
  readonly LIKE_ESCAPE_CHAR = LIKE_ESCAPE_CHAR;

  escapeLike(term: unknown, escapeChar: string = LIKE_ESCAPE_CHAR): string {
    const src =
      typeof term === 'string' ? term : term == null ? '' : String(term);
    const re = new RegExp(`[${escapeForCharClass(escapeChar)}%_]`, 'g');
    return src.replace(re, `${escapeChar}$&`);
  }

  /** 부분일치 패턴 생성: %<escaped>% */
  toLikeContainsPattern(
    term: unknown,
    escapeChar: string = LIKE_ESCAPE_CHAR,
  ): string {
    return `%${this.escapeLike(term, escapeChar)}%`;
  }
}
