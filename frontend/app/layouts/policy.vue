<!-- layouts/policy.vue -->
<template>
  <slot />
  <LoadingComponent />
</template>

<script setup>
// 정책 페이지 전용 SEO 적용
applySEO()
</script>
