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
| **security/** | `security.module.ts` | CSRF protection module |
| | `csrf.controller.ts` | CSRF token generation endpoint |
| | `csrf.service.ts` | Double-submit cookie CSRF implementation |

### Frontend Files (`/frontend/`)

| Category | File | Purpose |
|----------|------|---------|
| **Plugins** | `plugins/api.ts` | API client with auto auth/CSRF injection, loading states |
| | `plugins/auth.client.ts` | Auth initialization on app start |
| | `plugins/session-bus.client.ts` | Cross-tab session synchronization |
| **Store** | `stores/auth.ts` | Auth state management, token refresh logic |
| **Composables** | `composables/utils/useCsrf.ts` | CSRF token management and refresh |
| | `composables/utils/useApiHelper.ts` | API response types and error detection |
| | `composables/api/useApi.ts` | API request wrapper functions |
| **Middleware** | `middleware/auth.middleware.ts` | Route protection middleware |
| **Components** | `components/auth/*` | Login/Register UI components |

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

### Token Generation & Validation

**Backend (`csrf.service.ts`):**
- Generates cryptographically secure tokens
- Validates using double-submit pattern
- Supports fail-open/fail-closed modes

**Frontend (`useCsrf.ts`):**
- Auto-refreshes tokens every 25 minutes
- Retry logic with exponential backoff
- Token synchronization on page visibility

### CSRF Token Flow

```
1. Frontend requests CSRF token → GET /csrf/token
2. Backend generates token + session cookie
3. Frontend includes token in mutation requests
4. Backend validates token against session
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

| Guard | Purpose | Applied To |
|-------|---------|------------|
| `JwtAuthGuard` | Validates Access Token | Protected routes |
| `JwtRefreshGuard` | Validates Refresh Token | `/auth/refresh` only |
| `ProxyAwareThrottlerGuard` | Rate limiting with proxy support | All routes |

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
CSRF_SESSION_SECRET=<random-string>
CSRF_DOUBLE_SUBMIT=true
CSRF_FAIL_MODE=closed  # or 'open'

# Security Settings
BCRYPT_ROUNDS=10
THROTTLE_TTL=60
THROTTLE_LIMIT=10
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

### 4. Manual Token Refresh (Frontend)

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