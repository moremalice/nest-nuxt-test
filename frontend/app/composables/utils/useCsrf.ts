// composables/utils/useCsrf.ts
import type { ApiResponse } from './useApiHelper'

interface CsrfTokenData {
    csrfToken: string;
}

type CsrfApiResponse = ApiResponse<CsrfTokenData>;


const MAX_RETRIES = 3

const clearRefreshTimer = (): void => {
    const timer = useState<ReturnType<typeof setTimeout> | null>('csrf-refresh-timer', () => null)
    if (timer.value) {
        clearTimeout(timer.value)
        timer.value = null
    }
}

const waitForTokenLoading = async (): Promise<void> => {
    const isTokenLoading = useState<boolean>('csrf-token-loading', () => false)
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
    const csrfToken = useState<string | null>('csrf-token', () => null)
    const isTokenLoading = useState<boolean>('csrf-token-loading', () => false)
    const retryCount = useState<number>('csrf-retry-count', () => 0)
    
    if (currentRetry >= MAX_RETRIES) {
        retryCount.value = 0 // 리셋
        return null
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
            retryCount.value = 0 // 성공 시 리셋

            clearRefreshTimer()

            const timer = useState<ReturnType<typeof setTimeout> | null>('csrf-refresh-timer', () => null)
            timer.value = setTimeout(() => {
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
    const csrfToken = useState<string | null>('csrf-token', () => null)
    const isTokenLoading = useState<boolean>('csrf-token-loading', () => false)
    
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
    const csrfToken = useState<string | null>('csrf-token', () => null)
    csrfToken.value = null
    clearRefreshTimer()
}

export const isTokenValid = (): boolean => {
    const csrfToken = useState<string | null>('csrf-token', () => null)
    return csrfToken.value !== null && csrfToken.value !== ''
}

export const refreshCsrfToken = async (): Promise<string | null> => {
    clearCsrfToken()
    return await fetchCsrfToken()
}

// CSRF 관리 정리 함수 (필요시 사용)
export const cleanupCsrfManagement = () => {
    clearRefreshTimer()
    clearCsrfToken()
}

export { waitForTokenLoading }

export const useCsrf = () => {
    const csrfToken = useState<string | null>('csrf-token', () => null)
    const isTokenLoading = useState<boolean>('csrf-token-loading', () => false)
    
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
        cleanupCsrfManagement
    }
}
