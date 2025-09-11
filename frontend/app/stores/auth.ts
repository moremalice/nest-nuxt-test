// 사용자 정보 타입
interface User {
  idx: number
  email: string
  isActive: boolean
}

// API 요청 타입들
interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
}

// API 응답 타입들
interface AuthResponse {
  accessToken: string
  user: User
}

interface RefreshResponse {
  accessToken: string
  user: User
}

interface RegisterResponseData {
  idx: number
  email: string
}

interface CsrfTokenData {
  csrfToken: string
}

type CsrfApiResponse = ApiResponse<CsrfTokenData>

export const useAuthStore = defineStore('auth', () => {
  // 상태 관리
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  
  // CSRF 토큰 상태 관리 (보안 강화)
  const csrfToken = ref<string | null>(null)
  const isCsrfLoading = ref<boolean>(false)
  
  // 토큰 갱신 동시성 제어 (중복 요청 방지)
  let refreshTokenPromise: Promise<boolean> | null = null
  let refreshRetryCount = 0
  const MAX_REFRESH_RETRIES = 2
  let lastRefreshFailTime = 0
  const REFRESH_COOLDOWN = 30000 // 실패 후 30초 쿨다운
  
  // CSRF 토큰 관리
  const MAX_CSRF_RETRIES = 3
  let csrfRefreshTimer: ReturnType<typeof setTimeout> | null = null
  let csrfFetchPromise: Promise<string | null> | null = null

  // JWT 토큰 만료 체크 유틸리티
  const isTokenExpired = (token: string | null, bufferSeconds: number = 30): boolean => {
    if (!token) return true
    
    try {
      // JWT 페이로드 디코딩 (헤더.페이로드.시그니처에서 페이로드 추출)
      const parts = token.split('.')
      if (parts.length !== 3) return true
      
      const payload = JSON.parse(atob(parts[1] || ''))
      if (!payload.exp || typeof payload.exp !== 'number') return true
      
      // 만료 시간에 버퍼 적용 (기본 30초 전에 만료로 처리)
      const expirationTime = payload.exp * 1000 - (bufferSeconds * 1000)
      return Date.now() >= expirationTime
    } catch (error) {
      // 디코딩 실패 시 만료로 처리
      return true
    }
  }

  // 계산된 속성들
  const isAuthenticated = computed(() => !!user.value && !!accessToken.value && !isTokenExpired(accessToken.value))
  const currentUser = computed(() => user.value)
  const token = computed(() => accessToken.value)

  // 내부 헬퍼 메서드들
  const setAuth = (authData: AuthResponse) => {
    accessToken.value = authData.accessToken
    user.value = authData.user
  }

  const clearAuth = () => {
    accessToken.value = null
    user.value = null
    clearCsrfToken()
  }

  // CSRF 토큰 관리 메서드들
  const clearCsrfRefreshTimer = (): void => {
    if (csrfRefreshTimer) {
      clearTimeout(csrfRefreshTimer)
      csrfRefreshTimer = null
    }
  }

  const clearCsrfToken = (): void => {
    csrfToken.value = null
    clearCsrfRefreshTimer()
  }

  const waitForCsrfTokenLoading = async (): Promise<void> => {
    if (!isCsrfLoading.value) return

    return new Promise(resolve => {
      const checkLoading = () => {
        if (!isCsrfLoading.value) {
          resolve()
        } else {
          setTimeout(checkLoading, 50)
        }
      }
      checkLoading()
    })
  }

  const fetchCsrfToken = async (currentRetry: number = 0): Promise<string | null> => {
    if (currentRetry >= MAX_CSRF_RETRIES) {
      return null
    }

    if (isCsrfLoading.value && currentRetry === 0) {
      await waitForCsrfTokenLoading()
      return csrfToken.value
    }

    if (csrfFetchPromise && currentRetry === 0) {
      return await csrfFetchPromise
    }

    const fetchPromise = performCsrfFetch(currentRetry)
    if (currentRetry === 0) {
      csrfFetchPromise = fetchPromise
    }

    try {
      return await fetchPromise
    } finally {
      if (currentRetry === 0) {
        csrfFetchPromise = null
      }
    }
  }

  const performCsrfFetch = async (currentRetry: number): Promise<string | null> => {
    isCsrfLoading.value = true

    try {
      const response = await $fetch<CsrfApiResponse>('/csrf/token', {
        method: 'GET',
        baseURL: useRuntimeConfig().public.NUXT_API_BASE_URL,
        timeout: 10000,
        credentials: 'include'
      })

      if (response.status === 'success' && response.data?.csrfToken) {
        csrfToken.value = response.data.csrfToken

        clearCsrfRefreshTimer()

        csrfRefreshTimer = setTimeout(() => {
          clearCsrfToken()
          fetchCsrfToken()
        }, 10 * 60 * 1000) // 10분으로 단축 (보안 강화)

        return response.data.csrfToken
      } else {
        throw new Error('Invalid CSRF response')
      }
    } catch (error: any) {
      if (currentRetry < MAX_CSRF_RETRIES) {
        const delay = Math.pow(2, currentRetry) * 1000 // 지수 백오프

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(fetchCsrfToken(currentRetry + 1))
          }, delay)
        })
      }

      return null
    } finally {
      if (currentRetry === 0) {
        isCsrfLoading.value = false
      }
    }
  }

  const getCsrfToken = async (): Promise<string | null> => {
    if (csrfToken.value) {
      return csrfToken.value
    }

    if (isCsrfLoading.value) {
      await waitForCsrfTokenLoading()
      return csrfToken.value
    }

    await fetchCsrfToken()
    return csrfToken.value
  }

  const refreshCsrfToken = async (): Promise<string | null> => {
    clearCsrfToken()
    return await fetchCsrfToken()
  }

  const isCSrfTokenValid = (): boolean => {
    return csrfToken.value !== null && csrfToken.value !== ''
  }

  // 로그인
  const login = async (loginData: LoginData): Promise<boolean> => {
    try {
      const response = await useApi<AuthResponse>('/auth/login', loginData)

      if (response.status === 'success') {
        setAuth(response.data)
        return true
      }

      return false
    } catch (error) {
      return false
    }
  }

  // 회원가입
  const register = async (registerData: RegisterData): Promise<boolean> => {
    try {
      const response = await useApi<RegisterResponseData>('/auth/register', registerData)
      return response.status === 'success'
    } catch (error) {
      return false
    }
  }

  // 로그아웃
  const logout = async (): Promise<boolean> => {
    try {
      // 토큰이 있을 때만 서버에 로그아웃 요청
      if (accessToken.value) {
        await useApi<{}>('/auth/logout')
      }
    } catch (error) {
      // 서버 에러 무시 (클라이언트 정리는 계속 진행)
    } finally {
      // 항상 클라이언트 인증 정보 정리 (CSRF 토큰 포함)
      clearAuth()
    }
    
    return true
  }

  // 토큰 갱신 (동시성 제어 포함)
  const refreshToken = async (silent: boolean = false): Promise<boolean> => {
    // 이미 갱신 중인 경우 기존 Promise 반환 (중복 요청 방지)
    if (refreshTokenPromise) {
      return await refreshTokenPromise
    }

    // 새로운 갱신 Promise 생성
    refreshTokenPromise = performRefresh(silent)
    
    try {
      return await refreshTokenPromise
    } finally {
      // 완료 후 Promise 정리
      refreshTokenPromise = null
    }
  }

  // 지수 백오프 계산 (재시도 간격 조절)
  const getBackoffDelay = (attempt: number, base = 500, cap = 5000): number => {
    const exponential = Math.min(cap, base * Math.pow(2, attempt))
    const jitter = Math.random() * 200 // 랜덤 지터로 서버 부하 분산
    return exponential + jitter
  }

  // 실제 토큰 갱신 수행
  const performRefresh = async (silent: boolean = false): Promise<boolean> => {
    const now = Date.now()
    
    // 쿨다운 기간 체크
    if (now - lastRefreshFailTime < REFRESH_COOLDOWN) {
      return false
    }

    // 최대 재시도 횟수 초과 체크
    if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
      clearAuth()
      refreshRetryCount = 0
      lastRefreshFailTime = now
      return false
    }

    try {
      // 토큰 갱신 요청 (무한 루프 방지를 위해 skipTokenRefresh 설정)
      const response = await useApi<RefreshResponse>('/auth/refresh', {}, { 
        skipTokenRefresh: true 
      })

      if (response.status === 'success') {
        // 갱신 성공: 새 토큰과 사용자 정보 설정
        accessToken.value = response.data.accessToken
        user.value = response.data.user
        refreshRetryCount = 0 // 재시도 카운터 리셋
        return true
      }

      // 갱신 실패: 재시도 카운터 증가
      refreshRetryCount++
      if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
        clearAuth()
        lastRefreshFailTime = now
      }
      
      return false
    } catch (error) {
      // Silent 모드가 아닐 때만 에러 로깅
      if (!silent) {
        console.warn('Token refresh failed:', error)
      }
      
      refreshRetryCount++
      
      if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
        clearAuth()
        lastRefreshFailTime = now
      }
      
      return false
    }
  }

  // 사용자 프로필 가져오기
  const getProfile = async (): Promise<User | null> => {
    try {
      if (!accessToken.value) {
        return null
      }

      const response = await useApiGet<{ user: User }>('/auth/profile')

      if (response.status === 'success') {
        user.value = response.data.user
        return response.data.user
      }

      // 인증 에러인 경우 로그아웃 처리
      if (response.status === 'error') {
        const errorName = response.data.name.toLowerCase()
        if (errorName.includes('unauthorized') || errorName.includes('authentication')) {
          clearAuth()
        }
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  // 인증 초기화 (앱 시작 시 또는 미들웨어에서 호출)
  const initializeAuth = async (): Promise<void> => {
    if (!import.meta.client) return

    // CSRF 토큰을 먼저 준비 (새로운 통합 시스템 사용)
    try {
      await getCsrfToken()
    } catch (error) {
      console.warn('Failed to initialize CSRF token:', error)
    }

    // 액세스 토큰이 있고 만료 임박한 경우에만 갱신 시도
    // 토큰이 아예 없는 경우는 갱신 시도하지 않음 (401 에러 방지)
    if (accessToken.value && isTokenExpired(accessToken.value, 60)) {
      try {
        const refreshSuccess = await refreshToken(true) // silent 모드로 실행
        if (!refreshSuccess) {
          // 갱신 실패 시 인증 정보 정리 (조용히 처리)
          clearAuth()
        }
      } catch (error) {
        // 토큰 갱신 실패 시 인증 정보 정리 (조용히 처리)
        clearAuth()
      }
    }
    // 토큰이 없거나 아직 유효하면 갱신하지 않음 (불필요한 요청 방지)
  }

  return {
    user: readonly(user),
    accessToken: readonly(accessToken),
    csrfToken: readonly(csrfToken),
    isCsrfLoading: readonly(isCsrfLoading),

    isAuthenticated,
    currentUser,
    token,

    login,
    register,
    logout,
    refreshToken,
    getProfile,
    initializeAuth,
    clearAuth,

    getCsrfToken,
    refreshCsrfToken,
    clearCsrfToken,
    isCSrfTokenValid,
    waitForCsrfTokenLoading,
    fetchCsrfToken
  }
})