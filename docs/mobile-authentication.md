# Mobile Authentication Guide

## Overview

This document describes how to implement authentication for mobile applications using our JWT-based authentication system. The system supports both web browsers and mobile apps with platform-specific optimizations.

## Key Differences: Web vs Mobile

| Feature | Web Browser | Mobile App |
|---------|-------------|------------|
| **Access Token Storage** | In-memory (JavaScript) | Secure Storage (KeyChain/Keystore) |
| **Refresh Token Storage** | HttpOnly Cookie | Secure Storage (KeyChain/Keystore) |
| **Refresh Token Delivery** | Cookie (automatic) | Response Body (manual) |
| **CSRF Protection** | Required | Not Required |
| **Client Identification** | Default | `X-Client-Type: mobile` header |

## Mobile Authentication Flow

### 1. Registration
Mobile apps use the same registration endpoint as web clients:

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 2. Login

#### Option A: Universal Endpoint with Header
```http
POST /auth/login
Content-Type: application/json
X-Client-Type: mobile

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "idx": 1,
      "email": "user@example.com",
      "isActive": true
    }
  }
}
```


### 3. Using the Access Token

Include the access token in all authenticated requests:

```http
GET /api/protected-resource
Authorization: Bearer eyJhbGc...accessToken...
```

### 4. Refreshing Tokens

When the access token expires (after 30 minutes for mobile, 15 minutes for web), use the refresh token to get a new pair:

```http
POST /auth/refresh
Authorization: Bearer eyJhbGc...refreshToken...
X-Client-Type: mobile
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGc...newAccessToken...",
    "refreshToken": "eyJhbGc...newRefreshToken..."
  }
}
```

### 5. Logout

```http
POST /auth/logout
Authorization: Bearer eyJhbGc...accessToken...
X-Client-Type: mobile
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Successfully logged out",
    "loggedOutAt": "2024-01-15T10:30:00.000Z",
    "cleanup": {
      "clearTokens": true,
      "tokenTypes": ["access_token", "refresh_token"]
    }
  }
}
```

#### Important: Token Cleanup
After receiving the logout response, your mobile app **must** immediately:
1. Clear the access token from secure storage
2. Clear the refresh token from secure storage
3. Clear any cached user data
4. Navigate to login screen

## Mobile Implementation Best Practices

### Token Storage

**iOS (Swift):**
```swift
import KeychainSwift

class TokenManager {
    private let keychain = KeychainSwift()
    
    func saveTokens(access: String, refresh: String) {
        keychain.set(access, forKey: "access_token")
        keychain.set(refresh, forKey: "refresh_token")
    }
    
    func getAccessToken() -> String? {
        return keychain.get("access_token")
    }
    
    func getRefreshToken() -> String? {
        return keychain.get("refresh_token")
    }
    
    func clearTokens() {
        keychain.delete("access_token")
        keychain.delete("refresh_token")
    }
}
```

**Android (Kotlin):**
```kotlin
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class TokenManager(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    
    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    fun saveTokens(access: String, refresh: String) {
        sharedPreferences.edit()
            .putString("access_token", access)
            .putString("refresh_token", refresh)
            .apply()
    }
    
    fun getAccessToken(): String? {
        return sharedPreferences.getString("access_token", null)
    }
    
    fun getRefreshToken(): String? {
        return sharedPreferences.getString("refresh_token", null)
    }
    
    fun clearTokens() {
        sharedPreferences.edit()
            .remove("access_token")
            .remove("refresh_token")
            .apply()
    }
    
    suspend fun logout(): Boolean {
        return try {
            val accessToken = getAccessToken()
            if (accessToken != null) {
                val response = apiService.logout("Bearer $accessToken")
                if (response.isSuccessful) {
                    clearTokens()
                    true
                } else false
            } else {
                clearTokens()
                true
            }
        } catch (e: Exception) {
            // Clear tokens even if logout request fails
            clearTokens()
            true
        }
    }
}
```

**React Native:**
```javascript
import * as Keychain from 'react-native-keychain';

class TokenManager {
    async saveTokens(accessToken, refreshToken) {
        await Keychain.setInternetCredentials(
            'app.api',
            'tokens',
            JSON.stringify({ accessToken, refreshToken })
        );
    }
    
    async getTokens() {
        const credentials = await Keychain.getInternetCredentials('app.api');
        if (credentials) {
            return JSON.parse(credentials.password);
        }
        return null;
    }
    
    async clearTokens() {
        await Keychain.resetInternetCredentials('app.api');
    }
    
    async logout() {
        try {
            const tokens = await this.getTokens();
            if (tokens && tokens.accessToken) {
                // Call logout endpoint
                await fetch('/auth/mobile/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${tokens.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
            }
        } catch (error) {
            console.warn('Logout request failed:', error);
            // Continue with token cleanup even if request fails
        } finally {
            // Always clear tokens locally
            await this.clearTokens();
        }
    }
}
```

### Automatic Token Refresh

Implement an interceptor to automatically refresh tokens when they expire:

**Example (Axios/JavaScript):**
```javascript
class ApiClient {
    constructor() {
        this.client = axios.create({
            baseURL: 'https://api.example.com'
        });
        
        this.setupInterceptors();
    }
    
    setupInterceptors() {
        // Request interceptor - add access token
        this.client.interceptors.request.use(
            async (config) => {
                const accessToken = await TokenManager.getAccessToken();
                if (accessToken) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }
                config.headers['X-Client-Type'] = 'mobile';
                return config;
            }
        );
        
        // Response interceptor - handle 401 and refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    
                    try {
                        const refreshToken = await TokenManager.getRefreshToken();
                        const response = await axios.post('/auth/refresh', null, {
                            headers: {
                                Authorization: `Bearer ${refreshToken}`,
                                'X-Client-Type': 'mobile'
                            }
                        });
                        
                        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                        await TokenManager.saveTokens(accessToken, newRefreshToken);
                        
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        return this.client(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed - redirect to login
                        await TokenManager.clearTokens();
                        // Navigate to login screen
                        return Promise.reject(refreshError);
                    }
                }
                
                return Promise.reject(error);
            }
        );
    }
}
```

## CSRF Protection

### Mobile Apps Don't Need CSRF Protection

Mobile applications are **automatically exempt from CSRF validation** because:

1. **No automatic cookie submission** - Mobile apps don't automatically send cookies like browsers
2. **Explicit token handling** - Mobile apps explicitly include tokens in headers
3. **No same-origin policy** - Mobile apps aren't bound by browser security policies

### How It Works

The backend automatically detects mobile clients through:
- `X-Client-Type: mobile` header (highest priority)
- User-Agent patterns (React Native, Flutter, OkHttp, etc.)

When a mobile client is detected:
- CSRF validation is skipped
- Response includes `X-CSRF-Skipped: mobile-client` header
- No CSRF token required for POST/PUT/DELETE operations

### Implementation for Mobile Developers

**React Native:**
```javascript
// Automatically detected via navigator.product
// No additional configuration needed
```

**Flutter:**
```dart
// Add custom header for explicit identification
final response = await http.post(
  Uri.parse('$baseUrl/auth/login'),
  headers: {
    'X-Client-Type': 'mobile',
    'Content-Type': 'application/json',
  },
  body: jsonEncode(credentials),
);
```

**iOS (Swift):**
```swift
var request = URLRequest(url: URL(string: "\(baseURL)/auth/login")!)
request.setValue("mobile", forHTTPHeaderField: "X-Client-Type")
// CSRF token not needed
```

**Android (Kotlin):**
```kotlin
// OkHttp is automatically detected
// Or add explicit header
val request = Request.Builder()
    .url("$baseURL/auth/login")
    .addHeader("X-Client-Type", "mobile")
    .post(body)
    .build()
// No CSRF token required
```

## Security Considerations

### 1. Token Security
- **Never store tokens in plain text** - Always use platform-specific secure storage
- **Implement token expiration checks** - Don't wait for server 401 responses
- **Clear tokens on logout** - Ensure complete cleanup
- **Use HTTPS only** - Never send tokens over unencrypted connections
- **Extended lifespans for mobile** - Mobile tokens have longer lifespans (30min/30d vs 15min/7d) for better UX, but require additional security measures

### 2. Device Security
- **Implement biometric authentication** - Add extra layer before accessing tokens
- **Device binding** - Consider binding tokens to device identifiers
- **Jailbreak/Root detection** - Consider blocking access on compromised devices

### 3. Network Security
- **Certificate pinning** - Prevent MITM attacks
- **Request signing** - Add request signatures for critical operations

## Error Handling

### Common Error Responses

**Invalid Credentials:**
```json
{
  "status": "error",
  "data": {
    "name": "UnauthorizedException",
    "message": "Invalid credentials"
  }
}
```

**Token Expired:**
```json
{
  "status": "error",
  "data": {
    "name": "UnauthorizedException",
    "message": "Token expired"
  }
}
```

**Rate Limited:**
```json
{
  "status": "error",
  "data": {
    "name": "TooManyRequestsException",
    "message": "Too many requests, please try again later"
  }
}
```

## Testing

### Using cURL

**Login:**
```bash
curl -X POST https://api.example.com/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Refresh:**
```bash
curl -X POST https://api.example.com/auth/refresh \
  -H "Authorization: Bearer <refresh_token>" \
  -H "X-Client-Type: mobile"
```

**Protected Resource:**
```bash
curl -X GET https://api.example.com/api/profile \
  -H "Authorization: Bearer <access_token>"
```

**Logout:**
```bash
curl -X POST https://api.example.com/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Client-Type: mobile"
```

### Using Postman

1. Set up environment variables:
   - `base_url`: Your API base URL
   - `access_token`: Automatically updated from login response
   - `refresh_token`: Automatically updated from login response

2. Add pre-request script for automatic token refresh:
```javascript
const accessToken = pm.environment.get("access_token");
const tokenExpiry = pm.environment.get("token_expiry");

if (!accessToken || new Date() > new Date(tokenExpiry)) {
    // Token expired or missing - refresh it
    const refreshToken = pm.environment.get("refresh_token");
    
    pm.sendRequest({
        url: pm.environment.get("base_url") + "/auth/refresh",
        method: "POST",
        header: {
            "Authorization": "Bearer " + refreshToken,
            "X-Client-Type": "mobile"
        }
    }, function (err, response) {
        if (!err) {
            const data = response.json().data;
            pm.environment.set("access_token", data.accessToken);
            pm.environment.set("refresh_token", data.refreshToken);
            
            // Set expiry to 14 minutes from now (1 minute buffer)
            const expiry = new Date();
            expiry.setMinutes(expiry.getMinutes() + 14);
            pm.environment.set("token_expiry", expiry.toISOString());
        }
    });
}
```

## Migration Guide

### API Endpoint Migration (v2.0) - COMPLETED

**UPDATE**: Mobile-specific endpoints have been removed. Use universal endpoints for all clients.

#### Before (Deprecated ❌)
```http
POST /auth/mobile/login
POST /auth/mobile/refresh
POST /auth/mobile/logout
```

#### After (Recommended ✅)
```http
POST /auth/login
X-Client-Type: mobile

POST /auth/refresh
X-Client-Type: mobile

POST /auth/logout
X-Client-Type: mobile
```

**Migration Status:**
- **✅ COMPLETED**: Mobile-specific endpoints have been removed
- **Current Status**: Only universal endpoints are available
- **Required**: All mobile apps must use unified endpoints with `X-Client-Type: mobile` header

**Required Code Pattern:**
```typescript
// Use universal endpoints with X-Client-Type header
fetch('/auth/login', {
  headers: {
    'X-Client-Type': 'mobile',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(credentials)
})

// Or rely on automatic detection (React Native, Flutter apps)
fetch('/auth/login', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credentials)
})
```

### From Cookie-Based to Token-Based

If migrating from a web-first implementation:

1. **Update login flow** - Store returned tokens instead of relying on cookies
2. **Update request headers** - Add Authorization header to all requests
3. **Implement token refresh** - Handle 401 responses with refresh logic
4. **Update logout** - Clear stored tokens
5. **Remove CSRF handling** - Not needed for mobile apps

## FAQ

**Q: How long are tokens valid?**
- **Web clients**: Access Token: 15 minutes, Refresh Token: 7 days
- **Mobile clients**: Access Token: 30 minutes, Refresh Token: 30 days

**Q: Can I use the same endpoint for web and mobile?**
- Yes, use the `X-Client-Type: mobile` header with standard endpoints

**Q: What happens if both tokens expire?**
- User must login again with credentials

**Q: Should I refresh proactively or reactively?**
- Reactively is simpler, but proactive refresh before expiry provides better UX

**Q: How do I handle token refresh during concurrent requests?**
- Implement a refresh queue/promise to prevent multiple refresh attempts

**Q: Why do mobile tokens have longer expiration times?**
- Mobile environments have unique challenges: frequent background/foreground transitions, unreliable networks, and typical usage patterns of shorter but more frequent sessions
- Extended lifespans improve user experience while platform security features (Keychain, Keystore) provide additional protection
- Default configuration: Web (15min/7d) vs Mobile (30min/30d)

**Q: Can I customize mobile token expiration times?**
- Yes, set environment variables: `JWT_MOBILE_ACCESS_EXPIRES_IN` and `JWT_MOBILE_REFRESH_EXPIRES_IN`
- Recommended ranges: Access Token (30min-1h), Refresh Token (30d-90d)
- Consider your security requirements when extending beyond these recommendations

**Q: Why are mobile-specific endpoints deprecated?**
- **Consistency**: Single set of endpoints for all clients
- **Maintenance**: Reduced code duplication and easier updates
- **Flexibility**: Header-based detection supports new client types easily
- **Standards**: More RESTful approach with content negotiation

**Q: What happens if I don't add the X-Client-Type header?**
- The system auto-detects client type from User-Agent
- Mobile apps are usually detected automatically
- For best reliability, always include the header

**Q: What happened to the old mobile endpoints?**
- Mobile-specific endpoints (`/auth/mobile/*`) have been removed
- All functionality is now available through universal endpoints
- Use `X-Client-Type: mobile` header or rely on automatic detection