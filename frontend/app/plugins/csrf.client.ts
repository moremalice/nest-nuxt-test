// /frontend/app/plugins/csrf.client.ts
// Auth Store 기반 CSRF 관리로 보안 강화
export default defineNuxtPlugin(() => {
  // 클라이언트 환경에서만 실행
  if (!import.meta.client) return

  // 앱 초기화 완료 후 CSRF 관리 시작
  onNuxtReady(() => {
    const authStore = useAuthStore()
    
    // 초기 토큰 페치 (Auth store 초기화에 통합됨)
    authStore.fetchCsrfToken().catch(() => {})

    // 페이지 가시성 변경시 토큰 재검증
    let lastFetchTime = Date.now()
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const now = Date.now()
        // 5분 이상 지났거나 토큰이 유효하지 않으면 갱신 (보안 강화)
        if (now - lastFetchTime > 5 * 60 * 1000 || !authStore.isCSrfTokenValid()) {
          authStore.refreshCsrfToken().then(() => {
            lastFetchTime = now
          }).catch(() => {})
        }
      }
    })

    // 온라인 상태 복구시 토큰 확인
    window.addEventListener('online', () => {
      if (!authStore.isCSrfTokenValid()) {
        authStore.refreshCsrfToken().catch(() => {})
      }
    })

    // 앱 종료시 자동 정리 (Auth store에서 자동 관리)
    window.addEventListener('beforeunload', () => {
      authStore.clearCsrfToken()
    })
  })
})