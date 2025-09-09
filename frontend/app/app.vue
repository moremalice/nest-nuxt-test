<!-- ~/app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const route = useRoute()
const { locales } = useI18n()

/* -------- CSRF -------- */
initializeCsrfManagement()

/*/!* -------- 다국어 처리시 -------- *!/
useHead({
  link: computed(() => {
    if (!locales.value || locales.value.length === 0) return []

    const links: Array<{ rel: string; hreflang: string; href: string }> = []

    for (const loc of locales.value) {
      const localeCode = typeof loc === 'string' ? loc : loc.code
      const localeIso = typeof loc === 'string'
          ? loc
          : (typeof loc.iso === 'string' ? loc.iso : loc.code)

      links.push({
        rel: 'alternate',
        hreflang: localeIso,
        href: `https://pikitalk.com${route.path}`
      })
    }

    links.push({
      rel: 'alternate',
      hreflang: 'x-default',
      href: `https://pikitalk.com${route.path}`
    })

    return links
  })
})*/
</script>
