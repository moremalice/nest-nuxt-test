# Nuxt 4 Directory Structure Guide

## Overview

Nuxt 4 introduces a significant reorganization of the directory structure, with the most notable change being the introduction of the `app/` directory. This provides a clear separation between application code and server-side code, improving organization and performance.

## Key Changes from Nuxt 3 to Nuxt 4

### 🆕 New `app/` Directory
The most significant change is that many client-side directories are now nested under the `app/` folder, providing clear distinction between:
- **App Environment**: Code that runs in the Vue application
- **Server Environment**: Code that runs on the Nitro server

### 🔄 Backwards Compatibility
Nuxt 4 maintains backwards compatibility - you can continue using the Nuxt 3 structure if preferred. However, migrating to the new structure provides performance benefits and better organization.

## Nuxt 4 Standard Directory Structure

```
project-root/
├── .output/                    # Build output (generated)
├── .nuxt/                     # Nuxt build files (generated)
├── app/                       # 🆕 Main application directory
│   ├── assets/                # Raw assets (images, styles, etc.)
│   ├── components/            # Vue components (auto-imported)
│   ├── composables/           # Vue composables (auto-imported)
│   ├── layouts/               # Layout components
│   ├── middleware/            # Route middleware
│   ├── pages/                 # File-based routing pages
│   ├── plugins/               # Plugins (client/server)
│   ├── utils/                 # Utility functions (auto-imported)
│   ├── app.config.ts         # App-level configuration
│   ├── app.vue               # Root Vue component
│   ├── error.vue             # Error page component
│   └── router.options.ts     # Vue Router options
├── content/                   # Nuxt Content files
├── layers/                    # Nuxt Layers
├── modules/                   # Local Nuxt modules
├── public/                    # Static assets
├── server/                    # Server-side code
│   ├── api/                   # API routes
│   ├── middleware/            # Server middleware
│   ├── plugins/               # Server plugins
│   ├── routes/                # Custom server routes
│   └── utils/                 # Server utilities
├── shared/                    # 🆕 Shared code (client + server)
├── nuxt.config.ts            # Nuxt configuration
├── package.json              # Project dependencies
└── ...
```

## Migration Guide

### Phase 1: Pre-Migration Analysis

1. **Inventory Current Structure**: Document existing directories and files
2. **Identify Dependencies**: Check for hardcoded paths in configuration files
3. **Plan Backup Strategy**: Create migration branch for safe rollback

### Phase 2: Directory Migration

#### Step 1: Create `app/` Directory
```bash
mkdir frontend/app
```

#### Step 2: Move Client-Side Directories
```bash
# Move core Vue application directories
mv frontend/assets frontend/app/
mv frontend/components frontend/app/
mv frontend/composables frontend/app/
mv frontend/layouts frontend/app/
mv frontend/middleware frontend/app/
mv frontend/pages frontend/app/
mv frontend/plugins frontend/app/
mv frontend/utils frontend/app/

# Move configuration files
mv frontend/app.vue frontend/app/
mv frontend/error.vue frontend/app/         # If exists
mv frontend/app.config.ts frontend/app/     # If exists
```

#### Step 3: Keep Root-Level Directories
These directories remain at the project root:
- `public/` - Static assets
- `server/` - Server-side code (if exists)
- `content/` - Content files (if using @nuxt/content)
- `locales/` - i18n translation files
- `nuxt.config.ts` - Main configuration

### Phase 3: Configuration Updates

#### Update `nuxt.config.ts`
No changes required for basic migration - Nuxt 4 automatically detects the `app/` directory.

#### Optional: Explicit Configuration
```typescript
export default defineNuxtConfig({
  dir: {
    app: 'app'  // Explicitly set app directory (default)
  }
})
```

#### Update Third-Party Configurations
Update paths in configuration files that reference moved directories:
- Tailwind CSS configuration
- ESLint configuration
- TypeScript paths
- IDE settings

### Phase 4: Code Updates

#### Layout Migration
```vue
<!-- OLD: layouts/default.vue -->
<template>
  <div>
    <Nuxt />  <!-- Old component -->
  </div>
</template>

<!-- NEW: app/layouts/default.vue -->
<template>
  <div>
    <slot />  <!-- New slot-based approach -->
  </div>
</template>
```

#### Page Metadata Updates
```vue
<!-- OLD: Nuxt 3 style -->
<script>
export default {
  layout: 'custom',
  middleware: 'auth'
}
</script>

<!-- NEW: Nuxt 4 style -->
<script setup>
definePageMeta({
  layout: 'custom',      // kebab-case: 'custom-layout' -> 'custom-layout'
  middleware: 'auth'
})
</script>
```

## Benefits of New Structure

### 🚀 Performance Improvements
- **Enhanced File Watching**: Optimized Chokidar capabilities for faster development
- **Better Tree-Shaking**: Clear separation enables better build optimization
- **Improved Hot Reload**: More efficient file change detection

### 🏗️ Better Organization
- **Clear Separation**: Client vs server code distinction
- **Modular Structure**: Each concern has its dedicated space
- **Scalability**: Easier to manage large applications

### 🔧 Enhanced Developer Experience
- **Consistent Auto-Imports**: All client-side utilities auto-imported from `app/`
- **Intuitive Structure**: Logical grouping of related functionality
- **IDE Support**: Better IntelliSense and path resolution

## Directory-Specific Guidelines

### `app/components/`
- All Vue components are auto-imported
- Supports lazy loading with `Lazy` prefix
- Use nested folders for organization
- Example: `app/components/ui/Button.vue` -> `<UiButton />`

### `app/composables/`
- Auto-imported Vue composables
- Use `use*` naming convention
- Can be organized in subdirectories
- Example: `app/composables/useAuth.ts` -> `useAuth()`

### `app/layouts/`
- Layout components with `<slot />` for content
- Auto-imported with kebab-case names
- Must have single root element for transitions
- Default layout: `app/layouts/default.vue`

### `app/middleware/`
- Route middleware functions
- Auto-imported by filename
- Can be applied globally or per-route
- Example: `app/middleware/auth.ts` -> `middleware: 'auth'`

### `app/pages/`
- File-based routing structure
- Supports dynamic routes with `[]` syntax
- Must have single root element for transitions
- Use `definePageMeta()` for page configuration

### `app/plugins/`
- Client and server plugins
- Auto-registered based on filename
- `.client.ts` for client-only plugins
- `.server.ts` for server-only plugins

### `shared/`
- Code accessible from both client and server
- Useful for type definitions and utilities
- Auto-imported in both environments

## Migration Checklist

### Pre-Migration
- [ ] Create backup branch
- [ ] Document current directory structure
- [ ] Identify hardcoded paths in configs
- [ ] Plan migration timeline

### Migration
- [ ] Create `app/` directory
- [ ] Move client-side directories to `app/`
- [ ] Update layout components to use `<slot />`
- [ ] Update page metadata with `definePageMeta()`
- [ ] Update third-party configuration paths
- [ ] Test auto-imports functionality

### Post-Migration
- [ ] Verify all pages load correctly
- [ ] Test component auto-imports
- [ ] Validate middleware functionality
- [ ] Check build process
- [ ] Update documentation
- [ ] Train team on new structure

## Common Migration Issues

### Import Path Updates
```typescript
// OLD: Direct imports
import MyComponent from '~/components/MyComponent.vue'

// NEW: Auto-imports (no import needed)
// Just use <MyComponent /> in templates
// Or MyComponent in script setup
```

### Layout Slot Changes
```vue
<!-- OLD -->
<template>
  <div>
    <Nuxt />
  </div>
</template>

<!-- NEW -->
<template>
  <div>
    <slot />
  </div>
</template>
```

### Configuration File Paths
```javascript
// OLD: tailwind.config.js
content: [
  './components/**/*.{js,vue,ts}',
  './layouts/**/*.vue',
  './pages/**/*.vue'
]

// NEW: tailwind.config.js
content: [
  './app/components/**/*.{js,vue,ts}',
  './app/layouts/**/*.vue',
  './app/pages/**/*.vue'
]
```

## Best Practices

### 1. Gradual Migration
- Migrate one directory at a time
- Test functionality after each migration step
- Keep migration commits small and focused

### 2. Maintain Consistency
- Follow Nuxt 4 naming conventions
- Use kebab-case for multi-word components
- Organize related files together

### 3. Leverage Auto-Imports
- Remove manual imports for auto-imported items
- Use TypeScript for better auto-completion
- Organize composables and utils logically

### 4. Update Documentation
- Document new structure for team members
- Update deployment scripts if needed
- Review and update README files

## Rollback Strategy

If migration issues arise:

1. **Revert to Previous Branch**
   ```bash
   git checkout previous-branch
   ```

2. **Selective Rollback**
   ```bash
   # Move directories back to root
   mv app/components ./
   mv app/layouts ./
   # ... etc
   ```

3. **Hybrid Approach**
   Keep some directories in `app/` and others at root level during transition period.

## Performance Monitoring

After migration, monitor:
- **Build Times**: Should improve with better tree-shaking
- **Dev Server Startup**: Enhanced file watching performance
- **Hot Reload Speed**: Faster change detection
- **Bundle Size**: Better optimization opportunities

## Conclusion

Migrating to Nuxt 4's new directory structure provides significant benefits in terms of organization, performance, and developer experience. While the migration requires careful planning and execution, the improved structure will make the application more maintainable and scalable in the long term.

The key to successful migration is taking it step by step, testing thoroughly at each stage, and leveraging Nuxt 4's backwards compatibility during the transition period.