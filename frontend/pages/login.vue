<template>
  <div>
    <LoginFormComponent
      v-if="!showRegister"
      @switch-to-register="showRegister = true"
    />
    <RegisterFormComponent
      v-else
      @switch-to-login="showRegister = false"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  ssr: false
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const showRegister = ref(false)

// 이미 로그인된 사용자는 리다이렉트
watch(() => authStore.isAuthenticated, (authenticated) => {
  if (authenticated) {
    const returnUrl = route.query.return_url as string
    router.push(returnUrl || '/')
  }
}, { immediate: true })

// SEO 메타 태그 설정
useHead({
  title: computed(() => showRegister.value ? '회원가입 - PikiTalk' : '로그인 - PikiTalk'),
  meta: [
    { name: 'description', content: computed(() => showRegister.value ? 'PikiTalk 회원가입' : 'PikiTalk 로그인') },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>