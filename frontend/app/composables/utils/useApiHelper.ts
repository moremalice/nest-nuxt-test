// composables/utils/apiHelpers.ts

// API 응답 타입 정의
export interface ApiSuccessResponse<T = any> {
  status: 'success'
  data: T
}

export interface ErrorData {
  name: string
  message: string
}

export interface ApiErrorResponse {
  status: 'error'
  data: ErrorData
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// Context 플래그 타입
export interface ApiContextFlags {
  skipTokenRefresh?: boolean
  skipCsrf?: boolean
  skipCsrfRetry?: boolean
}

// 에러 판별 유틸리티
export const isCsrfError = (err: any): boolean => {
  // Response data structure 확인
  if (err?.data?.status === 'error' && err?.data?.data) {
    const errorName = err.data.data.name?.toLowerCase() || ''
    const errorMessage = err.data.data.message?.toLowerCase() || ''
    return errorName.includes('csrf') || 
           errorMessage.includes('csrf') ||
           errorMessage.includes('forbidden') // CSRF 에러는 보통 403으로 오는 경우도 있음
  }
  
  // HTTP status code 확인 (403 Forbidden)
  if (err?.status === 403 || err?.response?.status === 403) {
    return true
  }
  
  // 네트워크 에러 등의 경우 메시지로만 판단
  const message = err?.message?.toLowerCase() || ''
  return message.includes('csrf') || message.includes('forbidden')
}

export const isAuthError = (err: any): boolean => {
  if (err?.status === 401) {
    return true
  }
  
  if (err?.data?.status === 'error' && err?.data?.data) {
    const errorName = err.data.data.name?.toLowerCase() || ''
    const errorMessage = err.data.data.message?.toLowerCase() || ''
    
    return (
      errorName.includes('unauthorized') ||
      errorName.includes('authentication') ||
      errorMessage.includes('token') ||
      errorMessage.includes('unauthorized')
    )
  }
  
  return false
}

// 에러 응답 정규화
export const normalizeError = <T>(err: any): ApiResponse<T> => {
  // 백엔드 표준 에러 응답이면 그대로 반환
  if (err?.data?.status === 'error' && err?.data?.data?.name && err?.data?.data?.message) {
    return err.data as ApiResponse<T>
  }
  
  // 그 외의 경우 표준 포맷으로 변환
  return {
    status: 'error',
    data: {
      name: 'RequestError',
      message: err?.message || 'Request failed'
    }
  }
}

// API 에러 핸들러 (로깅용)
export const handleApiError = (errorData: ErrorData) => {
  console.error('API Error:', {
    errorName: errorData.name,
    errorMessage: errorData.message
  })
}