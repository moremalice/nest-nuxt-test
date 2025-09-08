// /frontend/plugins/auth.client.ts
import { defineNuxtPlugin } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
  // 클라이언트에서만 실행
  if (!import.meta.client) {
    return
  }

  const authStore = useAuthStore()
  
  // 스마트 토큰 갱신: initializeAuth를 호출하여 필요한 경우에만 갱신
  // 토큰이 유효하면 갱신하지 않아 서버 부하 감소
  try {
    await authStore.initializeAuth()
    // initializeAuth가 내부적으로 토큰 만료를 체크하고 필요시만 갱신
  } catch (error) {
    // 초기화 실패 시 조용히 처리
    console.warn('Auth initialization failed:', error)
  }
})
