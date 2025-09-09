# Nuxt 4 Migration Plan

## 📊 현재 프로젝트 분석 (Current Project Analysis)

### 프로젝트 개요
- **프레임워크**: Nuxt 3.17.7 (CSR 모드)
- **Vue 버전**: 3.5.17
- **타입스크립트**: 완전 지원
- **렌더링 전략**: CSR 기본, SEO 필요 시 선택적 SSR
- **상태 관리**: Pinia 0.11.1
- **다국어**: @nuxtjs/i18n (15개 언어 지원)

### 핵심 아키텍처 분석

#### 1. 의존성 구조 (Dependencies)
```json
{
  "nuxt": "^3.17.7",
  "@pinia/nuxt": "^0.11.1",
  "@nuxtjs/i18n": "^9.5.6",
  "@nuxtjs/axios": "^5.13.6",
  "@vueuse/core": "^13.5.0",
  "swiper": "^11.2.10",
  "nuxt-aos": "^1.2.5",
  "nuxt-simple-sitemap": "^4.4.1"
}
```

#### 2. 보안 아키텍처
- **JWT Access Token**: Bearer 인증 (15분 만료)
- **HttpOnly Refresh Token**: 쿠키 기반 (12시간 만료)
- **CSRF Protection**: Double-submit cookie 패턴
- **자동 토큰 갱신**: 401 에러 시 자동 재시도
- **Cross-tab 세션 동기화**: 브라우저 탭 간 인증 상태 동기화

#### 3. API 통신 시스템
- **Custom API Plugin**: `/plugins/api.ts`
  - 자동 JWT 토큰 주입
  - CSRF 토큰 관리
  - 로딩 상태 처리
  - 에러 재시도 로직
- **Composables**: `useApi()`, `useApiGet()`, `useServerApiGet()`
- **Response Format**: `{status: 'success'|'error', data: T}`

#### 4. 폴더 구조
```
frontend/
├── components/          # 컴포넌트 (Component suffix)
│   ├── auth/           # 인증 관련
│   ├── common/         # 공통 컴포넌트
│   └── community/      # 커뮤니티 기능
├── composables/        # 컴포저블
│   ├── api/           # API 관련
│   ├── ui/            # UI 상태 관리
│   └── utils/         # 유틸리티
├── middleware/         # 미들웨어 (auth.middleware.ts)
├── stores/            # Pinia 스토어 (auth.ts)
├── plugins/           # 플러그인 (api.ts, auth.client.ts)
└── layouts/           # 레이아웃 (default.vue, policy.vue)
```

---

## 🔄 Nuxt 4 주요 변경사항 (Major Changes in Nuxt 4)

### 1. Core Dependencies Updates
- **Vue**: 3.5+ → 4.x (향후)
- **Nitro**: 2.10+ (성능 최적화)
- **Vite**: 최신 버전 지원
- **TypeScript**: 더 강화된 타입 추론

### 2. Breaking Changes 예상 사항

#### Module System Changes
- 일부 모듈의 API 변경 가능성
- 플러그인 시스템 업데이트
- 컴포저블 auto-import 개선

#### Configuration Changes
- `nuxt.config.ts` 설정 구조 변경 가능성
- 새로운 실험적 기능들
- 빌드 시스템 최적화

#### TypeScript Integration
- 더 강력한 타입 추론
- 컴포넌트 props 타입 체크 강화
- 컴포저블 타입 안정성 향상

---

## 📋 마이그레이션 전략 (Migration Strategy)

### Phase 1: 준비 단계 (Preparation Phase)
1. **백업 및 브랜치 생성**
   ```bash
   git checkout -b nuxt4-migration
   git push -u origin nuxt4-migration
   ```

2. **의존성 호환성 체크**
   - 각 패키지의 Nuxt 4 호환성 확인
   - 대체 패키지 조사 및 준비
   - 커스텀 플러그인 호환성 검토

3. **테스트 환경 구축**
   - 현재 기능 테스트 케이스 작성
   - E2E 테스트 스크립트 준비
   - 성능 벤치마크 기준 설정

### Phase 2: 핵심 업그레이드 (Core Upgrade)
1. **Nuxt 4 설치**
   ```bash
   npm install nuxt@^4.0.0
   ```

2. **설정 파일 업데이트**
   - `nuxt.config.ts` 설정 검토 및 수정
   - 실험적 기능 활성화 검토
   - 성능 최적화 설정 적용

3. **타입스크립트 설정 업데이트**
   - `.nuxt/tsconfig.json` 변경사항 반영
   - 새로운 타입 정의 적용

### Phase 3: 모듈 및 플러그인 업데이트 (Module Updates)
1. **i18n 모듈 업데이트**
   ```bash
   npm install @nuxtjs/i18n@latest
   ```
   - 설정 구조 변경사항 적용
   - 번역 파일 호환성 확인

2. **Pinia 업데이트**
   ```bash
   npm install @pinia/nuxt@latest pinia@latest
   ```
   - 새로운 Pinia 기능 활용 검토

3. **기타 모듈 업데이트**
   - `nuxt-simple-sitemap` 호환성 확인
   - `nuxt-aos` 대안 검토 (필요 시)
   - Swiper 통합 확인

### Phase 4: 코드 수정 및 최적화 (Code Optimization)
1. **플러그인 시스템 업데이트**
   - `plugins/api.ts` Nuxt 4 호환성 확인
   - 새로운 플러그인 API 활용

2. **컴포저블 최적화**
   - 자동 임포트 시스템 개선사항 활용
   - 타입 안정성 강화

3. **컴포넌트 업데이트**
   - Vue 3.5+ 새로운 기능 활용
   - 성능 최적화 적용

### Phase 5: 테스트 및 검증 (Testing & Validation)
1. **기능 테스트**
   - 인증 시스템 동작 확인
   - API 통신 정상 동작 확인
   - CSRF 보안 시스템 검증

2. **성능 테스트**
   - 빌드 시간 비교
   - 런타임 성능 측정
   - 번들 크기 최적화 확인

3. **호환성 테스트**
   - 브라우저 호환성 확인
   - 모바일 환경 테스트
   - 다국어 기능 검증

---

## ⚠️ 위험 요소 및 대응 방안 (Risk Factors & Mitigation)

### 1. 높은 위험도 (High Risk)

#### API 플러그인 호환성 문제
- **위험**: `plugins/api.ts`의 핵심 기능 손상
- **대응**: 
  - 플러그인 코드 단계적 리팩토링
  - 테스트 케이스 우선 작성
  - 백업 플랜으로 Nuxt 3 롤백 준비

#### 모듈 호환성 이슈
- **위험**: `@nuxtjs/i18n`, `nuxt-simple-sitemap` 등 비호환
- **대응**:
  - 각 모듈별 마이그레이션 가이드 확인
  - 대체 솔루션 미리 준비
  - 단계적 모듈 업데이트

### 2. 중간 위험도 (Medium Risk)

#### TypeScript 타입 에러
- **위험**: 새로운 타입 시스템으로 인한 빌드 실패
- **대응**:
  - 점진적 타입 수정
  - `any` 타입 임시 사용 후 순차적 개선

#### 성능 회귀 이슈
- **위험**: 마이그레이션 후 성능 저하
- **대응**:
  - 마이그레이션 전후 성능 벤치마크 측정
  - 성능 최적화 설정 적용

### 3. 낮은 위험도 (Low Risk)

#### CSS 및 스타일링 이슈
- **위험**: 스타일 관련 마이너 변경
- **대응**: 시각적 회귀 테스트 수행

---

## ✅ 마이그레이션 체크리스트 (Migration Checklist)

### 준비 단계
- [ ] 현재 프로젝트 완전 백업
- [ ] `nuxt4-migration` 브랜치 생성
- [ ] 모든 의존성 호환성 조사 완료
- [ ] 테스트 시나리오 문서 작성

### 업그레이드 단계
- [ ] Nuxt 4 설치 및 기본 실행 확인
- [ ] `nuxt.config.ts` 설정 업데이트
- [ ] TypeScript 설정 업데이트
- [ ] 기본 빌드 성공 확인

### 모듈 업데이트 단계
- [ ] `@nuxtjs/i18n` 업데이트 및 설정 적용
- [ ] `@pinia/nuxt` 업데이트
- [ ] `nuxt-simple-sitemap` 호환성 확인
- [ ] 기타 모듈들 순차적 업데이트

### 코드 수정 단계
- [ ] `plugins/api.ts` 호환성 확인 및 수정
- [ ] 인증 스토어 (`stores/auth.ts`) 동작 확인
- [ ] CSRF 관리 시스템 (`composables/utils/useCsrf.ts`) 검증
- [ ] 미들웨어 (`middleware/auth.middleware.ts`) 동작 확인
- [ ] 모든 컴포저블 동작 검증

### 기능 테스트 단계
- [ ] 사용자 로그인/로그아웃 기능
- [ ] JWT 토큰 자동 갱신 기능
- [ ] CSRF 보안 시스템
- [ ] API 통신 및 에러 핸들링
- [ ] 다국어 전환 기능
- [ ] 페이지 라우팅 및 미들웨어

### 성능 검증 단계
- [ ] 빌드 시간 측정 및 비교
- [ ] 초기 로딩 시간 측정
- [ ] 런타임 성능 측정
- [ ] 번들 크기 분석
- [ ] 메모리 사용량 확인

### 배포 준비 단계
- [ ] Production 빌드 테스트
- [ ] 환경 변수 설정 확인
- [ ] SSL/보안 설정 검증
- [ ] 백엔드 호환성 최종 확인

---

## 🚀 추가 최적화 기회 (Additional Optimization Opportunities)

### 1. Nuxt 4 신기능 활용
- **Enhanced Auto-imports**: 더 스마트한 자동 임포트
- **Improved TypeScript**: 강화된 타입 추론
- **Better Performance**: 최적화된 빌드 및 런타임

### 2. 코드 현대화
- **Composition API 활용 확대**: 더 나은 타입 지원
- **새로운 Vue 3.5 기능**: 성능 향상된 반응형 시스템
- **Tree-shaking 최적화**: 불필요한 코드 제거

### 3. 개발자 경험 향상
- **Better DevTools**: 향상된 개발 도구
- **Improved HMR**: 더 빠른 핫 리로딩
- **Enhanced Error Messages**: 더 명확한 에러 메시지

---

## 📅 예상 일정 (Estimated Timeline)

| 단계 | 예상 소요 시간 | 주요 작업 |
|------|---------------|-----------|
| 준비 단계 | 1-2일 | 백업, 조사, 계획 수립 |
| 핵심 업그레이드 | 2-3일 | Nuxt 4 설치 및 기본 설정 |
| 모듈 업데이트 | 3-5일 | 각종 모듈 호환성 작업 |
| 코드 수정 | 5-7일 | 플러그인, 컴포저블 수정 |
| 테스트 및 검증 | 3-5일 | 전체 기능 테스트 |
| **총 예상 시간** | **14-22일** | **단계별 병렬 작업 시 단축 가능** |

---

## 🔗 참고 자료 (References)

### 공식 문서
- [Nuxt 4 Release Notes](https://nuxt.com/blog/v4)
- [Nuxt 4 Migration Guide](https://nuxt.com/docs/getting-started/upgrade)
- [Vue 3.5 Release Notes](https://github.com/vuejs/core/releases)

### 커뮤니티 자료
- [Nuxt 4 Breaking Changes Discussion](https://github.com/nuxt/nuxt/discussions)
- [Community Migration Experiences](https://nuxt.com/blog)

### 모듈별 마이그레이션 가이드
- [@nuxtjs/i18n v9 → v10+ Migration](https://i18n.nuxtjs.org/docs/guide/migration)
- [Pinia Migration Guide](https://pinia.vuejs.org/introduction.html)

---

## 📞 마이그레이션 지원 (Migration Support)

이 문서는 현재 프로젝트 구조를 기반으로 작성된 맞춤형 마이그레이션 계획입니다. 실제 마이그레이션 진행 시:

1. **단계별 진행**: 한 번에 모든 것을 변경하지 말고 단계적으로 접근
2. **테스트 우선**: 각 단계에서 철저한 테스트 수행
3. **백업 유지**: 언제든 롤백할 수 있도록 백업 브랜치 유지
4. **문서화**: 변경사항과 이슈를 지속적으로 문서화

성공적인 Nuxt 4 마이그레이션을 위해 이 계획을 참고하여 단계적으로 진행하시기 바랍니다.