# Nuxt 4 Migration Guide (Frontend Only, API Excluded) — nuxt4 branch
**Scope**: `frontend/` only. Keep your NestJS API response format (via `http-exception.filter.ts`, `transform.interceptor.ts`) and the current frontend API handling **as-is**.  
**Goal**: Align with Nuxt 4 standard structure and settings while preserving behavior. Improve performance, security, and DX without breaking API flows.

---

## 1) Directory Layout (required)
Nuxt 4 embraces an **`app/`-centric** structure. Client + SSR code goes under `app/`, and server handlers under `server/`.

```
frontend/
├─ app/
│  ├─ app.vue
│  ├─ assets/
│  │  ├─ css/
│  │  ├─ images/
│  │  └─ fonts/
│  ├─ components/
│  ├─ composables/
│  ├─ layouts/
│  ├─ middleware/
│  ├─ pages/
│  └─ plugins/          # Use .client.ts / .server.ts suffixes
├─ public/              # Served as-is
├─ server/              # Nitro (use minimally if Nest is the main API)
├─ nuxt.config.ts
├─ app.config.ts (opt)
└─ tsconfig.json
```

**Actions**
- Move `components/`, `composables/`, `layouts/`, `middleware/`, `pages/`, `plugins/` into `app/`.
- Fix imports: `~/app/...` → `~/...` because `~`/`@` point to `app/` in Nuxt 4.
- Keep truly static files (favicon, robots, sitemap, downloads) in `public/`.

---

## 2) nuxt.config.ts (v4 baseline)
Focus on aliases, types, and rendering rules. This does not affect your API format.

```ts
import { resolve } from 'node:path'
export default defineNuxtConfig({
  srcDir: 'app', // explicit for readability

  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',       // v10
    // '@nuxt/image',      // optional
  ],

  alias: {
    '#shared': resolve('./shared'),
    // public: resolve('./public'), // only if you run into path confusion
  },

  typescript: { strict: true, typeCheck: true },

  routeRules: {
    '/(blog|product)/**': { isr: 300 },
    '/account/**': { cache: { swr: false, maxAge: 0 } },
    // '/map/**': { ssr: false }, // force CSR for highly interactive pages
  },

  nitro: { /* keep minimal if Nest is main API */ },
})
```

### 2.5) Assets / Public Refactor (Global CSS & Images)
If global CSS and images currently live under `public/`, **relocate** them by role:

**Recommended structure**
```
frontend/
└─ app/
   └─ assets/
      ├─ css/       # global.css, tailwind.css, main.scss, etc.
      ├─ images/    # UI images (logos, icons, backgrounds) that benefit from bundling
      └─ fonts/     # webfonts + @font-face
└─ public/
   ├─ favicon.ico
   ├─ robots.txt
   ├─ sitemap.xml
   ├─ icons/*       # PWA icons / manifest
   └─ downloads/*   # files served for download
```

**What goes where**
- **Global CSS** → `app/assets/css/`
  - Register in `nuxt.config.ts`:
    ```ts
    export default defineNuxtConfig({
      css: ['~/assets/css/main.css'], // or '~/assets/css/main.scss'
    })
    ```
  - Or import in `app/app.vue`:
    ```vue
    <script setup lang="ts">
    import '~/assets/css/main.css'
    </script>
    ```
  - With Tailwind: keep `app/assets/css/tailwind.css` and your PostCSS/Tailwind config.

- **UI images used by components/styles** → `app/assets/images/`
  - Vue template:
    ```vue
    <template><img :src="logo" alt="logo" /></template>
    <script setup lang="ts">
    import logo from '~/assets/images/logo.svg'
    </script>
    ```
  - CSS background: `background: url('~/assets/images/bg.png')`
  - In TS: `new URL('~/assets/images/foo.png', import.meta.url).href`

- **Webfonts** → `app/assets/fonts/`
  ```css
  @font-face {
    font-family: 'Inter';
    src: url('~/assets/fonts/Inter.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  ```

- **SEO/static files that must stay at stable URLs** → **stay in `public/`**
  - `favicon.ico`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`
  - Primary OG/OpenGraph image referenced by crawlers (e.g., `/og-image.png`)

- **Large files / downloads** → `public/downloads/`

- **If you plan to use Nuxt Image** for content images:
  - Keep originals in a CDN/bucket or `public/images/` and render via `<NuxtImg>`.
  - Keep **UI-sprite/icons/backgrounds** in `app/assets/images/` as they are part of the app bundle.

**Why move?**
- Files under `app/assets/**` go through **Vite**: hashed filenames, tree-shaking, better caching.
- Files under `public/**` are served **as-is** (no hashing). You must manage HTTP caching/CDN rules yourself.

**Migration steps (assets)**
1) Create `app/assets/css`, `app/assets/images`, `app/assets/fonts`  
2) Move global CSS to `app/assets/css/` and register via `nuxt.config.ts` (`css: []`) or import in `app.vue`  
3) Move UI images to `app/assets/images/` and update references to `~/assets/images/*`  
4) Move fonts to `app/assets/fonts/` and update `@font-face` URLs  
5) Keep SEO/static/download files in `public/`  
6) (Optional) Introduce `@nuxt/image` and gradually switch content images to `<NuxtImg>`

**Quick checks**
```bash
# Find templates/styles directly referencing public URLs
git grep -nE 'src="/|url\\(/' -- frontend/app frontend/public || true

# Ensure global CSS is registered
git grep -n "css:\\s*\\[" -- frontend/nuxt.config.ts || echo "Add css: [] in nuxt.config.ts"

# Ensure assets are referenced via '~/assets/'
git grep -n "~/assets/" -- frontend || echo "No assets references found (may be fine)"
```

---

## 3) Plugins / Middleware (SSR-safe)
- Use `.client.ts` / `.server.ts` suffixes for plugins.
- Router middleware in `app/middleware/*.ts`; gate browser-only APIs via `import.meta.client`.

---

## 4) i18n v10 (no `lazy`, file-based lazy loading)
With `locales[].file|files`, lazy loading happens **automatically**. Keep locale JSON files under `app/locales/`.

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    langDir: 'locales',
    locales: [
      { code: 'ko', name: 'Korean',  file: 'ko.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'ko',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
    strategy: 'prefix_and_default',
  },
})
```

---

## 5) TypeScript / Aliases / Shared code
- Define aliases in `nuxt.config.ts` (`alias`) and avoid conflicts with monorepo-level `tsconfig`.
- Keep shared utilities/types under `frontend/shared/` and import via `#shared` (no Vue/Nitro imports there).

---

## 6) Hybrid rendering with `routeRules`
- Static pages → ISR (e.g., `isr: 300`), personalized pages → disable cache.
- Interactive heavy pages → CSR (`ssr: false`) when it improves UX/TTI.

---

## 7) DevTools / RuntimeConfig / Images
- Disable DevTools in prod.
- Only expose `NUXT_PUBLIC_*` to the client; keep secrets in `runtimeConfig` (server-only).
- Consider `@nuxt/image` for runtime image optimization and caching.

---

## 8) Tests & Regression
- Use Nuxt Test Utils + Vitest; mock plugins as needed.
- If using Layers later, start with a single-app test baseline first.

---

## 9) Migration order
1. Branch `nuxt4/structure-align`
2. Move to `app/` + fix imports
3. Split plugins by context (SSR-safety)
4. i18n v10 with file-based locales (no `lazy` option)
5. `routeRules` for ISR/CSR/cache
6. Disable DevTools in prod, clean env exposure
7. E2E/accessibility/perf regression
8. Merge PR with checklist

---

## 10) PR Checklist
- [ ] `app/` structure complete, no stray dirs left
- [ ] No `~/app/` imports; use `~/` instead
- [ ] Plugins have `.client.ts`/`.server.ts`
- [ ] i18n uses file-based lazy loading (no `lazy` option)
- [ ] `routeRules` applied for ISR/CSR/cache
- [ ] DevTools disabled in prod
- [ ] Only `NUXT_PUBLIC_*` exposed to client
- [ ] Build artifacts (SSR) deploy as expected
