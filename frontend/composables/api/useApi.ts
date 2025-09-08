// composables/api/useApi.ts
import type { ApiResponse, ApiContextFlags } from '../utils/apiHelpers'
import { normalizeError } from '../utils/apiHelpers'
import type { ExtendedApi } from '~/plugins/api'

export const useApi = async <T = any>(
  url: string,
  body?: object,
  options?: ApiContextFlags
): Promise<ApiResponse<T>> => {
  try {
    const { $api } = useNuxtApp()
    const apiInstance = $api as ExtendedApi
    
    const response = await apiInstance<ApiResponse<T>>(url, {
      method: 'POST',
      body,
      context: options
    })
    
    return response
  } catch (err: any) {
    return normalizeError<T>(err)
  }
}

// GET request (client-side)
export const useApiGet = async <T = any>(
  url: string,
  query?: object,
  options?: ApiContextFlags
): Promise<ApiResponse<T>> => {
  try {
    const { $api } = useNuxtApp()
    const apiInstance = $api as ExtendedApi
    
    const response = await apiInstance<ApiResponse<T>>(url, {
      method: 'GET',
      query,
      context: options
    })
    
    return response
  } catch (err: any) {
    return normalizeError<T>(err)
  }
}

// Server-side GET (SSR only)
export const useServerApiGet = async <T = any>(url: string): Promise<ApiResponse<T>> => {
  if (!import.meta.server) {
    return {
      status: 'error',
      data: {
        name: 'EnvironmentError',
        message: 'Server-side only function called on client'
      }
    }
  }

  try {
    const response = await $fetch<ApiResponse<T>>(url, {
      method: 'GET',
      baseURL: useRuntimeConfig().public.NUXT_API_BASE_URL,
      headers: {
        'X-Server-Request': 'true',
        'X-Request-Source': 'nuxt-ssr'
      },
      timeout: 15000
    })

    return response
  } catch (err: any) {
    console.error('[useServerApiGet] Server API failed:', {
      url,
      error: err.message || err,
    })

    return normalizeError<T>(err)
  }
}

// HTTP method aliases for backward compatibility
export const useApiPost = useApi
export const useApiPut = useApi
export const useApiDelete = useApi