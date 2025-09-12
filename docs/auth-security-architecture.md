# Authentication & Security Architecture

## Quick Overview

This document provides a comprehensive overview of the authentication and security implementation across the Nest.js + Nuxt.js application.

**Core Technologies:**
- **JWT Dual-Token System**: Access Token (15min) + Refresh Token (12hr)
- **CSRF Protection**: Double-submit cookie pattern with fail-open/closed modes
- **Auto Token Management**: Automatic refresh, retry logic, and cross-tab synchronization
- **Stateless Architecture**: No server-side session storage

## File Mapping Reference

### Backend Files (`/backend/src/module/`)

| Module | File | Purpose |
|--------|------|---------|
| **auth/** | `auth.module.ts` | Main auth module with JWT, Passport, Throttling config |
| | `auth.controller.ts` | Auth endpoints (register, login, refresh, logout, profile) |
| | `auth.service.ts` | JWT token generation, validation, user authentication |
| | `jwt-config.service.ts` | Centralized JWT configuration management |
| | `strategies/jwt.strategy.ts` | Access token validation strategy |
| | `strategies/jwt-refresh.strategy.ts` | Refresh token validation strategy |
| | `guards/jwt-auth.guard.ts` | Access token guard for protected routes |
| | `guards/jwt-refresh.guard.ts` | Refresh token guard for token refresh |
| | `guards/optional-jwt-auth.guard.ts` | Optional authentication guard for mixed access |
| | `decorators/client-type.decorator.ts` | Client type detection (Mobile/Web) with priority-based logic |
| **security/** | `security.module.ts` | CSRF protection module with smart middleware |
| | `csrf.controller.ts` | CSRF token generation endpoint |
| | `csrf.service.ts` | Double-submit cookie CSRF implementation with mobile detection |
| | `middleware/smart-csrf.middleware.ts` | Intelligent CSRF middleware with mobile bypass |
| | `interfaces/recaptcha.interface.ts` | TypeScript interfaces for Google reCAPTCHA API |
| | `strategies/recaptcha.strategy.ts` | Core reCAPTCHA validation logic with Google API |
| | `guards/recaptcha.guard.ts` | NestJS guard for automatic reCAPTCHA endpoint protection |
| | `decorators/recaptcha.decorator.ts` | `@Recaptcha()` and `@OptionalRecaptcha()` decorators |
| | `dto/recaptcha.dto.ts` | Request/response DTOs for reCAPTCHA validation |

### Frontend Files (`/frontend/`)

| Category | File | Purpose |
|----------|------|---------|
| **Plugins** | `plugins/api.ts` | API client with auto auth/CSRF injection, loading states |
| | `plugins/auth.client.ts` | Auth initialization on app start |
| | `plugins/session-bus.client.ts` | Cross-tab session synchronization |
| **Store** | `stores/auth.ts` | Auth state management, token refresh logic, CSRF management |
| **Composables** | `composables/utils/useCsrf.ts` | CSRF composable proxy to Auth Store |
| | `composables/utils/useRecaptcha.ts` | Smart reCAPTCHA token management and generation |
| | `composables/utils/useApiHelper.ts` | API response types and error detection |
| | `composables/api/useApi.ts` | API request wrapper functions |
| **Middleware** | `middleware/auth.middleware.ts` | Route protection middleware |
| **Components** | `components/auth/*` | Login/Register UI components |
| | `components/common/RecaptchaCheckboxComponent.vue` | Interactive reCAPTCHA checkbox with countdown |
| | `components/common/RecaptchaLoadingComponent.vue` | Loading indicator for reCAPTCHA operations |

## Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Backend   │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │
      ├─[1. Login]────────▶│                    │
      │                    ├─[Validate]────────▶│
      │                    │◀───[User Data]─────┤
      │◀─[AT + RT]─────────┤                    │
      │                    │                    │
      ├─[2. API Request]──▶│                    │
      │  (with AT)         ├─[Verify AT]        │
      │◀─[Response]────────┤                    │
      │                    │                    │
      ├─[3. Token Expired]─▶│                    │
      │                    ├─[401 Error]        │
      │◀───────────────────┤                    │
      │                    │                    │
      ├─[4. Refresh]───────▶│                    │
      │  (with RT cookie)  ├─[Verify RT]        │
      │◀─[New AT]──────────┤                    │
      │                    │                    │
      └─[5. Retry Request]─▶│                    │
```

## Token Configuration

### JWT Token Structure

| Token Type | Storage | Expiry | Payload | Secret |
|------------|---------|--------|---------|--------|
| **Access Token** | Memory (Frontend) | 15 minutes | `{ sub, email, type: 'access' }` | `JWT_ACCESS_SECRET` |
| **Refresh Token** | HttpOnly Cookie | 12 hours | `{ sub, email, type: 'refresh', jti, iat, iss, aud }` | `JWT_REFRESH_SECRET` |

### Cookie Configuration

**Production Environment:**
```typescript
{
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
  domain: '.example.com',
  prefix: '__Host-'  // Security prefix for cookies
}
```

**Development Environment:**
```typescript
{
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  path: '/'
}
```

## CSRF Protection

### Smart CSRF Architecture

The system implements intelligent CSRF protection that automatically adapts to client types:

**Key Features:**
- **Mobile Bypass**: Automatic CSRF bypass for mobile applications
- **Priority-based Detection**: Client type detection through header → User-Agent → default
- **Centralized Logic**: Shared client detection across all security modules
- **Fail-safe Design**: Continues operation even if CSRF initialization fails

### Client Type Detection

**Priority Order:**
1. **X-Client-Type Header** (Recommended): Explicit client identification
2. **User-Agent Pattern Matching**: Detects mobile frameworks and libraries
3. **Default to Web**: Unknown clients treated as web browsers

**Supported Mobile Patterns:**
```typescript
// Native frameworks
'react-native', 'flutter', 'xamarin', 'cordova', 'phonegap'

// HTTP libraries
'okhttp', 'alamofire', 'retrofit', 'ktor', 'dio', 'nsurl'

// Hybrid frameworks
'expo', 'capacitor', 'ionic'
```

### Token Generation & Validation

**Backend (`csrf.service.ts`):**
- Generates cryptographically secure tokens using double-submit pattern
- Validates tokens against session cookies
- Supports fail-open/fail-closed modes via `CSRF_STRICT` environment variable
- Automatic mobile client detection for CSRF bypass

**Frontend Auth Store (`stores/auth.ts`):**
- CSRF tokens managed within unified Auth store architecture
- Auto-refreshes tokens every 10 minutes (security enhanced)
- Retry logic with exponential backoff
- Token synchronization on page visibility changes
- Memory-safe Pinia store state management (prevents SSR hydration attacks)

**CSRF Composable (`useCsrf.ts`):**
- Proxy layer that delegates all operations to Auth Store
- Maintains backward compatibility with existing code
- Zero direct state management (all handled by Auth Store)

**CSRF Plugin (`plugins/csrf.client.ts`):**
- Auth Store based initialization using `onNuxtReady` for non-blocking startup
- Event-driven token management with 5-minute visibility check interval
- Graceful cleanup on app termination
- Zero-configuration setup for Nuxt 4

**Smart Middleware (`smart-csrf.middleware.ts`):**
- Applied globally to all routes
- Checks client type before applying CSRF protection
- Sets debugging headers (`X-CSRF-Skipped: mobile-client`)

### CSRF Token Flow

```
Web Client Flow:
1. Frontend requests CSRF token → GET /csrf/token
2. Backend generates token + session cookie
3. Frontend includes token in mutation requests
4. Backend validates token against session

Mobile Client Flow:
1. Mobile app sends request with X-Client-Type: mobile
2. Smart middleware detects mobile client
3. CSRF validation is skipped automatically
4. Request proceeds without CSRF token
```

### CSRF Initialization Pattern (Nuxt 4)

**Plugin-Based Auto-Initialization:**
```typescript
// plugins/csrf.client.ts - Zero-configuration setup
export default defineNuxtPlugin(() => {
  if (!import.meta.client) return
  
  onNuxtReady(() => {
    const { fetchCsrfToken, isTokenValid, refreshCsrfToken } = useCsrf()
    
    // Initial token fetch
    fetchCsrfToken().catch(() => {})
    
    // Event-driven management
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('beforeunload', cleanup)
  })
})
```

**Key Improvements from useState Pattern:**
- **Auth Store Integration**: CSRF managed within unified Pinia store for security consistency
- **SSR Hydration Attack Prevention**: Eliminates `useState` SSR vulnerability
- **Memory Safety**: Pinia store lifecycle prevents memory leaks and cross-tab issues  
- **10-minute Token Lifecycle**: Enhanced security with shorter token expiration
- **Centralized Security**: Single source of truth for all authentication and CSRF logic

**Migration from useState:**
```typescript
// ❌ Old pattern (security vulnerable)
const csrfToken = useState<string | null>('csrf-token', () => null)

// ✅ New pattern (Auth Store integrated)
const authStore = useAuthStore()
const csrfToken = authStore.getCsrfToken() // Proxied through useCsrf()
```

## Auto Token Refresh System

### Frontend API Plugin (`plugins/api.ts`)

**Automatic Features:**
1. **Loading State Management**: Shows/hides loading automatically
2. **JWT Injection**: Adds Bearer token to all requests
3. **CSRF Injection**: Adds CSRF token to mutations
4. **401 Handling**: Auto-refreshes expired tokens
5. **CSRF Error Retry**: Re-fetches CSRF on validation errors

### Refresh Token Logic (`stores/auth.ts`)

**Smart Refresh Strategy:**
```typescript
// Token expiry check with buffer
isTokenExpired(token, bufferSeconds = 30)

// Concurrent request handling
if (refreshTokenPromise) {
  return await refreshTokenPromise  // Reuse existing refresh
}

// Exponential backoff on failures
getBackoffDelay(attempt, base = 500, cap = 5000)
```

## Cross-Tab Session Synchronization

### Session Bus (`plugins/session-bus.client.ts`)

**BroadcastChannel Events:**
- `LOGIN`: Syncs new session across tabs
- `ACCESS_TOKEN`: Updates token after refresh
- `LOGOUT`: Clears session in all tabs

**Implementation:**
```typescript
// Broadcasting from active tab
channel.postMessage({ type: 'LOGIN', accessToken, user })

// Receiving in other tabs
channel.onmessage = (event) => {
  if (event.data.type === 'LOGIN') {
    auth.$patch({ accessToken, user })
  }
}
```

## Security Headers & Guards

### Backend Guards

| Guard | Purpose | Applied To | Behavior |
|-------|---------|------------|----------|
| `JwtAuthGuard` | Validates Access Token | Protected routes | Blocks if no/invalid token |
| `JwtRefreshGuard` | Validates Refresh Token | `/auth/refresh` only | Blocks if no/invalid token |
| `OptionalJwtAuthGuard` | Optional authentication | Public routes with auth benefits | Allows all, adds user if token valid |
| `ProxyAwareThrottlerGuard` | Rate limiting with proxy support | All routes | Rate limiting based on IP |

### Security Headers

**Profile Endpoint:**
```typescript
'Cache-Control': 'no-store, no-cache, must-revalidate'
'Pragma': 'no-cache'
'Expires': '0'
```

## Environment Variables

### Backend Security Config

```env
# JWT Configuration
JWT_ACCESS_SECRET=<random-string>
JWT_REFRESH_SECRET=<different-random-string>
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=12h

# CSRF Configuration
CSRF_SECRET=<random-string>
CSRF_STRICT=false  # true for fail-closed mode, false for fail-open
CSRF_COOKIE_MAX_AGE=1500000  # 25 minutes in milliseconds
CSRF_SIZE=128  # Token size in bits

# Security Settings
BCRYPT_ROUNDS=10
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

## Optional Authentication Pattern

### Use Case
Endpoints that are accessible to both guests and authenticated users, but provide enhanced functionality when authenticated.

### Backend Implementation

```typescript
// Example: Posts endpoint that shows public posts to guests
// but personalized content to authenticated users
@Controller('posts')
export class PostsController {
  @Get()
  @UseGuards(OptionalJwtAuthGuard)  // Optional authentication
  async getPosts(@Req() req) {
    const userId = req.user?.sub;  // null for guests, user ID for authenticated
    
    if (userId) {
      // Return personalized content for authenticated users
      return await this.postsService.getPersonalizedPosts(userId);
    }
    
    // Return public content for guests
    return await this.postsService.getPublicPosts();
  }
  
  @Get('recommended')
  @UseGuards(OptionalJwtAuthGuard)
  async getRecommendedPosts(@Req() req) {
    const user = req.user;  // Can be null
    
    return {
      posts: await this.postsService.getRecommended(user?.sub),
      isPersonalized: !!user  // Indicate if content is personalized
    };
  }
}
```

### Frontend Usage

```typescript
// Frontend can call the same endpoint regardless of auth status
const { data } = await useApiGet<PostsResponse>('/posts');

// The response might include personalized content if user is authenticated
if (data.isPersonalized) {
  // Handle personalized content
} else {
  // Handle public content
}
```

### Guard Implementation Details

```typescript
// guards/optional-jwt-auth.guard.ts
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Key difference: Return null instead of throwing error
    // This allows the request to continue without authentication
    if (err || !user) {
      return null;  // req.user will be null
    }
    return user;  // req.user will contain user data
  }
}
```

## Common Implementation Patterns

### 1. Protected Route (Frontend)

```vue
<!-- pages/profile.vue -->
<script setup>
definePageMeta({
  middleware: 'auth-middleware'  // Requires authentication
})
</script>
```

### 2. API Request with Auth (Frontend)

```typescript
// Automatic auth handling
const result = await useApi<ResponseType>('/api/protected', data)
// Token injection, refresh, and retry handled automatically
```

### 3. Protected Endpoint (Backend)

```typescript
@Controller('protected')
@UseGuards(JwtAuthGuard)  // Requires valid Access Token
export class ProtectedController {
  @Get()
  getProtectedData(@Req() req) {
    return { userId: req.user.sub }
  }
}
```

### 4. Optional Authentication Endpoint (Backend)

```typescript
@Controller('content')
export class ContentController {
  @Get('featured')
  @UseGuards(OptionalJwtAuthGuard)  // Optional authentication
  getFeaturedContent(@Req() req) {
    const userId = req.user?.sub;
    
    return {
      content: this.contentService.getFeatured(userId),
      personalized: !!userId
    };
  }
}
```

### 5. Manual Token Refresh (Frontend)

```typescript
const authStore = useAuthStore()
const success = await authStore.refreshToken()
if (!success) {
  // Redirect to login
}
```

## Troubleshooting Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 on all requests | Access token expired | Auto-refresh handles this |
| CSRF validation failed | Token mismatch or expired | Auto-retry with new token |
| Cross-tab sync not working | BroadcastChannel not supported | Fallback to localStorage events |
| Infinite refresh loop | Both tokens expired | Clear auth and redirect to login |
| Rate limit exceeded | Too many requests | Implement exponential backoff |

## reCAPTCHA Integration

### Overview

The application implements Google reCAPTCHA v3 with smart token management, interactive UI components, and seamless backend validation for enhanced bot protection.

**Key Features:**
- **Smart Token Management**: Automatic token reuse and expiry tracking (110-second lifecycle)
- **Interactive Checkbox UI**: Enhanced user experience with real-time countdown
- **Verification Limits**: Maximum 3 normal attempts with re-verification scenarios
- **Backend Guard Protection**: Automatic validation via NestJS guards
- **Mobile Client Support**: Consistent security across web and mobile platforms

### Backend Implementation

**File Structure:**
```
backend/src/module/security/
├── interfaces/recaptcha.interface.ts    # TypeScript interfaces for Google API
├── strategies/recaptcha.strategy.ts     # Core validation logic 
├── guards/recaptcha.guard.ts           # NestJS guard for endpoint protection
├── decorators/recaptcha.decorator.ts   # @Recaptcha() and @OptionalRecaptcha()
└── dto/recaptcha.dto.ts               # Request/response DTOs
```

**Controller Integration:**
```typescript
@Post('register')
@UseGuards(RecaptchaGuard)
@OptionalRecaptcha({ action: 'register' })
async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
  // reCAPTCHA automatically validated by guard if token provided
  return this.authService.register(registerDto)
}
```

### Frontend Implementation

**File Structure:**
```
frontend/app/
├── composables/utils/useRecaptcha.ts              # Smart token management composable
├── components/common/RecaptchaCheckboxComponent.vue   # Interactive checkbox UI
├── components/common/RecaptchaLoadingComponent.vue    # Loading indicator
└── components/auth/RegisterFormComponent.vue          # Integration example
```

**Smart Token Management:**
```typescript
// useRecaptcha.ts - Core composable
export const useRecaptcha = () => {
  // Token management with 110-second expiry
  const isTokenValid = (): boolean => {
    const elapsed = Date.now() - tokenGeneratedAt.value
    return elapsed < TOKEN_EXPIRY_MS // 110 seconds
  }

  // Auto-reuse valid tokens or generate new ones
  const getValidToken = async (action: string): Promise<RecaptchaResult> => {
    if (isTokenValid()) {
      return { success: true, token: currentToken.value! }
    }
    return await executeRecaptcha(action)
  }
}
```

**Component Integration:**
```vue
<!-- RecaptchaCheckboxComponent.vue -->
<template>
  <div class="recaptcha-checkbox-container">
    <label class="checkbox-label">
      <input type="checkbox" v-model="isChecked" @change="handleCheckboxChange" />
      <span class="checkbox-custom" :class="checkboxStateClass">
        <!-- Dynamic icons for loading/verified/error states -->
      </span>
      <div v-if="isVerified" class="verified-content">
        ✓ Verified
        <span v-if="displayTime > 0" class="token-expiry">
          ({{ formatTime(displayTime) }})
        </span>
      </div>
    </label>
  </div>
</template>
```

### Integration Patterns

**1. Form Integration with Smart Token Handling:**
```typescript
const handleSubmit = async () => {
  // Try to reuse valid token or auto-generate new one
  let validToken = recaptchaToken.value
  if (!validToken || !isTokenValid()) {
    const result = await getValidToken('register')
    if (!result.success) {
      // Enable re-verification on checkbox
      recaptchaCheckboxRef.value?.enableReVerification('token_expired')
      return
    }
    validToken = result.token
  }
  
  // Submit with token
  await submitForm({ email, password, recaptchaToken: validToken })
}
```

**2. Re-verification Scenarios:**
```typescript
// Enable re-verification after submission failures
if (recaptchaCheckboxRef.value) {
  recaptchaCheckboxRef.value.enableReVerification('submission_failed')
}

// Auto-enable re-verification on token expiry
if (displayTime.value <= 0 && isVerified.value) {
  enableReVerification('token_expired')
}
```

### Environment Configuration

**Backend (.env):**
```bash
RECAPTCHA_ENABLED=true                    # Enable/disable reCAPTCHA
RECAPTCHA_SECRET_KEY=your_secret_key      # Google reCAPTCHA secret key
RECAPTCHA_SCORE_THRESHOLD=0.5             # Minimum score (0.0-1.0)
RECAPTCHA_VERIFY_URL=https://www.google.com/recaptcha/api/siteverify
```

**Frontend (.env):**
```bash
NUXT_RECAPTCHA_SITE_KEY=your_site_key     # Google reCAPTCHA site key
```

### Security Flow

1. **Token Generation**: Client generates reCAPTCHA token for specific action
2. **Smart Reuse**: Valid tokens are reused within 110-second window
3. **Form Submission**: Token attached to request payload
4. **Backend Validation**: RecaptchaGuard validates with Google API
5. **Score Verification**: Checks against configured threshold
6. **Request Processing**: Continues if validation passes

### Testing Patterns

**Backend Mock Testing:**
```typescript
beforeEach(() => {
  jest.spyOn(recaptchaStrategy, 'validate').mockResolvedValue({
    isValid: true,
    score: 0.9,
    action: 'register',
    message: 'reCAPTCHA validation successful'
  })
})

it('should reject registration with invalid reCAPTCHA', async () => {
  jest.spyOn(recaptchaStrategy, 'validate').mockResolvedValue({
    isValid: false,
    message: 'reCAPTCHA verification failed: timeout-or-duplicate'
  })
  
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email: 'test@example.com', password: 'password', recaptchaToken: 'invalid-token' })
    .expect(400)
    
  expectErrorResponse(response.body, 'BadRequestException', 'reCAPTCHA verification failed')
})
```

## Security Best Practices

1. **Never expose secrets**: Keep JWT secrets and sensitive data server-side only
2. **Use HttpOnly cookies**: Prevent XSS attacks on refresh tokens
3. **Implement CSRF protection**: Protect state-changing operations
4. **Set appropriate CORS**: Restrict origins in production
5. **Rate limiting**: Prevent brute force attacks
6. **Token rotation**: Short-lived access tokens, longer refresh tokens
7. **Secure headers**: Use security prefixes in production cookies
8. **Input validation**: Validate all inputs with DTOs and class-validator
9. **Error sanitization**: Never expose internal errors to clients
10. **Audit logging**: Log authentication events for security monitoring
11. **reCAPTCHA protection**: Implement bot protection on sensitive endpoints
12. **Smart token reuse**: Minimize reCAPTCHA friction with intelligent token management