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

### Environment Loading Strategy
**Backend Priority:** `.env.${NODE_ENV}` → `.env.local` → `.env`  
**Frontend Priority:** Uses Nuxt's runtime config system with `NUXT_PUBLIC_*` prefix

### Backend Environment Variables

**Available Environment Files:**
- `.env.local` - Local development (NODE_ENV=local)
- `.env.development` - Development server (NODE_ENV=development)
- `.env.production` - Production environment (NODE_ENV=production)

#### Core Server Configuration
```bash
# Server Settings
NODE_ENV=local|development|production
PORT=3020
SERVER_HOST=localhost  # development: your-dev-domain.com, production: api.your-production-domain.com

# Logging Configuration
LOG_HTTP_BODY=true     # production: false
LOG_HTTP_MAX=4096      # production: 1024
```

#### Database Configuration (Triple MySQL Setup)
```bash
# Main Database (piki_world)
DB_WORLD_HOST=database-1.czlviwuaollk.ap-northeast-2.rds.amazonaws.com
DB_WORLD_PORT=3306
DB_WORLD_USERNAME=piki_world
DB_WORLD_PASSWORD=tlrmakcpdls
DB_WORLD_DATABASE=piki_world
DB_WORLD_DEV=false

# Place Database (owner_world/piki_place)
DB_PLACE_HOST=121.182.91.193  # production: database-1.czlviwuaollk.ap-northeast-2.rds.amazonaws.com
DB_PLACE_PORT=13306           # production: 3306
DB_PLACE_USERNAME=owner_world # production: piki_place
DB_PLACE_PASSWORD=tlrmakcpdls
DB_PLACE_DATABASE=owner_world # production: piki_place

# Test Database
DB_TEST_USER_HOST=121.182.91.193
DB_TEST_USER_PORT=13306
DB_TEST_USER_USERNAME=root
DB_TEST_USER_PASSWORD=tmvlemghkd
DB_TEST_USER_DATABASE=nest_test  # development: nest-test
DB_TEST_USER_DEV=false
```

#### Security Configuration
```bash
# CSRF Protection
CSRF_SECRET=environment-specific-secret-key
CSRF_COOKIE_MAX_AGE=1800000  # 30 minutes
CSRF_SIZE=128
CSRF_STRICT=false  # production: true

# JWT Authentication
JWT_ACCESS_SECRET=environment-specific-access-secret
JWT_REFRESH_SECRET=environment-specific-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=nest-nuxt-app-{env}
JWT_AUDIENCE=nest-nuxt-app-{env}

# JWT Mobile (Extended expiration)
JWT_MOBILE_ACCESS_EXPIRES_IN=30m
JWT_MOBILE_REFRESH_EXPIRES_IN=30d  # production: same
```

#### External Services
```bash
# Domain Configuration
PIKI_DOMAIN=https://marketdev.pikit.space  # production: https://piki.market
PIKI_TALK_DOMAIN=http://121.182.91.193:36382  # production: https://aritalk.pikiworld.com

# File Management
FILE_DATA_PATH=/data/
```

#### Environment-Specific Differences
**Local vs Development:**
- `SERVER_HOST`: localhost vs your-dev-domain.com
- Secrets use shorter, development-friendly values

**Development vs Production:**
- `LOG_HTTP_BODY`: true → false
- `LOG_HTTP_MAX`: 4096 → 1024
- `CSRF_STRICT`: false → true
- `PIKI_DOMAIN`: marketdev.pikit.space → piki.market
- `PIKI_TALK_DOMAIN`: HTTP with port → HTTPS domain
- Database hosts consolidated to single RDS instance
- Secrets use production-grade 64+ character strings

### Frontend Environment Variables

**Available Environment Files:**
- `.env.local` - `NUXT_PUBLIC_BASE_URL=http://localhost:3020`
- `.env.development` - `NUXT_PUBLIC_API_BASE=http://localhost:3020`
- `.env.production` - `NUXT_PUBLIC_API_BASE=https://pikitalk.com`

#### Core Frontend Configuration
```bash
# API Connection (Local)
NUXT_PUBLIC_BASE_URL=http://localhost:3020
NUXT_PUBLIC_APP_ENV=local

# API Connection (Development) 
NUXT_PUBLIC_API_BASE=http://localhost:3020
NUXT_PUBLIC_APP_ENV=development

# API Connection (Production)
NUXT_PUBLIC_API_BASE=https://pikitalk.com
NUXT_PUBLIC_APP_ENV=production
```

**Runtime Configuration Usage:**
```typescript
// nuxt.config.ts - Available in runtime
runtimeConfig: {
  public: {
    apiBase: process.env.NUXT_PUBLIC_API_BASE || process.env.NUXT_PUBLIC_BASE_URL,
    appEnv: process.env.NUXT_PUBLIC_APP_ENV
  }
}

// In components/composables
const { public: { apiBase, appEnv } } = useRuntimeConfig();
```

### ConfigService Pattern Implementation

The backend uses `@nestjs/config` with factory pattern for type-safe environment variable access:

```typescript
// All configurations use ConfigService injection pattern
export const exampleConfig = {
  factory: (configService: ConfigService) => ({
    port: configService.get<number>('PORT', 3020),
    nodeEnv: configService.get<string>('NODE_ENV', 'local'),
    isDevelopment: configService.get<string>('NODE_ENV', 'local') !== 'production'
  })
};
```

**Automatic API Integration:**
The frontend automatically connects to the backend through the API plugin (`plugins/api.ts`) which:
- Auto-manages loading states for all API calls
- Handles JWT token injection and refresh
- Manages CSRF token generation and validation
- Uses runtime config for dynamic API base URL selection

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