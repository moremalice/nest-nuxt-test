// /frontend/app/plugins/csrf.client.ts
export default defineNuxtPlugin(() => {
  // 클라이언트 환경에서만 실행
  if (!import.meta.client) return

  // 앱 초기화 완료 후 CSRF 관리 시작
  onNuxtReady(() => {
    const { fetchCsrfToken, isTokenValid, refreshCsrfToken } = useCsrf()
    
    // 초기 토큰 페치
    fetchCsrfToken().catch(() => {})

    // 페이지 가시성 변경시 토큰 재검증
    let lastFetchTime = Date.now()
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const now = Date.now()
        // 10분 이상 지났거나 토큰이 유효하지 않으면 갱신
        if (now - lastFetchTime > 10 * 60 * 1000 || !isTokenValid()) {
          refreshCsrfToken().then(() => {
            lastFetchTime = now
          }).catch(() => {})
        }
      }
    })

    // 온라인 상태 복구시 토큰 확인
    window.addEventListener('online', () => {
      if (!isTokenValid()) {
        refreshCsrfToken().catch(() => {})
      }
    })

    // 앱 종료시 타이머 정리
    window.addEventListener('beforeunload', () => {
      const { clearRefreshTimer } = useCsrf()
      clearRefreshTimer()
    })
  })
})