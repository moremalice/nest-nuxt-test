# Nuxt 4 후속 작업 — 필수 섹션 재정리 (1, 2, 4, 5, 6, 7)

요청하신 항목만 깔끔하게 묶었습니다. `frontend/public/images/content`는 **유지** 기준입니다.

---

## 1) `nuxt.config.ts` — CSS 등록/순서 점검 (**필수**)

현재 전역 CSS 예시:
```ts
css: [
  '~/assets/css/font.css',
  '~/assets/css/default.css',
  '~/assets/css/common.css',
  '~/assets/css/content.css',
  'swiper/css',
  'swiper/css/pagination',
  'swiper/css/navigation'
],
```

### 권장 순서/정책
- **폰트 → 베이스 → 공통 → 벤더(Swiper) → 내 오버라이드** 순서를 기본으로 권장합니다.
- 오버라이드가 항상 **마지막**에 와야 기대한 스타일이 적용됩니다.
- Nuxt의 `css:` 배열은 **glob(`*`)를 지원하지 않습니다**. 개별 파일을 나열하거나 `main.css` 하나에 `@import`로 합치세요.

**권장 예시 A(내 CSS가 Swiper를 덮어씀):**
```ts
css: [
  '~/assets/css/font.css',
  '~/assets/css/default.css',
  '~/assets/css/common.css',
  'swiper/css',
  'swiper/css/pagination',
  'swiper/css/navigation',
  '~/assets/css/content.css' // overrides 마지막
]
```

**권장 예시 B(Swiper 전용 오버라이드 파일 분리):**
```ts
css: [
  '~/assets/css/font.css',
  '~/assets/css/default.css',
  '~/assets/css/common.css',
  'swiper/css',
  'swiper/css/pagination',
  'swiper/css/navigation',
  '~/assets/css/swiper-overrides.css',
  '~/assets/css/content.css'
]
```

---

## 2) `font.css` 내부 경로/프리로드 (**필수**)

이동 후 기준 경로로 맞추세요:
```css
@font-face {
  font-family: 'Inter';
  src: url('~/assets/fonts/Inter.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

초기 렌더에서 폰트를 빨리 불러야 한다면 **preload**(선택):
```ts
// app/app.vue (또는 플러그인)
import { useHead } from '#imports'
useHead({
  link: [
    { rel: 'preload', as: 'font', type: 'font/woff2', href: '/_nuxt/assets/fonts/Inter.woff2', crossorigin: 'anonymous' }
  ]
})
```
> 빌드 후 실제 경로/파일명은 Network 탭으로 확인 후 반영하세요. (필수는 아님)

---

## 4) 경로 치환 검증 (**필수**)

다음 구경로가 남아있지 않은지 점검:
- `/img/common/...` → **`~/assets/images/common/...`**
- `url('/css/font/...')` → **`url('~/assets/fonts/...')`**
- `~/app/...` → **`~/...`** (Nuxt 4에서 `~`는 `app/`을 가리킴)

**PowerShell (Windows)**
```powershell
# 잔존 경로 스캔
git grep -nE '["' + "'" + r"']/(img/common|css/font)/" + "'" + r' -- frontend || echo "OK"'
git grep -n "~/app/" -- frontend && echo "Replace ~/app/ with ~/" || echo "OK"
```

**Bash (WSL/Git Bash)**
```bash
git grep -nE '["'\'']/(img/common|css/font)/' -- frontend || echo "OK"
git grep -n "~/app/" -- frontend && echo "Replace ~/app/ with ~/" || echo "OK"
```

---

## 5) `public/images/content` 유지 (**확인**)

- **왜 유지?**
  - 외부 공유/크롤링/문서 링크 등 **안정 URL**이 필요합니다. (`/images/content/...`)
  - 대용량/다량 이미지에 대해 CDN/캐시 정책을 **정적 경로 기준**으로 관리하기 수월합니다.
  - 빌드 해시/경로 변동(번들 자산화)로 인한 **링크 깨짐 리스크**를 피할 수 있습니다.

- **언제 `app/assets`로 옮겨도 되나?**
  - UI에 **직접 import**해서 쓰는 소수 이미지이고,
  - 외부에서 **직접 URL 접근이 필요 없을 때**, 그리고
  - 해시 캐싱의 이점이 더 클 때.

> 현재처럼 **콘텐츠는 public 유지**, **UI 자산은 app/assets**가 기본 전략으로 가장 안전합니다.

---

## 6) 빌드/검증 (**필수**)

```bash
cd frontend
pnpm i           # 또는 npm i / yarn
pnpm dev         # 개발 서버 확인
npx nuxi analyze # 번들/에셋 해시/로딩 확인
```
브라우저에서 확인:
- **Network 404 없음**(폰트/이미지/Swiper CSS)
- i18n **파일 기반 lazy 로딩** 정상(언어 전환 시 네트워크 요청 확인)
- Swiper pagination/navigation 스타일이 의도대로 적용

---

## 7) 퍼포먼스/보안 보완 (**권장**)

- **DevTools** (프로덕션 비활성)
  ```ts
  devtools: { enabled: process.env.NODE_ENV !== 'production' }
  ```
- **runtimeConfig**: 클라이언트 노출은 `NUXT_PUBLIC_*`만. 나머진 서버 전용(`useRuntimeConfig()`).
- **캐시 정책**
  - `/_nuxt/*`(해시 파일) → **장기 캐시** 안전.
  - `/images/content/**` → CDN에서 `Cache-Control` 최적화(파일명 버저닝 시 `immutable` 고려).
- **routeRules** 활용 (페이지 단위 캐시/ISR/CSR)
  ```ts
  routeRules: {
    '/(blog|product)/**': { isr: 300 },
    '/account/**': { cache: { swr: false, maxAge: 0 } },
    // '/map/**': { ssr: false }, // 대화형 페이지 CSR 전환
  }
  ```
- **@nuxt/image**(선택): 콘텐츠 이미지를 `<NuxtImg>`로 서빙하면 포맷/리사이즈/캐시가 쉬워집니다.

---

## 빠른 체크박스

- [ ] favicon/robots/sitemap 정합성 확인
- [ ] `css:` 순서가 **오버라이드 우선순위**를 보장한다
- [ ] `font.css` 경로가 `~/assets/fonts/*`로 맞다 (+ 필요 시 preload)
- [ ] `/img/common/`, `url('/css/font/')`, `~/app/` 구경로 **잔존 없음**
- [ ] dev 서버/빌드 404 없음, i18n lazy 정상, Swiper 스타일 정상
- [ ] `public/images/content`는 `/images/content/*`로 **유지**
- [ ] DevTools prod 비활성, `runtimeConfig`/캐시/`routeRules` 점검

---

## 8) SEO / Static files (favicon, robots, sitemap) (**필수**)

**목표:** SEO/크롤러/공유 카드가 **안정 URL**로 접근하도록 `public/`에 핵심 파일을 배치하고, 중복/누락을 막는다.

### A) 파일 존재/정합성 점검
```powershell
# 반드시 레포 루트에서 실행
# 1) 필수 파일 존재 확인
Test-Path .\frontend\public\favicon.ico
Test-Path .\frontend\public\robots.txt
Test-Path .\frontend\public\sitemap.xml

# 2) favicon 중복(예: public/img/common/favicon.ico) 제거 대상 확인
Test-Path .\frontend\public\img\common\favicon.ico

# 3) 대표 OG 이미지 경로 (예: /images/Pikibrand_preview.png)
Test-Path .\frontend\public\images\Pikibrand_preview.png
```

- **단일 canonical 파비콘**만 유지: `frontend/public/favicon.ico`  
  (다른 위치의 파비콘은 제거 또는 이 경로로 통일)
- **robots.txt**와 **sitemap.xml**은 `frontend/public/` 루트에 둔다.
- 대표 **OG 이미지**는 `/images/...`로 두고 메타에서 절대/상대 경로로 참조.

### B) 샘플 템플릿
**robots.txt**
```
User-agent: *
Disallow:

# (선택) 관리자/내부 경로 비공개
# Disallow: /admin/
# Disallow: /internal/

Sitemap: https://{YOUR_DOMAIN}/sitemap.xml
```

> 여러 환경을 쓰면 빌드시 `NUXT_PUBLIC_SITE_URL`로 도메인을 주입하고, CI에서 `robots.txt`를 환경별로 교체하거나 `Sitemap:` 줄을 생략하세요.

**sitemap.xml (정적 버전; 빠르게 시작용)**
> 가장 간단한 방법은 정적 파일을 두는 것입니다. (향후 @nuxtjs/sitemap로 대체 가능)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://{YOUR_DOMAIN}/</loc></url>
  <!-- 필요한 경로들을 추가 -->
</urlset>
```

**Nuxt에서 메타(OG/Twitter) 예시**
```ts
// app/app.vue 또는 레이아웃에서
<script setup lang="ts">
import { useSeoMeta } from '#imports'

useSeoMeta({
  title: 'Your Site Title',
  ogTitle: 'Your Site Title',
  description: 'Your site description.',
  ogDescription: 'Your site description.',
  ogImage: '/images/Pikibrand_preview.png', // public 기반
  twitterCard: 'summary_large_image',
})
</script>
```

### C) @nuxtjs/sitemap로 전환 (선택, 권장)
보다 유연한 동적/다국어 sitemap가 필요하면 모듈을 사용합니다.
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@nuxtjs/sitemap', // 추가
  ],
  sitemap: {
    siteUrl: process.env.NUXT_PUBLIC_SITE_URL, // e.g. https://example.com
    gzip: true,
    autoLastmod: true,
    # /* i18n 연동 시 locales/alternate 링크 자동화 가능 */
  },
})
```
> 다국어(i18n) 사용 시 각 로케일 경로를 자동으로 수집해 alternate 링크를 생성할 수 있습니다.

### D) 캐시/헤더(선택)
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/robots.txt':   { headers: { 'cache-control': 'public, max-age=3600' } },
    '/sitemap.xml':  { headers: { 'cache-control': 'public, max-age=600' } },
    // 정적 OG 이미지는 CDN 캐시 정책으로 관리 권장
  }
})
```

### E) PR 체크 추가
- [ ] `frontend/public/`에 **favicon.ico**, **robots.txt**, **sitemap.xml** 존재
- [ ] 파비콘 **중복 제거** 및 경로 통일 (`/favicon.ico`만 유지)
- [ ] 대표 **OG 이미지**는 `/images/...`에 있고 메타에서 참조
- [ ] (선택) `@nuxtjs/sitemap` 도입 및 `NUXT_PUBLIC_SITE_URL` 구성
- [ ] `/robots.txt`/`/sitemap.xml` 캐시 헤더 정책 점검
