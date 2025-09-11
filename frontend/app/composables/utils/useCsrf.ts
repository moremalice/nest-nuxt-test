// composables/utils/useCsrf.ts
// 새로운 Auth Store 기반 CSRF 관리 (보안 강화)

export const fetchCsrfToken = async (currentRetry: number = 0): Promise<string | null> => {
    const authStore = useAuthStore()
    return await authStore.fetchCsrfToken(currentRetry)
}

export const getCsrfToken = async (): Promise<string | null> => {
    const authStore = useAuthStore()
    return await authStore.getCsrfToken()
}

export const clearCsrfToken = (): void => {
    const authStore = useAuthStore()
    authStore.clearCsrfToken()
}

export const isTokenValid = (): boolean => {
    const authStore = useAuthStore()
    return authStore.isCSrfTokenValid()
}

export const refreshCsrfToken = async (): Promise<string | null> => {
    const authStore = useAuthStore()
    return await authStore.refreshCsrfToken()
}

export const waitForTokenLoading = async (): Promise<void> => {
    const authStore = useAuthStore()
    return await authStore.waitForCsrfTokenLoading()
}

// 하위 호환성을 위한 별칭
export const clearRefreshTimer = (): void => {
    // Auth store에서 자동으로 관리되므로 빈 함수
}

export const cleanupCsrfManagement = (): void => {
    clearCsrfToken()
}

export const useCsrf = () => {
    const authStore = useAuthStore()
    
    return {
        csrfToken: authStore.csrfToken,
        isTokenLoading: authStore.isCsrfLoading,
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
