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

export const useAuthStore = defineStore('auth', () => {
  // 상태 관리
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  
  // 토큰 갱신 동시성 제어 (중복 요청 방지)
  let refreshTokenPromise: Promise<boolean> | null = null
  let refreshRetryCount = 0
  const MAX_REFRESH_RETRIES = 2
  let lastRefreshFailTime = 0
  const REFRESH_COOLDOWN = 30000 // 실패 후 30초 쿨다운

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
      // 항상 클라이언트 인증 정보 정리
      clearAuth()
      
      // CSRF 토큰도 정리
      const { clearCsrfToken } = useCsrf()
      clearCsrfToken()
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

    // CSRF 토큰을 먼저 준비
    try {
      const { getCsrfToken } = useCsrf()
      await getCsrfToken()
    } catch (error) {
      console.warn('Failed to initialize CSRF token:', error)
    }

    // 액세스 토큰이 만료되었거나 만료 임박한 경우에만 갱신
    // 60초 버퍼를 두어 만료 직전 토큰도 갱신
    if (isTokenExpired(accessToken.value, 60)) {
      try {
        await refreshToken()
      } catch (error) {
        // 토큰 갱신 실패 시 인증 정보 정리
        clearAuth()
      }
    }
    // 토큰이 아직 유효하면 갱신하지 않음 (서버 부하 감소)
  }

  return {
    user: readonly(user),
    accessToken: readonly(accessToken),

    isAuthenticated,
    currentUser,
    token,

    login,
    register,
    logout,
    refreshToken,
    getProfile,
    initializeAuth,
    clearAuth
  }
})