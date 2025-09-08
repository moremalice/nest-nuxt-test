# Development Environment Setup

## Project Structure Overview

This is a **Nest.js + Nuxt.js monorepo** with the following structure:

```
nest-nuxt-app-test/
├── backend/           # NestJS API server
├── frontend/          # Nuxt.js client application  
├── docs/             # Architecture documentation
└── CLAUDE.md         # AI assistant guidelines
```

## Environment Configuration

### Backend Environment Files
**Environment Loading Priority:** `.env.${NODE_ENV}` → `.env.local` → `.env`

**Available Environment Files:**
- `.env.local` - Local development environment
- `.env.development` - Development server environment  
- `.env.production` - Production environment

**ConfigService Pattern:**
The backend uses `@nestjs/config` with factory pattern for type-safe environment variable access:

```typescript
// All configurations use ConfigService injection
export const exampleConfig = {
  factory: (configService: ConfigService) => ({
    port: configService.get<number>('PORT', 3020),
    nodeEnv: configService.get<string>('NODE_ENV', 'local')
  })
};
```

**Key Environment Variables:**
- **Server**: `PORT`, `SERVER_HOST`, `NODE_ENV`
- **Databases**: `DB_WORLD_*`, `DB_PLACE_*`, `DB_TEST_USER_*` (triple MySQL connections)
- **Security**: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CSRF_SECRET`
- **External Services**: `PIKI_DOMAIN`, `PIKI_TALK_DOMAIN`

### Frontend Environment Files
**Runtime Configuration:**
Frontend uses Nuxt's runtime config with `NUXT_PUBLIC_*` prefix for client-side access:

**Local Development (`.env.local`):**
```
NUXT_PUBLIC_BASE_URL=http://localhost:3020
```

**Development (`.env.development`):**  
```
NUXT_PUBLIC_BASE_URL=http://localhost:3020
```

**Automatic API Integration:**
The frontend automatically connects to the backend through the API plugin (`plugins/api.ts`) which:
- Auto-manages loading states for all API calls
- Handles JWT token injection and refresh
- Manages CSRF token generation and validation

## Quick Start Commands

### Initial Setup
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Development Servers
```bash
# Terminal 1: Start backend (port 3020)
cd backend
npm run local        # Uses .env.local
# or
npm run dev          # Uses .env.development

# Terminal 2: Start frontend (port 3000)  
cd frontend
npm run local        # Uses .env.local
# or
npm run dev          # Uses .env.development
```

### Production Build
```bash
# Backend
cd backend && npm run build

# Frontend  
cd frontend && npm run build
```

## Available Scripts

### Backend Scripts
- `npm run local` - Local development with hot reload
- `npm run dev` - Development environment with hot reload  
- `npm run build` - Production build
- `npm run lint` - ESLint with auto-fix
- `npm run format` - Prettier formatting
- `npm run test` - Unit tests
- `npm run test:e2e` - End-to-end tests
- `npm run test:cov` - Test coverage

### Frontend Scripts  
- `npm run local` - Local development server (uses `.env.local`)
- `npm run dev` - Development server (uses `.env.development`)
- `npm run build` - Production build with optimizations
- `npm run generate` - Static site generation (pre-rendered)
- `npm run preview` - Preview production build locally

## Server Management

### Stopping Servers Safely
When development servers need to be terminated:

```bash
# Method 1: Use Ctrl+C in terminal (preferred)
# Press Ctrl+C in the terminal running the server

# Method 2: Force kill all Node.js processes (most reliable)
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

# Verify ports are free (should return 'False')
powershell -Command "Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet"
powershell -Command "Test-NetConnection -ComputerName localhost -Port 3020 -InformationLevel Quiet"
```

## Key Technologies

### Backend Stack
- **NestJS** - Node.js framework with TypeScript and modular architecture
- **@nestjs/config** - Environment configuration with factory pattern
- **TypeORM** - Database ORM with triple MySQL connections
- **MySQL** - Primary database (world/place/test environments)
- **JWT** - Authentication with refresh tokens (15min/7day)
- **CSRF-CSRF** - CSRF protection with configurable strictness
- **Swagger** - API documentation (available at `/api` in development)
- **Jest** - Testing framework with e2e support

### Frontend Stack  
- **Nuxt.js 3** - Vue.js framework with full CSR configuration
- **Vue 3** - Frontend framework with Composition API
- **Pinia** - State management with readonly pattern
- **@nuxtjs/i18n** - Internationalization (15 languages, lazy loading)
- **Tailwind CSS** - Utility-first CSS framework (configured in nuxt.config.ts)
- **Swiper** - Touch slider component with custom wrapper
- **Auto-Loading System** - Automatic loading states via API plugin

## Automatic Loading Management

**Frontend Loading System:**
The application features automatic loading state management:

1. **API Plugin Integration** (`plugins/api.ts`):
   - Automatically shows loading on request start
   - Automatically hides loading on response/error
   - No manual loading state management required

2. **LoadingComponent** (`components/common/LoadingComponent.vue`):
   - Integrated in all layouts (`default.vue`, `policy.vue`)
   - Uses Teleport to render directly to body
   - Connected to global `useLoadingUI()` composable

3. **Usage Pattern:**
   ```typescript
   // Loading is handled automatically
   const result = await useApi<T>('/endpoint', data);
   // Loading automatically hidden after response
   ```