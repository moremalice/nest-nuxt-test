# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Guidelines

**IMPORTANT**: Always conduct reasoning and work processes in English, but provide final responses to the user in Korean.

- All code, comments, documentation, and technical thinking should be in English
- Internal reasoning, analysis, and tool usage should be conducted in English
- Only the final answer/response to the user should be translated to Korean
- This ensures consistency with international development standards while maintaining Korean user communication

## Developer Persona

You are a senior full‑stack developer. One of those rare 10x developers that has incredible knowledge. Focus on simplicity, readability, performance, maintainability, testability, and reusability.

**Core Principles:**
- Remember less code is better
- Lines of code = Debt
- Only modify sections of the code related to the task at hand
- Avoid modifying unrelated pieces of code
- Accomplish goals with minimal code changes

## General Coding Guidelines

### Code Quality
- Write correct, best practice, DRY (Don't Repeat Yourself) code
- Focus on easy and readable code, over being performant
- Fully implement all requested functionality with NO todo's, placeholders or missing pieces
- Use early returns to avoid nested conditions and improve readability
- Prefer functional, immutable style unless it becomes much more verbose

### Naming Conventions
- Use descriptive names for variables and functions
- Prefix event handler functions with "handle" (e.g., handleClick, handleKeyDown)
- Use constants instead of functions where possible
- Define types if applicable

### Function Organization
- Order functions with those that are composing other functions appearing earlier in the file
- Example: if you have a menu with multiple buttons, define the menu function above the buttons

### Error Handling
- If you encounter a bug in existing code, add comments starting with "TODO:" outlining the problems

## Technology-Specific Guidelines

### JavaScript Files (*.js)
- Use JSDoc comments for JavaScript and modern ES6 syntax

### TypeScript Files (*.ts)
- **Do not use JSDoc comments** because TypeScript types are already defined
- Always declare the type of each variable and function (parameters and return value)
- Avoid using `any`
- Create necessary types
- Don't leave blank lines within a function
- One export per file

**TypeScript Conventions:**
- Use PascalCase for classes
- Use camelCase for variables, functions, and methods
- Use kebab-case for file and directory names
- Use UPPERCASE for environment variables
- Avoid magic numbers and define constants
- Start each function with a verb
- Use verbs for boolean variables (e.g., isLoading, hasError, canDelete)
- Use complete words instead of abbreviations
- Write short functions with a single purpose (under 20 statements)
- Name functions with a verb and noun (e.g., fetchUsers)
- Boolean-returning functions prefixed with is/has/can
- Void functions prefixed with execute/save

### Frontend (Vue 3 & Nuxt 3)
- Always use Composition API
- Always use Tailwind classes for styling HTML elements; avoid using CSS or `<style>` tags
- Use descriptive variable and function/const names
- Event handlers prefixed with `handle`, e.g. `handleClick`, `handleKeyDown`
- Implement accessibility features on elements (e.g. `tabindex="0"`, `aria-label`, `@click`+`@keydown`)
- Use `const` for functions, e.g. `const toggle = () =>`
- Define types where possible
- Prefer conditional classes over ternary operators for class attributes

**Composables Architecture Guidelines:**
```typescript
// Composables organization by purpose:
// api/: API interaction (useApi, useCsrf)
// ui/: UI state management (useLoadingUI, useLayer, useToast)
// utils/: Business logic utilities (useDateUtils, useSeo, usePagination)

// Global state pattern with readonly exports
const globalState = ref(initialValue);
export const useComposable = () => ({
    state: readonly(globalState),
    setState: (value) => { globalState.value = value }
});
```

**Hybrid Rendering Configuration:**
```typescript
// SSR Configuration Principles:
// - Apply SSR only to detail pages where SEO is critical (30min SWR cache)
// - Use CSR for all other routes to optimize performance

// Example routeRules configuration in nuxt.config.ts:
export default defineNuxtConfig({
  routeRules: {
    // Explicitly configure only pages that require SSR
    '/land/detail/**': { ssr: true },         // Land detail pages - 30min SWR cache
    '/world/detail/**': { ssr: true },        // World detail pages - 30min SWR cache
    
    // Default: All routes use CSR
    '/**': { ssr: false }                     // Full CSR (Client-side rendering)
  }
})

// Server-side data fetching pattern for SSR pages
const { data, error } = await useAsyncData('key', () => 
    useServerApiGet<ResponseType>('/endpoint'),
    { server: true, lazy: false }
);
```

**SEO Management Pattern:**
```typescript
// Domain-specific SEO functions
applyLandPostDetailSEO(post, locale);     // Land detail pages
applyWorldPostDetailSEO(post, locale);    // World detail pages
applySEO(title, description, locale);     // General pages

// Implementation uses useSeoMeta + useHead combination
```

**Component Naming Conventions:**
- All component files end with `Component` suffix
- Domain-based folder structure: `auth/`, `common/`, `community/`
- Nested features organized by functionality (e.g., `common/swiper/`)

### Frontend System Integration

**Plugins** (`plugins/`):
- `api.ts`: Extended API client configuration with interceptors and context handling
- `auth.client.ts`: Client-side authentication initialization and state hydration
- `session-bus.client.ts`: Cross-tab session synchronization system

**Middleware** (`middleware/`):
- `auth.ts`: Route-level authentication guard with redirect logic

**Nuxt Configuration Patterns:**
```typescript
// nuxt.config.ts key configurations
export default defineNuxtConfig({
    ssr: false,                        // Full CSR currently
    imports: { dirs: ['composables/**'] }, // Auto-import nested composables
    components: [{ path: '~/components', pathPrefix: false }], // Component auto-registration
    
    // i18n with 15 languages, no prefix strategy
    i18n: {
        strategy: 'no_prefix',
        defaultLocale: 'ko',
        detectBrowserLanguage: { useCookie: true, cookieKey: 'i18n_redirected' }
    }
})
```

### Backend (NestJS)

**Architectural Principles:**
- Use a modular architecture
- Encapsulate each domain/route in its own module
- One controller per primary route; additional controllers for sub‑routes
- A `models/` folder for DTOs and output types
- DTOs validated with `class‑validator`
- Services folder for business logic and persistence
- Entities with TypeORM for database mapping
- One service per entity

**Core Module Structure:**
- Global filters for exception handling
- Global middlewares for request management
- Guards for authorization
- Interceptors for request/response concerns

**Shared Module:**
- Provide reusable utilities
- Expose shared business logic (e.g., common validation, formatting)

**Database Connection Patterns:**
```typescript
// Services must specify database connection explicitly
@InjectRepository(EntityName, 'piki_world_db')    // Primary database
@InjectRepository(EntityName, 'piki_place_db')    // Secondary database

// Database usage guidelines:
// - world database: Core business entities, user management
// - place database: Location-specific data, geographic entities
```

**DTO Validation Patterns:**
```typescript
// Standard validation with transformation
@ApiProperty({ example: 'ko', description: 'Language code' })
@Transform(({ value }) => value === 'ko' ? 'ko' : 'en')
@IsIn(['ko', 'en'])
language: string;

@ApiPropertyOptional({ example: 1, description: 'Page number' })
@Type(() => Number)
@IsOptional()
@Min(1)
page?: number;
```

**Service Error Handling Standards:**
```typescript
// Consistent error handling with i18n
try {
    // business logic
} catch (error) {
    console.error('[ServiceName] Error:', error.message);
    throw new BadRequestException(
        this.i18n.translate('domain.ERROR_MESSAGE_KEY')
    );
}

// Standard HTTP exceptions
throw new NotFoundException(this.i18n.translate('common.NOT_FOUND'));
throw new BadRequestException(this.i18n.translate('common.INVALID_REQUEST'));
```

**Controller Conventions:**
```typescript
@ApiTags('WEB')                           // All controllers use 'WEB' tag
@ApiSecurity('csrf-token')                // CSRF protection for mutations
@ApiOperation({ summary: 'Action description' })
@ApiResponse({ status: 200, description: 'Success description' })

// Method naming: get + Target + Action
getFaqList, getTermsDetail, createNotice
```

**Testing with Jest:**
- Write tests for every controller and service
- Write end‑to‑end tests for each API module
- Include an `admin/test` endpoint in controllers as a smoke test
- Tests follow Arrange‑Act‑Assert pattern
- Name variables inputX, mockX, actualX, expectedX

## Project Overview

PikiTalk is a full-stack web application with a **monorepo structure** containing:
- **Frontend**: Nuxt 3 application with internationalization (15 languages)
- **Backend**: NestJS API with dual database connections

## Development Commands

### Frontend (Nuxt 3)
```bash
cd frontend
npm run local        # Local development with .env.local
npm run dev          # Development with .env.development  
npm run build        # Production build
npm run generate     # Static site generation
npm run preview      # Preview production build
```

### Backend (NestJS)
```bash
cd backend
npm run local        # Local development with .env.local (alias for start:local)
npm run dev          # Development with .env.development (alias for start:dev)
npm run start:local  # Local development with .env.local
npm run start:dev    # Development with .env.development
npm run build        # TypeScript compilation
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting
npm run test         # Unit tests with Jest
npm run test:e2e     # End-to-end tests
npm run test:cov     # Test coverage
```

## Architecture Overview

### Frontend Structure

**Rendering Strategy:**
- **Hybrid Rendering**: Currently full CSR (`ssr: false` in nuxt.config.ts)
- **Internationalization**: 15 locales with lazy-loaded translations (`strategy: 'no_prefix'`)

**State Management:**
- **Pinia Stores** (`stores/`):
  - `auth.ts`: Complete authentication state with concurrency control, exponential backoff, refresh token management
  - Store pattern: `defineStore` with composition API, readonly state exports, action-based mutations

**Composables Architecture** (`composables/`):
Auto-imported from nested directories:
- **api/** - API interaction utilities:
  - `useApi.ts`: POST requests, GET requests, SSR-safe server requests
  - `useCsrf.ts`: CSRF token management with auto-refresh
- **ui/** - UI state management:
  - `useLoadingUI.ts`: Global loading state management
  - `useCommonUI.ts`: Common UI utilities
  - `useHeaderFooterUI.ts`: Header/footer specific UI state
- **utils/** - Business logic utilities:
  - `usePagination.ts`: Pagination logic
  - `useSEO.ts`: SEO meta management  
  - `useCommonUtils.ts`: General utility functions
  - `apiHelpers.ts`: API response normalization helpers

**Component Organization** (`components/`):
Domain-based structure with `Component` suffix:
- **auth/**: `LoginFormComponent.vue`, `RegisterFormComponent.vue`
- **common/**: `LoadingComponent.vue`, `LayerModalComponent.vue`, `PaginationComponent.vue`
- **common/swiper/**: `PikiTalkSwiperComponent.vue`, `CustomSwiperComponent.vue`
- **community/**: `CommunityTabComponent.vue`
- Root level: `HeaderComponent.vue`, `FooterComponent.vue`

### Backend Structure
- **Modular Architecture**: Feature-based modules in `src/module/` (Auth, Security, Community, Policy, File, Link)
- **Triple Database**: Three TypeORM connections (`piki_world_db`, `piki_place_db`, `test_user_db`)
- **Global Configuration**: Centralized configs in `src/config/`
  - `database.config.ts`: Triple MySQL connections with SnakeNamingStrategy
  - `cors.config.ts`, `helmet.config.ts`, `throttler.config.ts`: Security configurations
  - `i18n.config.ts`, `swagger.config.ts`: Feature configurations
- **Common Layer**: Shared utilities in `src/common/`
  - **Pipes**: `CustomValidationPipe` for DTO validation
  - **Filters**: `HttpExceptionFilter` for consistent error responses
  - **Interceptors**: `TransformInterceptor`, `LoggingInterceptor`
  - **Guards**: `ProxyAwareThrottlerGuard` for rate limiting
  - **i18n**: Custom language resolver with 15 language support (ko/en translations)

### Configuration Management with ConfigService

The backend uses **@nestjs/config** for centralized environment variable management:

**Configuration Setup:**
- `ConfigModule.forRoot()` in `app.module.ts` with global scope
- Environment files loaded in order: `.env.${NODE_ENV}`, `.env.local`, `.env`
- Factory pattern for modular configurations in `src/config/`

**Configuration Files Pattern:**
```typescript
// src/config/*.config.ts
export const configName = {
    factoryName: {
        factory: (configService: ConfigService): ReturnType => ({
            // configuration using configService.get<T>('KEY', defaultValue)
        }),
    },
};
```

**Usage in Services/Controllers:**
```typescript
constructor(private readonly configService: ConfigService) {}

// Get environment variables with type safety and default values
const value = this.configService.get<string>('ENV_KEY', 'default');
const port = this.configService.get<number>('PORT', 3001);
const isDev = this.configService.get<string>('NODE_ENV', 'local') !== 'production';
```

**Key Configuration Files:**
- `database.config.ts`: Dual MySQL connection configs for world/place databases
- `cors.config.ts`: Environment-specific CORS settings
- `swagger.config.ts`: Swagger documentation (disabled in production)
- `i18n.config.ts`: Internationalization setup with custom resolvers

### API Communication Architecture

The frontend-backend communication follows a standardized pattern with consistent response formats and security measures:

**Frontend API Client (`composables/api/useApi.ts`):**
```typescript
// Standardized response types
interface ApiSuccessResponse<T> { status: 'success'; data: T; }
interface ApiErrorResponse { status: 'error'; data: { name: string; message: string; }; }

// Three distinct API functions with specific use cases:
const result = await useApi<ResponseType>('/endpoint', body, options);          // POST (default method)
const result = await useApiGet<ResponseType>('/endpoint', query, options);     // GET (client-side)  
const result = await useServerApiGet<ResponseType>('/endpoint');              // GET (SSR-only)

// API Context Options
interface ApiContextFlags {
  skipTokenRefresh?: boolean;    // Prevent infinite loops during token refresh
  // Additional context flags as needed
}

// Server-side API specifics:
// - Uses direct $fetch with baseURL from runtime config
// - Includes special headers: X-Server-Request, X-Request-Source
// - 15s timeout vs 30s for client requests  
// - Returns normalized error format on server-side failures
```

**Backend Response Transformation (`transform.interceptor.ts`):**
- All successful responses wrapped in `{ status: 'success', data: T }` format
- Global interceptor ensures consistent response structure
- Error responses handled by `HttpExceptionFilter` with `{ status: 'error', data: { name, message } }` format

**Authentication & Security Integration:**
```typescript
// Backend Authentication Guards and Decorators
@RequireAuth()              // Mandatory JWT authentication - returns 401 if no valid token
@OptionalAuth()             // Optional JWT authentication - injects user if token exists
// No decorator needed for public endpoints

// Usage examples in controllers:
@Get('public')              // Public endpoint - no guard
async getPublicData() { ... }

@Get('profile') 
@RequireAuth()              // Protected endpoint - requires valid JWT
async getProfile(@GetUser() user: User) { ... }

@Get('content')
@OptionalAuth()             // Conditional endpoint - user injected if authenticated
async getContent(@GetUser() user: User | null) { 
  // Different logic based on user presence
}
```

**Frontend Authentication Integration:**
```typescript
// Pinia Auth Store Pattern (stores/auth.ts)
export const useAuthStore = defineStore('auth', () => {
  // Concurrency control for refresh token
  let refreshTokenPromise: Promise<boolean> | null = null
  const MAX_REFRESH_RETRIES = 2
  const REFRESH_COOLDOWN = 30000 // 30s cooldown after failures
  
  // Exponential backoff with jitter for retry logic
  const getBackoffDelay = (attempt: number) => Math.min(5000, 500 * Math.pow(2, attempt))
  
  // Authentication state
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)
})

// JWT + Refresh Token Flow:
// - Access tokens: 15min lifespan, included in Authorization header
// - Refresh tokens: 7day lifespan, stored in HTTP-only cookies
// - Automatic refresh on 401 with exponential backoff and retry limits
// - CSRF tokens: Auto-managed via useCsrf.ts with refresh coordination
```

**Key Features:**
- **Type Safety**: Generic types for request/response data
- **Error Handling**: Standardized error format with automatic retry for CSRF issues
- **Loading States**: Global loading UI management via `useLoadingUI.ts`
- **Environment Awareness**: SSR-safe server-side API calls with special headers
- **Timeout Management**: 30s for client requests, 15s for server requests

### Key Backend Modules

**Module Architecture:**
Each module follows consistent structure: `module/`, `controllers/`, `services/`, `dto/`, `entities/`

- **Auth Module** (`src/module/auth/`):
  - JWT-based authentication with refresh tokens (HTTP-only cookies)
  - User registration, login, logout, profile management
  - Guards: `JwtAuthGuard` (required auth), `OptionalJwtAuthGuard` (optional)
  - Rate limiting: 5 register/min, 10 login/min, 20 refresh/min

- **Security Module** (`src/module/security/`):
  - CSRF protection with configurable strictness per environment
  - CSRF token generation and validation endpoints
  - Integration with all POST/PUT/DELETE endpoints via `@ApiSecurity('csrf-token')`

- **Community Module** (`src/module/community/`):
  - FAQ management with controllers, services, entities
  - Notice management system
  - Structured DTOs for input validation

- **Policy Module** (`src/module/policy/`):
  - Terms of service and privacy policy management
  - Versioned policy documents

- **File Module** (`src/module/file/`):
  - File upload/download handling
  - Secure file access with download URL generation

- **Link Module** (`src/module/link/`):
  - URL management and redirection services

**Common Layer** (`src/common/`):
- **Interceptors**: `TransformInterceptor` (response wrapping), `LoggingInterceptor`
- **Filters**: `HttpExceptionFilter` for consistent error responses
- **Guards**: `ProxyAwareThrottlerGuard` for rate limiting
- **Pipes**: `CustomValidationPipe` for DTO validation
- **i18n**: Custom language resolver with 15 language support

### Database Configuration
The application uses **triple database connections** for data segregation:
- `world` (`piki_world_db`): Primary database for core business entities, user management
- `place` (`piki_place_db`): Secondary database for location-specific data, geographic entities  
- `test` (`test_user_db`): Test database for development and testing purposes

**Database Connection Patterns:**
```typescript
// Services must specify database connection explicitly
@InjectRepository(EntityName, 'piki_world_db')    // Primary database
@InjectRepository(EntityName, 'piki_place_db')    // Secondary database
@InjectRepository(EntityName, 'test_user_db')     // Test database

// Database configuration pattern in database.config.ts
export const databaseConfigs = {
    world: { name: 'piki_world_db', factory: (configService) => ({...}) },
    place: { name: 'piki_place_db', factory: (configService) => ({...}) },
    test: { name: 'test_user_db', factory: (configService) => ({...}) }
}
```

All connections are configured via environment variables and support multiple environments (local/development/production) with separate host configurations for each environment.

### Environment Configuration

**Backend Environment Variables:**
Environment files loaded in priority order: `.env.${NODE_ENV}`, `.env.local`, `.env`
- **Triple Database Configuration**:
  - `DB_WORLD_*`: Primary database (piki_world) - AWS RDS in production
  - `DB_PLACE_*`: Place database (owner_world) - Separate server for local/dev  
  - `DB_TEST_USER_*`: Test database (nest_test/nest-test) - Development testing
- **Security Configuration**:
  - `CSRF_SECRET`, `CSRF_COOKIE_MAX_AGE`, `CSRF_SIZE`, `CSRF_STRICT`
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_*_EXPIRES_IN`
- **Server Configuration**: `PORT=3020`, `SERVER_HOST` varies by environment

**Frontend Environment Variables:**
- **Local**: `NUXT_PUBLIC_BASE_URL=http://localhost:3020`
- **Development**: `NUXT_PUBLIC_API_BASE=http://localhost:3020` (note: inconsistent naming)
- Runtime config pattern: `NUXT_PUBLIC_*` prefixed for client-side access

### Internationalization

**Frontend i18n Patterns:**
```typescript
// Reactive translation with computed
const translatedText = computed(() => $t('domain.MESSAGE_KEY'));

// 15 supported locales with lazy loading
locales: ['ko', 'en', 'ja', 'zh-cn', 'zh-tw', ...]
lazy: true

// Language-specific routing and SEO
'/land/detail/[idx]': { ssr: true }    // All languages
```

**Backend i18n Patterns:**
```typescript
// Service error messages with i18n
throw new BadRequestException(
    this.i18n.translate('community.FAQ_LIST_ERROR')
);

// Translation key naming convention
// Format: domain.MESSAGE_TYPE
// Examples: 'community.NOT_FOUND', 'land.INVALID_REQUEST'
```

**Translation Key Conventions:**
- Use UPPERCASE for error/status messages
- Use lowercase for general content
- Prefix with domain/module name
- Store in structured folders by domain

### Development Workflow
1. Both frontend and backend need `npm install` in their respective directories
2. Environment files should be configured before starting development
3. Backend runs on port 3020 by default, frontend on 3000
4. Swagger documentation available at `/api` when running backend in development

### Server Management

**Starting Servers:**
```bash
# Start both servers in separate terminals
cd backend && npm run local     # Backend on port 3020
cd frontend && npm run local    # Frontend on port 3000
```

**Stopping Servers Safely:**
When development servers need to be terminated, use these methods to avoid port conflicts:

```bash
# Method 1: Use Ctrl+C in terminal (preferred for single server)
# Press Ctrl+C in the terminal running the server

# Method 2: Force kill all Node.js processes (most reliable method)
# This terminates all Node.js processes cleanly
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

# Method 3: Use Claude Code's KillBash tool (when using background processes)
# If servers were started as background processes, use Claude Code's KillBash tool
# to terminate specific shell sessions cleanly

# Verify ports are free (False = port is available)
powershell -Command "Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet"
powershell -Command "Test-NetConnection -ComputerName localhost -Port 3020 -InformationLevel Quiet"
# Should return 'False' for both if ports are successfully freed
```

**Troubleshooting Port Conflicts:**
- **Primary Method**: Use Method 2 (Force kill Node.js processes) - this is the most reliable
- Method 1 (Ctrl+C) may not fully terminate all processes, especially with background servers
- Complex port-specific PowerShell commands often fail due to shell path issues
- Always verify port availability using `Test-NetConnection` before restarting servers
- The `Test-NetConnection` command returning 'False' confirms ports are properly freed