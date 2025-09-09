# API Communication Architecture

## Overview

This document explains the complete API communication flow between the Nuxt.js frontend and NestJS backend, including data transformation, authentication, error handling, and automatic retry mechanisms.

## Request/Response Flow

### 1. Frontend Request (useApi/useApiGet)

```typescript
// User calls API function
const result = await useApi<UserData>('/users', userData)
```

### 2. API Plugin Processing (plugins/api.ts)

**onRequest Hook:**
```typescript
onRequest: async ({ options }) => {
  // 1. Show loading UI automatically
  const { showLoading } = useLoadingUI()
  showLoading()

  // 2. Auto-inject JWT token
  const authStore = useAuthStore()
  if (authStore.token) {
    headers.set('Authorization', `Bearer ${authStore.token}`)
  }

  // 3. Auto-inject CSRF token for mutations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const { getCsrfToken } = useCsrf()
    const csrfToken = await getCsrfToken()
    headers.set('X-CSRF-Token', csrfToken)
  }
}
```

### 3. Backend Processing

**Request Flow:**
1. **Guards** - JWT authentication validation
2. **Pipes** - DTO validation and transformation  
3. **Controller** - Route handler execution
4. **Service** - Business logic execution
5. **TransformInterceptor** - Response standardization

**Standard Controller Pattern:**
```typescript
// Standard response - interceptor wraps automatically
@Get('/users')
async getUsers(): Promise<User[]> {
  return await this.userService.findAll()
  // Becomes: { status: 'success', data: User[] }
}
```

**Passthrough Pattern (for cookies/headers):**
```typescript
// CSRF token endpoint - needs to set cookies AND maintain standard format
@Get('/csrf/token')
async getCsrfToken(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
): Promise<CsrfTokenResponseDto> {
  // Set CSRF session cookie
  res.cookie('csrf-sid', sessionId, {
    httpOnly: true,
    sameSite: 'strict'
  });
  
  const token = this.csrfService.generateToken(req, res);
  return { csrfToken: token };
  // Interceptor still wraps: { status: 'success', data: { csrfToken: "..." } }
}

// Auth login - sets refresh token cookie
@Post('/auth/login')
async login(
  @Body() loginDto: LoginDto,
  @Res({ passthrough: true }) response: Response,
): Promise<AuthResponseDto> {
  const result = await this.authService.login(loginDto);
  
  // Set refresh token cookie for web clients
  response.cookie('refreshToken', result.refreshToken, cookieOptions);
  
  return {
    accessToken: result.accessToken,
    user: result.user
  };
  // Interceptor wraps: { status: 'success', data: { accessToken: "...", user: {...} } }
}
```

**Key Points:**
- `@Res({ passthrough: true })` allows cookie/header manipulation while preserving interceptor functionality
- Without passthrough, interceptor is bypassed and manual response formatting is required
- All responses maintain consistent `{ status: 'success'|'error', data: T }` format

### 4. Frontend Response Processing

**onResponse Hook:**
```typescript
onResponse: () => {
  // Hide loading UI automatically
  const { hideLoading } = useLoadingUI()
  hideLoading()
}
```

**onResponseError Hook:**
```typescript
onResponseError: async ({ response, error }) => {
  hideLoading() // Always hide loading on error

  // Auto-retry on 401 (JWT expired)
  if (response?.status === 401 && !context.skipTokenRefresh) {
    const refreshSuccess = await authStore.refreshToken()
    if (refreshSuccess) {
      // Retry request with new token
      return await apiInstance(request, { 
        ...options, 
        context: { skipTokenRefresh: true } 
      })
    }
  }

  // Auto-retry on CSRF error
  if (isCsrfError(response._data) && !context.skipCsrfRetry) {
    await refreshCsrfToken()
    return await apiInstance(request, { 
      ...options, 
      context: { skipCsrfRetry: true } 
    })
  }
}
```

## Data Format Standards

### Success Response

**Backend Output (TransformInterceptor):**
```typescript
{
  "status": "success",
  "data": {
    // Actual response data
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Frontend Type:**
```typescript
interface ApiSuccessResponse<T> {
  status: 'success'
  data: T
}
```

### Error Response

**Backend Output (HttpExceptionFilter):**
```typescript
{
  "status": "error",
  "data": {
    "name": "BadRequestException",
    "message": "Validation failed: email is required"
  }
}
```

**Frontend Type:**
```typescript
interface ApiErrorResponse {
  status: 'error'
  data: {
    name: string
    message: string
  }
}
```

## Authentication Flow

### JWT Token Management

1. **Login Process:**
   ```typescript
   const result = await useApi<AuthResponse>('/auth/login', credentials)
   if (result.status === 'success') {
     // Store access token (15min lifespan)
     authStore.setAuth(result.data)
   }
   ```

2. **Automatic Token Injection:**
   - API plugin automatically adds `Authorization: Bearer {token}` header
   - Applied to all requests when user is authenticated

3. **Token Refresh on 401:**
   ```typescript
   // API plugin automatically handles this
   if (response.status === 401) {
     const refreshSuccess = await authStore.refreshToken() // Uses HTTP-only cookie
     if (refreshSuccess) {
       // Retry original request with new token
     }
   }
   ```

### CSRF Protection

1. **Token Generation:**
   ```typescript
   // First request gets CSRF token
   const { getCsrfToken } = useCsrf()
   const csrfToken = await getCsrfToken() // GET /security/csrf-token
   ```

2. **Auto-injection:**
   - API plugin automatically adds `X-CSRF-Token` header
   - Applied only to mutation requests (POST, PUT, PATCH, DELETE)

3. **Error Recovery:**
   ```typescript
   // Auto-retry on CSRF validation failure
   if (isCsrfError(response)) {
     await refreshCsrfToken() // Get new CSRF token
     // Retry original request
   }
   ```

## Automatic Features

### Loading State Management

**No Manual Management Required:**
```typescript
// Loading automatically shown/hidden
const handleSubmit = async () => {
  // Loading starts here automatically
  const result = await useApi('/submit', formData)
  // Loading ends here automatically
  
  if (result.status === 'success') {
    // Handle success
  }
}
```

### Error Normalization

**Consistent Error Handling:**
```typescript
// All errors normalized to same format
const result = await useApi<T>('/endpoint', data)

if (result.status === 'error') {
  // Always has .data.name and .data.message
  console.error(`${result.data.name}: ${result.data.message}`)
}
```

### Smart Retry Logic

**Automatic Retry Scenarios:**
1. **401 Unauthorized** → Refresh JWT token → Retry once
2. **CSRF Error** → Get new CSRF token → Retry once
3. **Network/Other Errors** → No retry (fail immediately)

## Type Safety

### Generic API Functions

```typescript
// Type-safe API calls
interface User {
  id: number
  name: string
  email: string
}

// TypeScript infers return type
const result = await useApiGet<User[]>('/users')

if (result.status === 'success') {
  // result.data is User[] - fully typed
  result.data.forEach(user => {
    console.log(user.name) // TypeScript knows this is string
  })
}
```

### Context Flags

```typescript
// Control API behavior
const result = await useApi<T>('/endpoint', data, {
  skipTokenRefresh: true,  // Don't auto-refresh on 401
  skipCsrf: true,         // Don't inject CSRF token
  skipCsrfRetry: true     // Don't retry on CSRF error
})
```

## Server-Side Rendering (SSR)

### SSR-Safe API Calls

```typescript
// Only works on server-side
const result = await useServerApiGet<T>('/endpoint')

// Includes special headers:
// X-Server-Request: true
// X-Request-Source: nuxt-ssr

// Uses shorter timeout (15s vs 30s)
// No loading UI interaction
```

## Performance Considerations

### Timeouts
- **Client requests**: 30 seconds
- **Server requests**: 15 seconds

### Concurrency Control
- **Token refresh**: Single promise prevents concurrent refresh requests
- **CSRF retry**: Automatic cooldown prevents retry storms

### Loading States
- **Global state**: Single loading indicator for all API calls
- **Teleport rendering**: Loading overlay rendered directly to body
- **Transition effects**: Smooth show/hide animations

## Testing & Development

### Manual API Testing

When testing API endpoints manually during development:

**Basic Testing Pattern:**
```bash
# Use temporary directory for test files
mkdir -p ./test-temp
cd ./test-temp

# Test endpoints (avoid hardcoding actual tokens)
curl -c cookies.txt "http://localhost:3020/csrf/token"
curl -b cookies.txt -H "X-CSRF-Token: [token-from-response]" -X POST "http://localhost:3020/auth/login"

# Clean up
cd .. && rm -rf ./test-temp
```

**Client Type Testing:**
- Web client: Requires CSRF tokens and uses cookies
- Mobile client: Add `X-Client-Type: mobile` header to bypass CSRF

### Cleanup Best Practices

Always clean up test artifacts after API testing:

```bash
# Remove any test files created during development
find . -maxdepth 2 -name "cookies*.txt" -delete
find . -maxdepth 2 -name "*test*.txt" -delete
rm -rf ./test-temp/

# Stop development servers when done
pkill -f "npm run local" 2>/dev/null || echo "No servers running"
```

This architecture ensures consistent, reliable, and user-friendly API communication throughout the application.