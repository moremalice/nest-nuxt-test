# Nuxt 4 프록시 & CORS 실무 가이드 (프로젝트 적용판)

> 목적: 현재 `server/api/proxy/[...path].ts`에서 헤더를 수동 복사하던 방식을 **간소화**하고, **프로덕션 일관성** 있게 운영하기 위한 베스트 프랙티스 정리.

---

## TL;DR

- **가장 간단한 해법**: `nuxt.config.ts`의 **`routeRules.proxy` 한 줄**로 리버스 프록시 처리. 별도 라우트 코드 불필요.
- **라우트 파일을 유지해야 하면**: `fetch()`의 **`Response`를 그대로 반환**하세요. 헤더/상태/스트리밍을 자동 전달 → 수동 복사 금지.
- **CORS**: 동일 오리진 프록시라면 **별도 CORS 헤더 필요 없음**. 외부 도메인에서 이 프록시를 호출해야 할 때만 정확한 Origin 지정.
- **개발 전용**: `nitro.devProxy`는 개발에서만. 프로덕션은 `routeRules.proxy` 사용.

---

## 1) 코드 없이 끝내기 — `routeRules.proxy` (권장)

`/proxy/**` → `https://pikitalk.com/data/**` 로 프록시.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/proxy/**': {
      proxy: 'https://pikitalk.com/data/**',
      // 필요 시:
      // headers: { 'cache-control': 'public, max-age=3600' },
      // cors: true, // 외부 오리진이 이 프록시를 호출해야 할 때만
    },
  },
})
```

### 장점
- **프로덕션/개발 모두 동일**하게 동작 (코드 무관).
- 원본 **상태코드/헤더/스트림 자동 전달** → HLS/Range 대응도 자연스럽게 처리.
- 프록시 경로(`/proxy/**`)만 프론트에서 호출하면 **CORS 회피**.

### 호출 예
```ts
// 클라이언트/서버 공통
const users = await $fetch('/proxy/users') // => https://pikitalk.com/data/users
```

---

## 2) 라우트 유지 시 — `Response` 그대로 반환 (최소 코드)

H3/Nitro는 `fetch()`의 **Response 객체를 그대로 return** 하면 상태/헤더/바디가 자동 전달됩니다.

```ts
// server/api/proxy/[...path].ts
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') ?? ''

  // HLS(.m3u8/.ts) 등 Range 중요 리소스: 필요한 헤더만 포워딩
  const reqHeaders = getRequestHeaders(event)
  const forward: Record<string, string> = {}
  for (const h of ['range', 'if-none-match', 'if-modified-since', 'accept', 'user-agent', 'referer']) {
    if (reqHeaders[h]) forward[h] = reqHeaders[h] as string
  }

  const upstream = await fetch(`https://pikitalk.com/data/${path}`, { headers: forward })

  // 핵심: 수동 setHeader/Content-Type/Length 복사 불필요
  return upstream
})
```

### 왜 좋은가?
- **스트리밍 안전**: 대용량/미디어 응답 손상 위험 ↓
- **헤더 실수 최소화**: Content-Type/Length/Cache-Control 등을 복사 누락/오타로 망치지 않음
- **코드 단순화**: 유지보수성 ↑

---

## 3) CORS 정책 — 언제, 어떻게?

- 동일 오리진(프록시 경유)이라면 **별도 CORS 헤더가 필요 없음**.
- **외부 도메인**에서 이 Nuxt 프록시를 호출한다면:
  - `routeRules.cors: true`로 기본 CORS 켜고,
  - `headers`로 **정확한 Origin** 지정 (와일드카드 `*` + `credentials`는 브라우저가 거부).

```ts
// nuxt.config.ts (외부 오리진에서 호출해야 할 때만)
export default defineNuxtConfig({
  routeRules: {
    '/proxy/**': {
      proxy: 'https://pikitalk.com/data/**',
      cors: true,
      headers: {
        'access-control-allow-origin': 'https://your-site.com', // 정확한 오리진 지정
        'access-control-allow-credentials': 'true',
        'access-control-allow-methods': 'GET,HEAD,POST,OPTIONS',
      },
    },
  },
})
```

> **Tip**: `credentials`(쿠키 등)과 함께라면 `Access-Control-Allow-Origin: *`는 금지. 반드시 **정확한 오리진**을 넣으세요.

---

## 4) 개발 전용 — `nitro.devProxy` (선택)

개발 중 브라우저 호출만 빠르게 우회해야 할 때 사용. **프로덕션에는 적용되지 않음**.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    devProxy: {
      '/proxy': {
        target: 'https://pikitalk.com/data',
        changeOrigin: true, // Host 헤더 대상 도메인으로 변경
      },
    },
  },
})
```

---

## 5) 현재 코드에서의 마이그레이션 가이드 (Diff)

수동 헤더 복사/수동 Content-Type 판별/수동 Cache-Control 설정 제거.

```diff
- // 헤더 수동 복사
- setHeader(event, 'Access-Control-Allow-Origin', '*')
- setHeader(event, 'Content-Type', contentType)
- setHeader(event, 'Content-Length', parseInt(contentLength))
- setHeader(event, 'Cache-Control', cacheControl)
- return response.body
+ // 응답을 그대로 반환 (헤더/상태/스트림 자동 전달)
+ return upstream
```

필요하다면 **요청 헤더 일부만** 포워딩(예: `Range`)하고, 오류 시에는 **그대로 전달**하거나 **에러 메시지/코드만 래핑**하세요.

```ts
if (!upstream.ok) {
  // 그대로 전달 (원본 상태코드/본문 유지)
  return upstream

  // 또는, 프로젝트 포맷으로 변환 (권장: 상태코드는 유지)
  // throw createError({ statusCode: upstream.status, statusMessage: 'ProxyError' })
}
```

---

## 6) HLS/미디어 최적화 체크리스트

- [x] **Range**/조건부 헤더(`if-none-match`, `if-modified-since`) **포워딩**
- [x] 원본 **`Cache-Control` 존중** (별도 강제 필요 시 `routeRules.headers` 사용)
- [x] 대역폭 절감 필요 시 CDN(Cloudflare 등)과 병행

---

## 7) 보안/운영 팁

- **허용 도메인 화이트리스트**: 필요 시 `path`를 검사해 내부망/민감 경로로의 오픈 프록시 남용 방지.
- **메서드 제한**: 읽기 전용이면 `GET, HEAD`만 허용.
- **로그/관찰**: 5xx/타임아웃 메트릭, HLS 오류율 모니터링.
- **타임아웃/재시도**: 업스트림 불안정 시 서버 자원 낭비 방지.

---

## 8) 테스트 스크립트

```bash
# 1) 정상 리소스
curl -i http://localhost:3000/proxy/health.json

# 2) HLS 매니페스트
curl -I http://localhost:3000/proxy/stream/master.m3u8

# 3) 세그먼트 Range
curl -i http://localhost:3000/proxy/stream/seg-0001.ts -H 'Range: bytes=0-'
```

---

## 9) 권장 적용 순서 (커밋 체크리스트)

1. `nuxt.config.ts`에 `routeRules.proxy` 추가 및 경로 합의 (`/proxy/**`).
2. 기존 `server/api/proxy/[...path].ts` **삭제** 또는 **간소화(above code)**.
3. 프론트 호출 경로를 `/proxy/*`로 통일.
4. (필요 시) 외부 오리진 호출용 CORS 헤더 설정.
5. HLS/Range 시나리오 E2E 테스트.

---

## 부록: 최소 라우트 버전 (유지 필요 시)

```ts
// server/api/proxy/[...path].ts
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') ?? ''
  const req = getRequestHeaders(event)
  const forward: Record<string, string> = {}

  for (const h of ['range', 'if-none-match', 'if-modified-since', 'accept', 'user-agent', 'referer']) {
    if (req[h]) forward[h] = req[h] as string
  }

  const upstream = await fetch(`https://pikitalk.com/data/${path}`, { headers: forward })
  return upstream
})
```

---

## 결론

- **프록시만 필요**하면 `routeRules.proxy`로 끝.
- **조작이 필요**하면 라우트 유지 + **Response 그대로 반환**.
- CORS는 **외부에서 이 프록시를 호출**해야 할 때만 정확 오리진과 함께 설정.
