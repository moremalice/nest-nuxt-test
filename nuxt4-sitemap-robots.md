# Nuxt 4에서 **Sitemap/Robots** 설계 가이드 (동적 확장 가능 · 실무 기준)

> 목표: **Nuxt 4** + **@nuxtjs/sitemap** + **@nuxtjs/robots** 조합으로,  
> - 정적/동적 URL 모두를 안정적으로 수집
> - 환경별(로컬/스테이징/프로덕션) **인덱싱 정책 자동 전환**
> - **캐시/성능**과 **보안/운영**을 함께 고려

---

## TL;DR (요약)

- `site.url`(또는 `runtimeConfig.public.siteUrl`)을 **정확히** 설정한다.  
- 정적 페이지는 **Application Sources**가 자동 수집, 동적 페이지는 **User Sources**로 `/api/__sitemap__/…` 엔드포인트를 만들어 공급한다.  
- `/sitemap.xml`, `/robots.txt`는 **SWR 캐시(또는 defineCachedEventHandler)** + **routeRules 헤더**로 적절히 캐싱한다.  
- 비프로덕션(로컬/스테이징)은 **인덱싱 금지** 정책을 기본값으로 유지한다.  
- URL이 많아지면 **멀티 사이트맵**(chunking)으로 분리한다.

---

## 1) 설치

```bash
# Sitemap
npx nuxi module add sitemap    # or: npm i @nuxtjs/sitemap

# Robots
npx nuxi module add robots     # or: npm i @nuxtjs/robots
```

---

## 2) 기본 nuxt.config.ts 스켈레톤

> `site.url`을 **반드시** 환경변수로 주입하세요. (예: PROD: `https://example.com`, STAGE: `https://staging.example.com`)

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    // '@nuxtjs/i18n', '@nuxt/content' 등을 사용 중이면 함께 추가
  ],

  // 통합 사이트 설정(여기 값은 SEO 모듈들이 참조)
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,     // ex) https://example.com
    name: 'MyApp',
    // indexable: process.env.NODE_ENV === 'production'  // 필요시 명시적 지정
  },

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
      apiBase: process.env.NUXT_PUBLIC_API_BASE, // 동적 소스가 의존하면 사용
    }
  },

  // === Sitemap ===
  sitemap: {
    /**
     * Application Sources(자동 수집)와 User Sources(수동/엔드포인트 기반)를 병행하는 기본 형태.
     * - nuxt:pages, @nuxtjs/i18n, @nuxt/content 등은 자동 수집
     * - 동적 라우트는 /api/__sitemap__/urls 등에서 공급
     */
    excludeAppSources: false,
    sources: [
      '/api/__sitemap__/urls',  // 우리가 만드는 동적 소스(아래 예시)
    ],
    // 대규모일 때는 멀티 사이트맵 설정(sitemaps)으로 분리
    // sitemaps: {
    //   posts: { sources: ['/api/__sitemap__/urls/posts'] },
    //   pages: { sources: ['/api/__sitemap__/urls/pages'] }
    // }
  },

  // === Robots ===
  robots: {
    // 비프로덕션 환경은 기본적으로 인덱싱 금지(모듈 기본값도 동일 취지)
    // 필요 시 groups로 상세 제어
    groups: [
      {
        userAgent: '*',
        // 프로덕션만 인덱싱 허용
        disallow: process.env.NODE_ENV === 'production' ? [] : ['/'],
      }
    ],
    // Search Console 제출을 위해 사이트맵 URL을 명시
    sitemap: ['/sitemap.xml'],
    // robots.txt 캐시 헤더(운영/부하 상황에 맞춰 조정)
    cacheControl: 'max-age=14400, must-revalidate', // 4시간
  },

  // === 캐시 / 헤더 ===
  routeRules: {
    // nuxt sitemap은 기본 SWR 캐시가 있으나, 서비스 특성에 맞게 조정 가능
    '/sitemap.xml': {
      swr: 600, // 10분
      headers: { 'cache-control': 'public, max-age=600, stale-while-revalidate=86400' }
    },
    '/sitemap-*.xml': {
      swr: 600,
      headers: { 'cache-control': 'public, max-age=600, stale-while-revalidate=86400' }
    },
    '/robots.txt': {
      swr: 600,
      headers: { 'cache-control': 'public, max-age=600, must-revalidate' }
    }
  }
})
```

> 참고: CDN/플랫폼(NETLIFY/VERCEL/CF 등)에 따라 routeRules 반영 방식이 달라질 수 있으니 환경별로 실제 응답 헤더를 꼭 확인하세요.

---

## 3) 동적 URL 공급 엔드포인트 (권장)

동적 라우트는 CMS/DB/외부 API에 따라 **런타임에 변동**되므로, **`server/api/__sitemap__/…`** 엔드포인트에서 가공하여 제공하는 방식이 실패율이 낮습니다.

### 단일 엔드포인트 예시

```ts
// server/api/__sitemap__/urls.ts
import { defineSitemapEventHandler } from '#imports'
import type { SitemapUrl } from '#sitemap/types'

export default defineSitemapEventHandler(async () => {
  // 예시: 외부 API/DB에서 문서 목록을 가져와 URL로 매핑
  const posts = await $fetch<{ slug: string; updatedAt?: string }[]>(
    `${useRuntimeConfig().public.apiBase}/posts`
  )

  const urls: SitemapUrl[] = posts.map((p) => ({
    loc: `/blog/${p.slug}`,
    lastmod: p.updatedAt,              // 실제 컨텐츠 갱신 시각을 넣는 것이 Best
    changefreq: undefined,             // 일반적으로 불필요(권장 X)
    priority: undefined                // 일반적으로 불필요(권장 X)
  }))

  return urls
})
```

### 멀티 사이트맵(컨텐츠 유형별 분리)

```ts
// server/api/__sitemap__/urls/posts.ts
import { defineSitemapEventHandler } from '#imports'
export default defineSitemapEventHandler(async () => {
  const list = await $fetch<{ slug: string }[]>(`${useRuntimeConfig().public.apiBase}/posts`)
  return list.map((p) => ({ loc: `/blog/${p.slug}`, _sitemap: 'posts' }))
})

// server/api/__sitemap__/urls/pages.ts
import { defineSitemapEventHandler } from '#imports'
export default defineSitemapEventHandler(async () => {
  const list = await $fetch<{ path: string }[]>(`${useRuntimeConfig().public.apiBase}/pages`)
  return list.map((p) => ({ loc: p.path, _sitemap: 'pages' }))
})

// nuxt.config.ts - sitemaps에 각 소스 연결
export default defineNuxtConfig({
  sitemap: {
    sitemaps: {
      posts: { sources: ['/api/__sitemap__/urls/posts'] },
      pages: { sources: ['/api/__sitemap__/urls/pages'] }
    }
  }
})
```

### i18n(다국어) URL/대체 링크(hreflang) 처리

```ts
// server/api/__sitemap__/urls.ts
import { defineSitemapEventHandler } from '#imports'
import type { SitemapUrl } from '#sitemap/types'

export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.siteUrl

  // locales 예: [{ code: 'en', iso: 'en' }, { code: 'ko', iso: 'ko' }]
  const locales = (config.public as any).i18n?.locales?.map((l: any) => l.code) || ['en']

  const items = await Promise.all(locales.map((l) =>
    $fetch<{ slug: string; alternates?: Array<{ locale: string; slug: string }> }[]>(
      `${config.public.apiBase}/sitemap/${l}/products`
    ).then(list => list.map(entry => ({
      loc: `/${l}/product/${entry.slug}`,
      alternatives: entry.alternates?.map(a => ({
        hreflang: a.locale, href: `${baseUrl}/${a.locale}/product/${a.slug}`
      }))
    } satisfies SitemapUrl)))
  ))

  return items.flat()
})
```

---

## 4) 캐시 전략 (SWR + 서버 캐시)

### A) routeRules 의 SWR 캐싱(간단)

- `nuxt.config.ts`의 `routeRules`에서 `/sitemap*.xml`, `/robots.txt`에 `swr`/헤더를 부여합니다.  
- **장점**: 설정이 간단, 플랫폼 호환성 우수  
- **주의**: 소스 API가 느릴 경우 최초 요청이 느릴 수 있음 → 아래 B안 병행 고려

### B) Nitro `defineCachedEventHandler` (엔드포인트 자체 캐시)

동적 소스 엔드포인트가 무거울 때 **서버 캐시**를 직접 부여합니다.

```ts
// server/api/__sitemap__/urls.ts
export default defineCachedEventHandler(async () => {
  // ...동적 URL 생성 로직(위 예시 동일)
}, {
  maxAge: 60 * 10,     // 10분 캐시
  staleMaxAge: 60 * 60 // (선택) 오래된 캐시 허용 시간
})
```

> 운영 중 데이터 변경 시, 관리자 API에서 캐시 무효화(`useStorage('cache').clear()` 등) 루틴을 갖추면 안전합니다.

---

## 5) Robots 정책 설계

- **기본값**: 개발/스테이징은 **noindex**, 프로덕션은 **index**.  
- 라우트 단위로 민감/비공개 페이지는 **noindex** 메타/헤더를 강제.  
- `robots.sitemap`에 `/sitemap.xml`(또는 `/sitemap_index.xml`)을 등록.

고급 예시:

```ts
// nuxt.config.ts (발췌)
export default defineNuxtConfig({
  robots: {
    groups: [
      // 기본 그룹
      { userAgent: '*', disallow: process.env.NODE_ENV === 'production' ? [] : ['/'] },
      // 광고/특정 봇 제어 예시
      {
        userAgent: ['AdsBot-Google-Mobile', 'AdsBot-Google-Mobile-Apps'],
        disallow: ['/admin'],
        allow: ['/admin/login'],
        comments: 'Allow AdsBot only on login page'
      },
    ],
    sitemap: ['/sitemap.xml'],
    cacheControl: 'max-age=14400, must-revalidate'
  },

  // 라우트 단위 noindex (robots 모듈이 X-Robots-Tag와 <meta>를 자동 처리)
  routeRules: {
    '/admin/**': { robots: 'noindex, nofollow' }, // 필요시
  }
})
```

---

## 6) 대규모/운영 고려사항

- **멀티 사이트맵**으로 컨텐츠 유형별/양별 분리(하나당 최대 **50,000 URL**).  
- **`lastmod`**는 “빌드 시각”이 아니라 **실제 컨텐츠 갱신 시각**을 넣는 것이 최선.  
- `/sitemap*.xml`과 동적 소스 API에 **SWR + 서버 캐시**를 함께 적용하면 부하/지연을 최소화.  
- i18n을 쓰면 **alternates(hreflang)**를 꼭 제공.  
- CDN/플랫폼 캐시가 개입되면 **헤더 충돌**이 없는지 실제 응답을 확인.

---

## 7) 점검 체크리스트

- [ ] `site.url`/`runtimeConfig.public.siteUrl`이 **실제 도메인**으로 설정됨  
- [ ] `/sitemap.xml`과 `/robots.txt`가 열리고, 올바른 캐시 헤더가 붙음  
- [ ] 동적 소스 엔드포인트(`/api/__sitemap__/…`)가 **200/빠른 응답**  
- [ ] Search Console에 `/sitemap.xml`(또는 `/sitemap_index.xml`) **등록 완료**  
- [ ] 스테이징에서 **noindex**가 확실히 적용  
- [ ] 대량 URL 시 **멀티 사이트맵/청크 분리** 적용  
- [ ] `lastmod` 값이 실제 컨텐츠 갱신 시각을 반영

---

## 부록: 타입 힌트

```ts
// server/tsconfig.json (권장: 서버 타입 안전성 강화)
{
  "extends": "./.nuxt/tsconfig.server.json",
  "compilerOptions": {
    "types": ["@types/node"]
  }
}
```

```ts
// SitemapUrl 타입 예시(자동 import 사용)
import type { SitemapUrl } from '#sitemap/types'

const one: SitemapUrl = {
  loc: '/about',
  lastmod: '2025-09-01'
}
```