<!-- layouts/default.vue -->
<template>
  <HeaderComponent />
  <slot />
  <LoadingComponent />
  <FooterComponent />
</template>

<script setup>
// 기본 SEO 자동 적용
applySEO()
</script>