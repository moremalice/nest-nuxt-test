// composables/utils/useCsrf.ts

interface CsrfTokenData {
    csrfToken: string;
}

interface ErrorData {
    name: string;
    message: string;
}

interface CsrfApiSuccessResponse {
    status: 'success';
    data: CsrfTokenData;
}

interface CsrfApiErrorResponse {
    status: 'error';
    data: ErrorData;
}

type CsrfApiResponse = CsrfApiSuccessResponse | CsrfApiErrorResponse;


const csrfToken = ref<string | null>(null)
const isTokenLoading = ref(false)
let refreshTimer: ReturnType<typeof setTimeout> | null = null
let isInitialized = false
let retryCount = 0
const MAX_RETRIES = 3

const clearRefreshTimer = () => {
    if (refreshTimer) {
        clearTimeout(refreshTimer)
        refreshTimer = null
    }
}

const waitForTokenLoading = async (): Promise<void> => {
    if (!isTokenLoading.value) return

    return new Promise(resolve => {
        const checkLoading = () => {
            if (!isTokenLoading.value) {
                resolve()
            } else {
                setTimeout(checkLoading, 50)
            }
        }
        checkLoading()
    })
}

export const fetchCsrfToken = async (currentRetry: number = 0): Promise<string | null> => {
    if (currentRetry >= MAX_RETRIES) {
        retryCount = 0; // 리셋
        return null;
    }

    if (isTokenLoading.value && currentRetry === 0) {
        await waitForTokenLoading()
        return csrfToken.value
    }

    isTokenLoading.value = true

    try {
        const response = await $fetch<CsrfApiResponse>('/csrf/token', {
            method: 'GET',
            baseURL: useRuntimeConfig().public.NUXT_API_BASE_URL,
            timeout: 10000,
            credentials: 'include'
        })

        if (response.status === 'success' && response.data?.csrfToken) {
            csrfToken.value = response.data.csrfToken
            retryCount = 0; // 성공 시 리셋

            clearRefreshTimer()

            refreshTimer = setTimeout(() => {
                clearCsrfToken()
                fetchCsrfToken()
            }, 25 * 60 * 1000)

            return response.data.csrfToken
        } else {
            throw new Error('Invalid response')
        }
    } catch (error: any) {
        if (currentRetry < MAX_RETRIES) {
            const delay = Math.pow(2, currentRetry) * 1000; // 지수 백오프: 1초, 2초, 4초
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(fetchCsrfToken(currentRetry + 1));
                }, delay);
            });
        }

        return null
    } finally {
        if (currentRetry === 0) {
            isTokenLoading.value = false
        }
    }
}

export const getCsrfToken = async (): Promise<string | null> => {
    // 이미 토큰이 있으면 바로 반환
    if (csrfToken.value) {
        return csrfToken.value
    }
    
    // 토큰 로딩 중이면 완료될 때까지 대기
    if (isTokenLoading.value) {
        await waitForTokenLoading()
        return csrfToken.value
    }
    
    // 토큰이 없고 로딩 중도 아니면 새로 가져오기
    await fetchCsrfToken()
    return csrfToken.value
}

export const clearCsrfToken = () => {
    csrfToken.value = null
    clearRefreshTimer()
}

export const isTokenValid = (): boolean => {
    return csrfToken.value !== null && csrfToken.value !== ''
}

export const refreshCsrfToken = async (): Promise<string | null> => {
    clearCsrfToken()
    return await fetchCsrfToken()
}

// 전역 CSRF 관리 초기화 함수
export const initializeCsrfManagement = () => {
    // 중복 초기화 방지
    if (isInitialized || !import.meta.client) return
    isInitialized = true

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
        clearRefreshTimer()
    })
}

// CSRF 관리 정리 함수 (필요시 사용)
export const cleanupCsrfManagement = () => {
    clearRefreshTimer()
    clearCsrfToken()
    isInitialized = false
}

export { waitForTokenLoading, csrfToken, isTokenLoading }

export const useCsrf = () => {
    return {
        csrfToken: readonly(csrfToken),
        isTokenLoading: readonly(isTokenLoading),
        fetchCsrfToken,
        getCsrfToken,
        waitForTokenLoading,
        clearCsrfToken,
        isTokenValid,
        refreshCsrfToken,
        clearRefreshTimer,
        initializeCsrfManagement,
        cleanupCsrfManagement
    }
}
