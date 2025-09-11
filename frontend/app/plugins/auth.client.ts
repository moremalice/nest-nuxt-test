// /frontend/app/plugins/auth.client.ts
import { defineNuxtPlugin } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
  // 클라이언트에서만 실행
  if (!import.meta.client) {
    return
  }

  const authStore = useAuthStore()
  
  // 최소한의 초기화: CSRF 토큰만 준비하고 JWT는 필요 시에만 갱신
  // 앱 시작 시 불필요한 refresh token 요청 방지
  try {
    // 기존 토큰이 있고 유효한 경우에만 초기화 수행
    if (authStore.token && !authStore.isAuthenticated) {
      await authStore.initializeAuth()
    } else {
      // 토큰이 없는 경우 CSRF만 초기화 (401 에러 방지)
      await authStore.getCsrfToken()
    }
  } catch (error) {
    // 초기화 실패 시 조용히 처리 (사용자에게 영향 없음)
    console.debug('Auth initialization skipped:', error)
  }
})
