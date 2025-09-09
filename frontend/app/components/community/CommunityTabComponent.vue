<!-- component/community/CommunityTabComponent.vue -->
<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()

// 활성 탭 판단용 계산 속성
const isNotice = computed(() => route.path.startsWith('/community/notice'))
const isFaq = computed(() => route.path.startsWith('/community/faq'))
</script>

<template>
  <h2 class="community_h2">Customer Support</h2>
  <ul class="list">
    <li :class="{ is_on: isNotice }">
      <NuxtLink to="/community/notice" class="btn">{{ t('community_tab_01') }}</NuxtLink>
    </li>
    <li :class="{ is_on: isFaq }">
      <NuxtLink to="/community/faq" class="btn">FAQ</NuxtLink>
    </li>
  </ul>
</template>
