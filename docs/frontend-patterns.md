# Frontend Architecture Patterns

## API Plugin & Automatic Loading System

### API Plugin Configuration (`app/plugins/api.ts`)

The frontend uses a centralized API plugin that automatically handles loading states, authentication, and CSRF protection:

```typescript
// app/plugins/api.ts
export default defineNuxtPlugin((nuxtApp) => {
  const api = $fetch.create({
    baseURL: useRuntimeConfig().public.NUXT_API_BASE_URL,
    credentials: 'include',
    timeout: 30000,

    // Automatic loading management
    onRequest: async ({ options }) => {
      const { showLoading } = useLoadingUI()
      showLoading() // Auto-show loading on every request

      // Auto-inject JWT token
      const authStore = useAuthStore()
      const { token } = storeToRefs(authStore)
      if (token.value) {
        headers.set('Authorization', `Bearer ${token.value}`)
      }

      // Auto-inject CSRF token for mutations (Auth Store based)
      const method = (options.method || 'GET').toUpperCase()
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const authStore = useAuthStore()
        const csrfToken = await authStore.getCsrfToken()
        if (csrfToken) {
          headers.set('X-CSRF-Token', csrfToken)
        }
      }
    },

    onResponse: () => {
      const { hideLoading } = useLoadingUI()
      hideLoading() // Auto-hide loading on success
    },

    onResponseError: async ({ response, options, error }) => {
      const { hideLoading } = useLoadingUI()
      hideLoading() // Auto-hide loading on error

      // Auto-retry with token refresh on 401
      if (response?.status === 401) {
        const authStore = useAuthStore()
        const refreshSuccess = await authStore.refreshToken()
        
        if (refreshSuccess) {
          // Retry request with new token
          return await apiInstance(request, { 
            ...options, 
            context: { skipTokenRefresh: true } 
          })
        }
      }
    }
  })

  return { provide: { api } }
})
```

### Automatic Loading UI System

**Global Loading State (`app/composables/ui/useLoadingUI.ts`):**
```typescript
const isLoading = ref(false)

export const useLoadingUI = () => {
  const showLoading = () => { isLoading.value = true }
  const hideLoading = () => { isLoading.value = false }

  return {
    isLoading: readonly(isLoading),
    showLoading,
    hideLoading
  }
}
```

**Loading Component (`app/components/common/LoadingComponent.vue`):**
```vue
<template>
  <Teleport to="body">
    <Transition name="loading">
      <div v-if="isLoading" class="app-loading-overlay">
        <div class="app-loading-spinner">
          <div class="spinner-icon"></div>
          <div class="spinner-text">Loading...</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { isLoading } = useLoadingUI()
</script>
```

**Layout Integration:**
```vue
<!-- app/layouts/default.vue & app/layouts/policy.vue -->
<template>
  <div>
    <!-- Page content -->
    <NuxtPage />
    
    <!-- Auto-managed loading overlay -->
    <LoadingComponent />
  </div>
</template>
```

### API Usage Pattern

**No Manual Loading Management Required:**
```typescript
// app/composables/api/useApi.ts
export const useApi = async <T = any>(
  url: string,
  body?: object,
  options?: ApiContextFlags
): Promise<ApiResponse<T>> => {
  // Loading automatically shown by api plugin
  const { $api } = useNuxtApp()
  const response = await $api<ApiResponse<T>>(url, { 
    method: 'POST', 
    body, 
    context: options 
  })
  // Loading automatically hidden by api plugin
  return response
}

// GET requests
export const useApiGet = async <T = any>(
  url: string,
  query?: object
): Promise<ApiResponse<T>> => {
  // Same automatic loading management
  const { $api } = useNuxtApp()
  return await $api<ApiResponse<T>>(url, { method: 'GET', query })
}

// SSR-safe server requests
export const useServerApiGet = async <T = any>(url: string): Promise<ApiResponse<T>> => {
  if (!import.meta.server) {
    return { status: 'error', data: { name: 'EnvironmentError', message: 'Server-side only' } }
  }
  
  // Direct $fetch for server-side, no loading UI needed
  return await $fetch<ApiResponse<T>>(url, {
    baseURL: useRuntimeConfig().public.NUXT_API_BASE_URL,
    headers: { 'X-Server-Request': 'true', 'X-Request-Source': 'nuxt-ssr' },
    timeout: 15000
  })
}
```

**Usage in Components:**
```vue
<script setup lang="ts">
// No loading state management needed!
const handleSubmit = async () => {
  // Loading automatically shown
  const result = await useApi<ResponseType>('/api/submit', formData)
  // Loading automatically hidden
  
  if (result.status === 'success') {
    // Handle success
  }
}

const fetchData = async () => {
  // Loading automatically managed
  const result = await useApiGet<DataType>('/api/data', { page: 1 })
  // Process result
}
</script>
```

## API Response Type System

### Consistent Data Format

The frontend uses a unified type system to handle all API responses:

```typescript
// app/composables/utils/apiHelpers.ts

// Success response type
export interface ApiSuccessResponse<T = any> {
  status: 'success'
  data: T
}

// Error response type  
export interface ApiErrorResponse {
  status: 'error'
  data: {
    name: string    // Error type
    message: string // Error message
  }
}

// Unified response type
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse
```

### API Context Flags

Control API behavior with context flags:

```typescript
export interface ApiContextFlags {
  skipTokenRefresh?: boolean  // Prevent infinite refresh loops
  skipCsrf?: boolean         // Skip CSRF token injection
  skipCsrfRetry?: boolean    // Skip CSRF error retry
}
```

### Error Detection Utilities

Smart error detection for automatic handling:

```typescript
// CSRF error detection
export const isCsrfError = (err: any): boolean => {
  if (err?.data?.status === 'error' && err?.data?.data) {
    const errorName = err.data.data.name?.toLowerCase() || ''
    const errorMessage = err.data.data.message?.toLowerCase() || ''
    return errorName.includes('csrf') || errorMessage.includes('csrf')
  }
  
  const message = err?.message?.toLowerCase() || ''
  return message.includes('csrf')
}

// Authentication error detection  
export const isAuthError = (err: any): boolean => {
  if (err?.status === 401) return true
  
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
```

### Error Normalization

Normalize various error formats into consistent structure:

```typescript
export const normalizeError = <T>(err: any): ApiResponse<T> => {
  // Backend standard error response - return as-is
  if (err?.data?.status === 'error' && err?.data?.data?.name && err?.data?.data?.message) {
    return err.data as ApiResponse<T>
  }
  
  // Convert other errors to standard format
  return {
    status: 'error',
    data: {
      name: 'RequestError',
      message: err?.message || 'Request failed'
    }
  }
}
```

### Type-Safe API Usage

Use typed API functions with automatic error handling:

```typescript
// In Vue components
<script setup lang="ts">
interface UserData {
  name: string
  email: string
}

const fetchUser = async (userId: number) => {
  const result = await useApiGet<UserData>(`/users/${userId}`)
  
  if (result.status === 'success') {
    // TypeScript knows result.data is UserData
    console.log('User name:', result.data.name)
  } else {
    // TypeScript knows result.data has { name, message }
    console.error('Error:', result.data.message)
  }
}
</script>
```

## Component Structure Template

All components follow the `Component` suffix naming convention:

```
app/components/
├── auth/
│   ├── LoginFormComponent.vue
│   └── RegisterFormComponent.vue
├── common/
│   ├── LoadingComponent.vue
│   └── ModalComponent.vue
└── domain-specific/
    └── FeatureComponent.vue
```

## Vue 3 Component Pattern

```vue
<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold">{{ title }}</h1>
    <button 
      @click="handleClick"
      @keydown="handleKeyDown"
      tabindex="0"
      aria-label="Action button"
      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
    >
      {{ buttonText }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  buttonText?: string;
}

interface Emits {
  action: [value: string];
}

const props = withDefaults(defineProps<Props>(), {
  buttonText: 'Click me'
});

const emit = defineEmits<Emits>();

const handleClick = (): void => {
  emit('action', 'clicked');
};

const handleKeyDown = (event: KeyboardEvent): void => {
  if (event.key === 'Enter' || event.key === ' ') {
    handleClick();
  }
};
</script>
```

## Composables Pattern

### API Composable (`app/composables/api/useApi.ts`)
```typescript
// Standard API response types
interface ApiSuccessResponse<T> { status: 'success'; data: T; }
interface ApiErrorResponse { status: 'error'; data: { name: string; message: string; }; }

// Usage examples:
const result = await useApi<ResponseType>('/endpoint', body);          // POST
const result = await useApiGet<ResponseType>('/endpoint', params);     // GET
const result = await useServerApiGet<ResponseType>('/endpoint');       // SSR GET
```

### UI State Composable Pattern
```typescript
// app/composables/ui/useFeatureUI.ts
const state = ref(initialValue);

export const useFeatureUI = () => ({
  state: readonly(state),
  setState: (value: StateType) => { state.value = value },
  resetState: () => { state.value = initialValue }
});
```

### CSRF Management System (Auth Store Based)

**Unified Security Architecture:**
```typescript
// Auth Store manages both authentication and CSRF for security consistency
const authStore = useAuthStore()

// CSRF operations are now part of the unified security system:
authStore.getCsrfToken()        // Get current CSRF token
authStore.refreshCsrfToken()    // Force refresh CSRF token
authStore.clearCsrfToken()      // Clear CSRF token
authStore.isCSrfTokenValid()    // Check token validity
```

**CSRF Composable Proxy (`app/composables/utils/useCsrf.ts`):**
```typescript
// Backward compatibility proxy that delegates to Auth Store
export const useCsrf = () => {
  const authStore = useAuthStore()
  
  return {
    csrfToken: authStore.csrfToken,           // Reactive readonly state
    isTokenLoading: authStore.isCsrfLoading,  // Loading state
    fetchCsrfToken: authStore.fetchCsrfToken, // Delegated to Auth Store
    getCsrfToken: authStore.getCsrfToken,     // Delegated to Auth Store
    refreshCsrfToken: authStore.refreshCsrfToken, // Delegated to Auth Store
    isTokenValid: authStore.isCSrfTokenValid, // Delegated to Auth Store
    clearCsrfToken: authStore.clearCsrfToken, // Delegated to Auth Store
    clearRefreshTimer: () => {},              // No-op (handled by Auth Store)
  }
}
```

**Enhanced Security Features:**
- **SSR Hydration Attack Prevention**: Eliminates `useState` vulnerability by using Pinia store
- **10-minute Token Lifecycle**: Enhanced security with shorter expiration (vs 25 minutes)
- **Memory Safety**: Pinia store lifecycle prevents memory leaks and cross-tab issues
- **Centralized Security**: Single source of truth for all authentication and CSRF logic
- **Auto-Retry**: Exponential backoff on token fetch failures (1s, 2s, 4s)

**Auth Store Based Plugin:**
```typescript
// app/plugins/csrf.client.ts - Auth Store integration
export default defineNuxtPlugin(() => {
  if (!import.meta.client) return
  
  onNuxtReady(() => {
    const authStore = useAuthStore()
    
    // Initial token fetch through Auth Store
    authStore.fetchCsrfToken().catch(() => {})
    
    // Enhanced event listeners with 5-minute visibility check
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnlineReconnect)
    window.addEventListener('beforeunload', cleanup)
  })
})
```

**Usage Patterns:**
```typescript
// 1. Automatic usage (recommended) - no manual calls needed
const result = await useApi('/protected-endpoint', data) // CSRF auto-injected via Auth Store

// 2. Direct Auth Store access (for advanced cases)
const authStore = useAuthStore()
const csrfToken = await authStore.getCsrfToken()

// 3. Legacy compatibility (maintains existing code)
const { csrfToken, isTokenValid, refreshCsrfToken } = useCsrf()
if (!isTokenValid()) {
  await refreshCsrfToken() // Proxied to Auth Store
}
```

## Store Pattern (Pinia)

```typescript
// app/stores/feature.ts
export const useFeatureStore = defineStore('feature', () => {
  const state = ref<FeatureState | null>(null);
  const isLoading = ref<boolean>(false);
  
  const isFeatureReady = computed(() => !!state.value);
  
  const fetchFeatureData = async (): Promise<void> => {
    isLoading.value = true;
    try {
      const result = await useApi<FeatureState>('/api/feature');
      if (result.status === 'success') {
        state.value = result.data;
      }
    } finally {
      isLoading.value = false;
    }
  };
  
  return {
    // State (readonly)
    state: readonly(state),
    isLoading: readonly(isLoading),
    
    // Getters
    isFeatureReady,
    
    // Actions
    fetchFeatureData
  };
});
```

## Internationalization Pattern

```typescript
// In components
const { t, locale } = useI18n();
const translatedText = computed(() => t('domain.MESSAGE_KEY'));

// Translation key convention:
// - domain.MESSAGE_KEY for general messages
// - domain.ERROR_KEY for error messages
// - domain.button.LABEL for UI labels
```