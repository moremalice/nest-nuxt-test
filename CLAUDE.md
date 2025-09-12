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

### Frontend (Vue 3 & Nuxt 4)
- Always use Composition API
- Use standard CSS by default; use Tailwind classes only when explicitly requested
- Use descriptive variable and function/const names
- Event handlers prefixed with `handle`, e.g. `handleClick`, `handleKeyDown`
- Implement accessibility features on elements (e.g. `tabindex="0"`, `aria-label`, `@click`+`@keydown`)
- Use `const` for functions, e.g. `const toggle = () =>`
- Define types where possible
- Prefer conditional classes over ternary operators for class attributes

**Nuxt 4 Directory Structure:**
- All client-side code is organized under `app/` directory
- `app/components/`: Vue components (auto-imported)
- `app/composables/`: Vue composables (auto-imported)
- `app/layouts/`: Layout components using `<slot />`
- `app/middleware/`: Route middleware
- `app/pages/`: File-based routing pages
- `app/plugins/`: Client/server plugins
- `app/stores/`: Pinia store management
- `app/types/`: TypeScript type definitions

**Composables Organization:**
- `app/composables/api/`: API interaction utilities
- `app/composables/ui/`: UI state management  
- `app/composables/utils/`: Business logic utilities

For detailed composables patterns, see: **[docs/frontend-patterns.md](docs/frontend-patterns.md)**

**Rendering Strategy:**
- **Default CSR** (`ssr: false`) for optimal performance
- **Selective SSR** for SEO-critical pages when needed
- **i18n Support** available (15 languages) with lazy loading

**Component Naming Conventions:**
- All component files end with `Component` suffix
- Domain-based folder structure: `app/components/auth/`, `app/components/common/`, `app/components/community/`
- Nested features organized by functionality (e.g., `app/components/common/swiper/`)

For detailed frontend system integration and API patterns, see: **[docs/frontend-patterns.md](docs/frontend-patterns.md)**

### Backend (NestJS)

**Architectural Principles:**
- Use a modular architecture with standardized structure
- Encapsulate each domain/route in its own module under `src/module/`
- One controller per primary route; additional controllers for sub‑routes
- A `dto/` folder for request/response data transfer objects
- DTOs validated with `class‑validator` and documented with Swagger
- Services for business logic and persistence with TypeORM repositories
- Entities with TypeORM for database mapping using SnakeNamingStrategy
- Multi-database support: `piki_world_db`, `piki_place_db`, `test_user_db`
- One service per entity with explicit database connection injection

For detailed backend implementation patterns, see: **[docs/backend-patterns.md](docs/backend-patterns.md)**

**Testing with Jest:**
- Write tests for every controller and service
- Write end‑to‑end tests for each API module
- Include an `admin/test` endpoint in controllers as a smoke test
- Tests follow Arrange‑Act‑Assert pattern
- Name variables inputX, mockX, actualX, expectedX

**Standard Response Validation in Tests:**
- Use helper functions from `test/test-helpers.ts` for consistent validation
- All success responses: `expectSuccessResponse<T>(response.body, dataValidator?)`
- All error responses: `expectErrorResponse(response.body, expectedErrorName?, expectedMessageContains?)`
- Client-specific validation: `expectWebClientResponse()` / `expectMobileClientResponse()`

**Test Response Format Examples:**
```typescript
// Success response validation
const response = await request(app.getHttpServer())
  .get('/endpoint')
  .expect(200);

expectSuccessResponse<DataType>(response.body, (data) => {
  expect(data).toHaveProperty('expectedField');
  expect(data.expectedField).toBe('expectedValue');
});

// Error response validation
const errorResponse = await request(app.getHttpServer())
  .post('/endpoint')
  .send(invalidData)
  .expect(400);

expectErrorResponse(errorResponse.body, 'BadRequestException', 'validation');
```

**API Development Testing:**
- Use temporary directories for test artifacts: `mkdir -p ./test-temp && curl -c ./test-temp/cookies.txt`
- Clean up cookie files after manual API testing: `rm -rf ./test-temp`
- Follow standard response validation patterns for consistency
- Test both web client (CSRF + cookies) and mobile client (`X-Client-Type: mobile`) behaviors
- Verify response format standardization: `{status: 'success'|'error', data: T}`
- Use `find . -name "cookies*.txt" -delete` to cleanup accidentally created test files

## Project Overview

This is a **Nest.js + Nuxt.js monorepo** application.

For detailed setup, commands, and architecture overview, see: **[docs/development-setup.md](docs/development-setup.md)**


## Documentation References

For detailed implementation patterns and examples:
- **[docs/development-setup.md](docs/development-setup.md)** - Environment setup, commands, and quick start guide
- **[docs/port-management.md](docs/port-management.md)** - Port cleanup commands and troubleshooting guide
- **[docs/frontend-patterns.md](docs/frontend-patterns.md)** - Vue/Nuxt patterns, API plugin, and loading system
- **[docs/backend-patterns.md](docs/backend-patterns.md)** - NestJS patterns, ConfigService, and database connections
- **[docs/api-communication.md](docs/api-communication.md)** - Complete API communication flow and data format standards
- **[docs/auth-security-architecture.md](docs/auth-security-architecture.md)** - Authentication, security, and CSRF protection patterns



## Authentication & Security Quick Reference

**Core Security Architecture:**
- **JWT Dual-Token**: Access Token (15min, Bearer) + Refresh Token (12hr, HttpOnly Cookie)
- **Smart CSRF Protection**: Auth Store integrated double-submit pattern with 10-minute token lifecycle
- **Mobile Client Support**: Automatic CSRF bypass for mobile apps via X-Client-Type header
- **Auto Features**: Token refresh, retry logic, cross-tab session sync, loading states, exponential backoff
- **Unified Security**: CSRF and Auth managed in single Pinia store for consistency and SSR safety

**Key Files for Auth/Security:**
- **Backend**: `/backend/src/module/auth/`, `/backend/src/module/security/`
- **Frontend**: `app/plugins/api.ts`, `app/stores/auth.ts` (includes CSRF), `app/composables/utils/useCsrf.ts` (Auth Store proxy)

For complete authentication and security details, see: **[docs/auth-security-architecture.md](docs/auth-security-architecture.md)**

## API Communication Architecture

**Standardized Response Format:**
```typescript
// Backend: { status: 'success', data: T } | { status: 'error', data: { name: string, message: string } }
// Frontend: type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
```

**Key API Functions:**
```typescript
const result = await useApi<T>('/endpoint', body);        // POST with auto-loading
const result = await useApiGet<T>('/endpoint', params);   // GET with auto-loading
const result = await useServerApiGet<T>('/endpoint');     // SSR-safe GET
```

For detailed API communication patterns, see: **[docs/api-communication.md](docs/api-communication.md)**

## Development Port Management

**Standard Ports:**
- **Backend**: 3020 (`cd backend && npm run local`)
- **Frontend**: 3000 (`cd frontend && npm run local`)

## Environment Management

**Environment Files Structure:**
```
# Backend environments
backend/.env.local          # Local development
backend/.env.development    # Development server
backend/.env.production     # Production server

# Frontend environments  
frontend/.env.local         # Local development with proxy
frontend/.env.development   # Development build
frontend/.env.production    # Production build
```

**Key Environment Variables:**
- `NODE_ENV`: Determines runtime environment (local/development/production)
- `NUXT_API_BASE_URL`: Backend API URL for frontend requests
- `DB_*`: Multi-database connection settings for different data sources
- `JWT_*_SECRET`: JWT token secrets for access/refresh tokens
- `CSRF_*`: CSRF protection configuration parameters

**Port Cleanup:**
For detailed port management commands and troubleshooting, see: **[docs/port-management.md](docs/port-management.md)**

**Quick Commands:**
```powershell
# Windows: Kill Node.js processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Linux/macOS: Kill processes by port
kill -9 $(lsof -ti :3000 :3020 :3001) 2>/dev/null
```