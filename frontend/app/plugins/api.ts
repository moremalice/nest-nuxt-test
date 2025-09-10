// /frontend/app/plugins/api.ts
import { storeToRefs } from 'pinia'
import type { $Fetch } from 'ofetch'
import { isCsrfError } from '~/composables/utils/useApiHelper'
import type { ApiContextFlags } from '~/composables/utils/useApiHelper'

// 확장된 $fetch 옵션 타입 (export로 다른 파일에서 사용 가능)
export interface ExtendedFetchOptions {
  context?: ApiContextFlags
  [key: string]: any
}

// 타입 확장된 $fetch 인터페이스 (export로 다른 파일에서 사용 가능)
export interface ExtendedApi extends $Fetch {
  <T = any, R extends any = T>(request: any, opts?: ExtendedFetchOptions): Promise<R>
}

export default defineNuxtPlugin((nuxtApp) => {
  // API 클라이언트 생성
  const api = $fetch.create({
    baseURL: useRuntimeConfig().public.NUXT_API_BASE_URL,
    credentials: 'include', // 쿠키 포함
    timeout: 30000, // 기본 타임아웃

    // 요청 전 처리 (헤더 주입, 로딩 시작)
    onRequest: async ({ options }) => {
      // 로딩 시작 (안전 호출)
      try {
        const { showLoading } = useLoadingUI()
        showLoading?.()
      } catch (error) {
        console.warn('Loading UI showLoading failed:', error)
      }

      // 헤더 객체를 Headers 인스턴스로 정확하게 처리
      let headers: Headers
      if (options.headers instanceof Headers) {
        headers = options.headers
      } else if (options.headers) {
        headers = new Headers(options.headers as HeadersInit)
      } else {
        headers = new Headers()
      }

      // JWT 토큰 주입
      const authStore = useAuthStore()
      const { token } = storeToRefs(authStore)
      if (token.value) {
        headers.set('Authorization', `Bearer ${token.value}`)
      }

      // CSRF 토큰 주입 (변경 메서드에만)
      const method = (options.method || 'GET').toUpperCase()
      const extendedOpts = options as ExtendedFetchOptions
      const skipCsrf = extendedOpts.context?.skipCsrf === true
      
      if (!skipCsrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        try {
          const { getCsrfToken } = useCsrf()
          const csrfToken = await getCsrfToken()
          
          if (csrfToken) {
            headers.set('X-CSRF-Token', csrfToken)
          }
        } catch (error) {
          console.error('Failed to get CSRF token:', error)
        }
      }

      // 최종 헤더 할당
      options.headers = headers
    },

    // 정상 응답 처리 (로딩 종료)
    onResponse: () => {
      try {
        const { hideLoading } = useLoadingUI()
        hideLoading?.()
      } catch (error) {
        console.warn('Loading UI hideLoading failed:', error)
      }
    },

    // 에러 응답 처리 (재시도 로직, 로딩 종료)
    onResponseError: async ({ request, response, options, error }) => {
      // 로딩 종료 (안전 호출)
      try {
        const { hideLoading } = useLoadingUI()
        hideLoading?.()
      } catch (error) {
        console.warn('Loading UI hideLoading failed:', error)
      }

      const extendedOpts = options as ExtendedFetchOptions
      const context = extendedOpts.context || {}

      // 401 에러: JWT 토큰 자동 리프레시
      if (response?.status === 401 && !context.skipTokenRefresh) {
        try {
          const authStore = useAuthStore()
          
          // Auth store가 초기화되었는지 확인
          if (!authStore) {
            console.warn('Auth store not available for token refresh')
            throw error
          }
          
          const refreshSuccess = await authStore.refreshToken()
          
          if (refreshSuccess) {
            // 토큰 갱신 성공 시 재시도
            const apiInstance = nuxtApp.$api as ExtendedApi
            return await apiInstance(request, {
              ...options,
              context: { ...context, skipTokenRefresh: true }
            })
          }
        } catch (refreshError) {
          console.error('Token refresh failed during 401 handling:', refreshError)
          // 원래 에러를 그대로 전파
        }
      }

      // CSRF 에러: 토큰 재발급 후 재시도
      const responseData = response?._data
      if (!context.skipCsrfRetry && isCsrfError(responseData)) {
        const { refreshCsrfToken } = useCsrf()
        await refreshCsrfToken()
        
        const apiInstance = nuxtApp.$api as ExtendedApi
        return await apiInstance(request, {
          ...options,
          context: { ...context, skipCsrfRetry: true }
        })
      }

      // 재시도 불가능한 에러는 그대로 전파
      throw error
    }
  }) as ExtendedApi

  // 전역 주입: useNuxtApp().$api로 사용
  return {
    provide: { api }
  }
})