// /frontend/middleware/auth.middleware.ts
// ===============================================
// 🔐 인증 미들웨어 (Authentication Middleware)
// ===============================================

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()
  const config = useRuntimeConfig()
  
  // 프로덕션이 아닌 환경에서만 상세 로깅 및 성능 측정
  const isDev = config.public.NUXT_APP_ENVIRONMENT !== 'production'
  const startTime = isDev ? performance.now() : 0

  // 클라이언트 사이드에서만 실행
  // SSR에서는 HttpOnly 쿠키에 접근할 수 없으므로 클라이언트에서만 인증 체크
  if (!import.meta.client) {
    return
  }

  // 현재 인증 상태 확인
  if (!authStore.isAuthenticated) {
    try {
      // 자동 인증 초기화 시도 (refresh token 사용)
      // HttpOnly 쿠키의 refresh token으로 새로운 access token 발급 시도
      await authStore.initializeAuth()
      
      // 인증 초기화 실패 시 로그인 페이지로 리다이렉트
      if (!authStore.isAuthenticated) {
        if (isDev) {
          console.log(`[AuthMiddleware] 인증 실패: ${to.fullPath} → /login`)
        }
        return navigateTo({
          path: '/login',
          query: { return_url: to.fullPath }, // 로그인 후 원래 페이지로 돌아가기 위해 URL 보존
          replace: true // 브라우저 히스토리에서 현재 페이지를 대체하여 뒤로가기 버튼 문제 방지
        })
      }
    } catch (error: unknown) {
      // 인증 과정에서 에러 발생 시 로그인 페이지로 리다이렉트
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (isDev) {
        console.warn('[AuthMiddleware] 인증 초기화 실패:', {
          error: errorMessage,
          route: to.fullPath
        })
      }
      
      // 에러가 네트워크 문제인 경우와 인증 문제인 경우를 구분
      const isNetworkError = errorMessage.includes('network') || errorMessage.includes('fetch')
      
      return navigateTo({
        path: '/login',
        query: { 
          return_url: to.fullPath,
          error: isNetworkError ? 'network' : 'auth'
        },
        replace: true
      })
    }
  }

  // 인증 성공 - 요청한 페이지로 계속 진행
  if (isDev) {
    const endTime = performance.now()
    const executionTime = endTime - startTime
    console.log(`[AuthMiddleware] 인증 성공: ${to.fullPath} (${executionTime.toFixed(2)}ms)`)
  }
})