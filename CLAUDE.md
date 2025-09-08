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
- Use standard CSS by default; use Tailwind classes only when explicitly requested
- Use descriptive variable and function/const names
- Event handlers prefixed with `handle`, e.g. `handleClick`, `handleKeyDown`
- Implement accessibility features on elements (e.g. `tabindex="0"`, `aria-label`, `@click`+`@keydown`)
- Use `const` for functions, e.g. `const toggle = () =>`
- Define types where possible
- Prefer conditional classes over ternary operators for class attributes

**Composables Organization:**
- `api/`: API interaction utilities
- `ui/`: UI state management  
- `utils/`: Business logic utilities

For detailed composables patterns, see: **[docs/frontend-patterns.md](docs/frontend-patterns.md)**

**Rendering Strategy:**
- **Default CSR** (`ssr: false`) for optimal performance
- **Selective SSR** for SEO-critical pages when needed
- **i18n Support** available (15 languages) but used only when required

**Component Naming Conventions:**
- All component files end with `Component` suffix
- Domain-based folder structure: `auth/`, `common/`, `community/`
- Nested features organized by functionality (e.g., `common/swiper/`)

For detailed frontend system integration and API patterns, see: **[docs/frontend-patterns.md](docs/frontend-patterns.md)**

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

For detailed backend implementation patterns, see: **[docs/backend-patterns.md](docs/backend-patterns.md)**

**Testing with Jest:**
- Write tests for every controller and service
- Write end‑to‑end tests for each API module
- Include an `admin/test` endpoint in controllers as a smoke test
- Tests follow Arrange‑Act‑Assert pattern
- Name variables inputX, mockX, actualX, expectedX

## Project Overview

This is a **Nest.js + Nuxt.js monorepo** test application.

For detailed setup, commands, and architecture overview, see: **[docs/development-setup.md](docs/development-setup.md)**


## Documentation References

For detailed implementation patterns and examples:
- **[docs/development-setup.md](docs/development-setup.md)** - Environment setup, commands, and quick start guide
- **[docs/frontend-patterns.md](docs/frontend-patterns.md)** - Vue/Nuxt patterns, API plugin, and loading system
- **[docs/backend-patterns.md](docs/backend-patterns.md)** - NestJS patterns, ConfigService, and database connections
- **[docs/api-communication.md](docs/api-communication.md)** - Complete API communication flow and data format standards
- **[docs/auth-security-architecture.md](docs/auth-security-architecture.md)** - Authentication, security, and CSRF protection patterns



## Authentication & Security Quick Reference

**Core Security Architecture:**
- **JWT Dual-Token**: Access Token (15min, Bearer) + Refresh Token (12hr, HttpOnly Cookie)
- **CSRF Protection**: Double-submit cookie pattern with automatic token management
- **Auto Features**: Token refresh, retry logic, cross-tab session sync, loading states

**Key Files for Auth/Security:**
- **Backend**: `/backend/src/module/auth/`, `/backend/src/module/security/`
- **Frontend**: `plugins/api.ts`, `stores/auth.ts`, `composables/utils/useCsrf.ts`

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