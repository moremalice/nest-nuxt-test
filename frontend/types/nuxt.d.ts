// types/nuxt.d.ts
import type { ExtendedApi } from '~/plugins/api'

declare module '#app' {
  interface NuxtApp {
    $api: ExtendedApi
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $api: ExtendedApi
  }
}

export {}