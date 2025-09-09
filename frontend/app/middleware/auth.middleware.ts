// /frontend/middleware/auth.middleware.ts
// ===============================================
// 🔐 인증 미들웨어 (Authentication Middleware)
// ===============================================
// 
// 📋 사용법:
// 페이지 컴포넌트에서 다음과 같이 사용하여 인증을 필수로 만들 수 있습니다:
// 
// definePageMeta({
//   middleware: 'auth-middleware' // 🔑 이 한 줄로 인증 필수 페이지로 설정!
// })
//
// 📝 동작 방식:
// 1. 인증되지 않은 사용자가 보호된 페이지 접근 시
// 2. 자동으로 토큰 갱신 시도 (refresh token 사용)
// 3. 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
// 4. 원래 요청한 페이지 URL을 return_url로 보존하여 로그인 후 원래 페이지로 복귀
//
// ✅ 인증이 필요한 페이지 예시:
// - /profile (사용자 프로필)
// - /dashboard (대시보드)
// - /admin/* (관리자 페이지)
//
// ❌ 인증이 필요없는 페이지 (미들웨어 지정 안 함):
// - /login (로그인 페이지)
// - / (홈페이지)  
// - /community/faq (FAQ)
// - /policy/terms (약관)
//

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

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
        console.log(`[AuthMiddleware] 인증 실패: ${to.fullPath} → /login`)
        return navigateTo({
          path: '/login',
          query: { return_url: to.fullPath } // 로그인 후 원래 페이지로 돌아가기 위해 URL 보존
        })
      }
    } catch (error) {
      // 인증 과정에서 에러 발생 시 로그인 페이지로 리다이렉트
      console.warn('[AuthMiddleware] 인증 초기화 실패:', error)
      return navigateTo({
        path: '/login',
        query: { return_url: to.fullPath }
      })
    }
  }

  // 인증 성공 - 요청한 페이지로 계속 진행
  console.log(`[AuthMiddleware] 인증 성공: ${authStore.currentUser?.email} → ${to.fullPath}`)
})