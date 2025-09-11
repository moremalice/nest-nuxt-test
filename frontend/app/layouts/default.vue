<!-- layouts/default.vue -->
<template>
  <HeaderComponent />
  <!-- 개발 환경에서만 보안 체크 컴포넌트 표시 -->
<!--  <SecurityCheckComponent />-->
  <slot />
  <LoadingComponent />
  <FooterComponent />
</template>

<script setup>
// 기본 SEO 자동 적용
applySEO()
</script>