# Nuxt 4 Directory Structure Migration Plan

## 현재 프로젝트 구조 분석

### 📂 현재 구조 (Nuxt 3 스타일)
```
frontend/
├── .env.development
├── .env.local
├── .env.production
├── .gitignore
├── app.vue                    # → app/app.vue
├── components/                # → app/components/
│   ├── auth/
│   ├── common/
│   │   └── swiper/
│   └── community/
├── composables/               # → app/composables/
│   ├── api/
│   ├── ui/
│   └── utils/
├── i18n/                     # → 특수 처리 필요
│   └── locales/
├── layouts/                   # → app/layouts/
├── middleware/                # → app/middleware/
├── pages/                     # → app/pages/
│   ├── community/
│   │   ├── faq/
│   │   └── notice/
│   └── policy/
├── plugins/                   # → app/plugins/
├── public/                    # → 그대로 유지
├── server/                    # → 그대로 유지
├── stores/                    # → app/stores/ (특수 처리)
├── types/                     # → app/types/ 또는 shared/types/
├── nuxt.config.ts            # → 그대로 유지
├── package.json              # → 그대로 유지
├── README.md                 # → 그대로 유지
└── tsconfig.json             # → 그대로 유지
```

### 🎯 목표 구조 (Nuxt 4 스타일)
```
frontend/
├── app/                       # 🆕 새로운 앱 디렉토리
│   ├── components/            # Vue 컴포넌트
│   │   ├── auth/
│   │   ├── common/
│   │   │   └── swiper/
│   │   └── community/
│   ├── composables/           # Vue 컴포저블
│   │   ├── api/
│   │   ├── ui/
│   │   └── utils/
│   ├── layouts/               # 레이아웃 컴포넌트
│   ├── middleware/            # 라우트 미들웨어
│   ├── pages/                 # 페이지 컴포넌트
│   │   ├── community/
│   │   │   ├── faq/
│   │   │   └── notice/
│   │   └── policy/
│   ├── plugins/               # 플러그인
│   ├── stores/                # Pinia 스토어
│   ├── types/                 # 타입 정의
│   └── app.vue               # 루트 앱 컴포넌트
├── locales/                   # i18n 번역 파일 (루트 유지)
├── public/                    # 정적 자산
├── server/                    # 서버 사이드 코드
├── shared/                    # 🆕 공유 코드 (선택적)
├── .env.*                     # 환경 변수
├── nuxt.config.ts            # Nuxt 설정
├── package.json
├── README.md
└── tsconfig.json
```

## 🚀 단계별 마이그레이션 계획

### Phase 1: 준비 및 검증 (예상 시간: 30분)

#### Step 1.1: 백업 및 브랜치 생성
```bash
# 현재 상태 커밋
git add -A
git commit -m "Pre-migration snapshot"

# 마이그레이션 브랜치 생성 (이미 nuxt4-migration 브랜치에 있음)
git checkout -b nuxt4-directory-migration
```

#### Step 1.2: 현재 설정 검증
- [ ] 개발 서버 정상 동작 확인
- [ ] 빌드 프로세스 정상 동작 확인
- [ ] 주요 페이지 접근 테스트

### Phase 2: app/ 디렉토리 생성 및 기본 이동 (예상 시간: 45분)

#### Step 2.1: app 디렉토리 생성
```bash
cd frontend
mkdir app
```

#### Step 2.2: 핵심 디렉토리 이동
```bash
# 컴포넌트 관련
mv components app/
mv composables app/
mv layouts app/
mv middleware app/
mv pages app/
mv plugins app/

# 상태 관리 및 타입
mv stores app/
mv types app/

# 루트 Vue 파일
mv app.vue app/
```

#### Step 2.3: i18n 처리 (특수 케이스)
```bash
# i18n 디렉토리의 locales를 루트로 이동
mv i18n/locales ./locales
rmdir i18n
```

### Phase 3: 설정 업데이트 (예상 시간: 30분)

#### Step 3.1: nuxt.config.ts 업데이트
```typescript
export default defineNuxtConfig({
    // ... 기존 설정 유지
    
    i18n: {
        // langDir 경로 업데이트
        langDir: '../locales/',  // app/에서 상대 경로
        // ... 나머지 i18n 설정 유지
    }
})
```

#### Step 3.2: 환경별 설정 확인
- [ ] `.env.local` 경로 확인
- [ ] `.env.development` 경로 확인  
- [ ] `.env.production` 경로 확인

### Phase 4: 코드 업데이트 (예상 시간: 60분)

#### Step 4.1: 레이아웃 업데이트 (`app/layouts/*.vue`)
```vue
<!-- 기존: <Nuxt /> 또는 <NuxtChild /> -->
<!-- 새로운: <slot /> -->

<!-- app/layouts/default.vue -->
<template>
  <div>
    <!-- 기존 레이아웃 구조 유지 -->
    <slot />  <!-- <Nuxt /> 대신 <slot /> 사용 -->
    <LoadingComponent />
  </div>
</template>
```

#### Step 4.2: 페이지 메타데이터 업데이트 (필요한 경우)
대부분 페이지는 이미 Composition API 스타일이므로 변경 불필요할 것으로 예상.

#### Step 4.3: 자동 import 확인
- [ ] 컴포저블 자동 import 테스트
- [ ] 컴포넌트 자동 import 테스트
- [ ] 유틸리티 함수 자동 import 테스트

### Phase 5: 테스트 및 검증 (예상 시간: 90분)

#### Step 5.1: 개발 서버 테스트
```bash
npm run local
```
- [ ] 서버 정상 시작
- [ ] 메인 페이지 로딩
- [ ] 다국어 전환 기능
- [ ] 인증 시스템 동작
- [ ] API 호출 정상 동작

#### Step 5.2: 기능별 검증
- [ ] **컴포넌트 렌더링**: 모든 컴포넌트 정상 표시
- [ ] **라우팅**: 모든 페이지 접근 가능
- [ ] **레이아웃**: 기본 및 정책 레이아웃 정상 동작
- [ ] **미들웨어**: 인증 미들웨어 정상 동작
- [ ] **플러그인**: API 플러그인, auth 플러그인 동작
- [ ] **스토어**: Pinia 스토어 정상 동작
- [ ] **컴포저블**: useApi, useCsrf 등 정상 동작
- [ ] **i18n**: 15개 언어 전환 기능
- [ ] **CSRF**: CSRF 토큰 관리 정상 동작
- [ ] **JWT**: 토큰 자동 갱신 시스템

#### Step 5.3: 빌드 테스트
```bash
npm run build
npm run preview
```
- [ ] 빌드 성공
- [ ] 프로덕션 모드 정상 동작

### Phase 6: 최적화 및 정리 (예상 시간: 30분)

#### Step 6.1: shared/ 디렉토리 검토
필요 시 공통 타입이나 유틸리티를 shared/로 이동:
```bash
mkdir shared
# 필요시 공통 타입 이동
```

#### Step 6.2: tsconfig.json 경로 검토
타입스크립트 경로 매핑이 올바르게 동작하는지 확인

#### Step 6.3: IDE 설정 업데이트
- [ ] VSCode settings.json 경로 업데이트 (필요시)
- [ ] WebStorm 설정 검토 (필요시)

## 🔍 마이그레이션 특수 고려사항

### 1. i18n 설정 특수 처리
- `i18n/locales/` → `locales/` (루트로 이동)
- `nuxt.config.ts`에서 `langDir: 'locales/'` 설정 유지
- 15개 언어 파일 모두 정상 동작 확인 필수

### 2. Pinia 스토어 (`stores/`)
- `stores/` → `app/stores/` 이동
- 자동 import가 정상 동작하는지 확인
- `useAuthStore()` 등 스토어 접근 테스트 필요

### 3. API 플러그인 시스템
- `plugins/api.ts` → `app/plugins/api.ts` 이동
- 자동 JWT 토큰 주입 기능 테스트
- CSRF 토큰 관리 기능 테스트
- 자동 로딩 UI 시스템 동작 확인

### 4. 컴포저블 시스템
- `composables/` → `app/composables/` 이동
- `useApi()`, `useApiGet()`, `useCsrf()` 등 정상 동작 확인
- 자동 import 기능 검증

### 5. 타입 시스템
- `types/` → `app/types/` 이동
- TypeScript 타입 추론 정상 동작 확인
- API 응답 타입들 정상 import 확인

## 📋 마이그레이션 체크리스트

### 준비 단계
- [ ] 현재 상태 커밋 및 백업
- [ ] 마이그레이션 브랜치 생성
- [ ] 현재 기능 정상 동작 확인

### 실행 단계
- [ ] `app/` 디렉토리 생성
- [ ] 핵심 디렉토리들 `app/` 하위로 이동
- [ ] `i18n/locales` → `locales/` 이동
- [ ] `app.vue` → `app/app.vue` 이동

### 설정 업데이트
- [ ] `nuxt.config.ts` i18n langDir 경로 수정
- [ ] 레이아웃 파일들 `<slot />` 사용 확인

### 검증 단계
- [ ] 개발 서버 정상 시작
- [ ] 모든 페이지 접근 가능
- [ ] 인증 시스템 정상 동작
- [ ] 다국어 전환 기능 동작
- [ ] API 통신 정상 동작
- [ ] CSRF 보안 시스템 동작
- [ ] 빌드 프로세스 성공

### 최종 정리
- [ ] 불필요한 파일/폴더 정리
- [ ] 문서 업데이트
- [ ] 마이그레이션 결과 커밋

## ⚠️ 주의사항

### 1. 롤백 계획
마이그레이션 중 문제 발생 시:
```bash
# 이전 커밋으로 롤백
git reset --hard HEAD~1

# 또는 선택적 롤백
git checkout HEAD~1 -- frontend/
```

### 2. 점진적 마이그레이션
큰 문제 발생 시 하이브리드 구조로 일시적 운영 가능:
- 일부 디렉토리만 `app/` 하위로 이동
- 나머지는 루트에 유지하며 단계적 이전

### 3. 개발 서버 재시작
설정 변경 후 반드시 개발 서버 재시작:
```bash
# Ctrl+C로 서버 종료 후
npm run local
```

### 4. 캐시 정리
문제 발생 시 캐시 정리:
```bash
rm -rf .nuxt .output node_modules/.vite
npm install
```

## 📊 예상 완료 시간

| 단계 | 예상 시간 | 누적 시간 |
|------|----------|----------|
| 준비 및 검증 | 30분 | 30분 |
| 디렉토리 이동 | 45분 | 75분 |
| 설정 업데이트 | 30분 | 105분 |
| 코드 업데이트 | 60분 | 165분 |
| 테스트 및 검증 | 90분 | 255분 |
| 최적화 및 정리 | 30분 | 285분 |
| **총 예상 시간** | **약 4.5시간** | |

## 🎯 마이그레이션 성공 기준

### 필수 조건
1. ✅ 개발 서버 정상 시작
2. ✅ 모든 페이지 정상 접근
3. ✅ 인증 시스템 완전 동작
4. ✅ API 통신 시스템 정상 동작
5. ✅ 15개 언어 전환 기능 정상
6. ✅ 빌드 프로세스 성공

### 성능 기준
1. 🚀 개발 서버 시작 시간 유지 또는 개선
2. 🚀 빌드 시간 유지 또는 개선  
3. 🚀 핫 리로드 속도 유지 또는 개선

### 개발자 경험
1. 💡 자동 import 기능 완전 동작
2. 💡 TypeScript 타입 추론 정상
3. 💡 IDE IntelliSense 정상 동작

마이그레이션 완료 후 이 모든 기준이 충족되어야 성공으로 간주합니다.