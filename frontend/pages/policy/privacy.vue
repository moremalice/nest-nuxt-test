<!-- pages/policy/privacy.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'policy'
})

// 타입 정의
interface PrivacyData {
  idx: number
  change_dt: string
  contents: string
}

const { t, locale } = useI18n()
const isDropdownOpen = ref(false)
const privacyList = ref<PrivacyData[]>([])
const selectedPrivacy = ref<PrivacyData | null>(null)
const selectedIndex = ref(0)

const dynamicMinHeight = computed(() => {
  // selectedPrivacy가 null이 아닐 때만 contents 접근
  if (!selectedPrivacy.value?.contents || selectedPrivacy.value.contents.trim() === '') {
    if (isDropdownOpen.value) {
      const dropdownItemHeight = 40
      const dropdownPadding = 32
      const baseHeight = 200
      return `${(privacyList.value.length * dropdownItemHeight) + dropdownPadding + baseHeight}px`
    }
    return '200px'
  }
  return 'auto'
})

// 개인정보처리방침 상세 조회
const selectPrivacy = async (privacyIdx: number) => {
    const response = await useApi<PrivacyData>('/policy/getPrivacyDetail', {
    idx: Number(privacyIdx),
    lang: locale.value
  })

  if (response.status === 'success') {
    selectedPrivacy.value = response.data
    selectedIndex.value = privacyList.value.findIndex((privacy: PrivacyData) => privacy.idx === privacyIdx)
    isDropdownOpen.value = false
  } else {
    handleApiError(response.data)
  }
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

// 개인정보처리방침 목록 조회
const loadPrivacyList = async () => {
    const response = await useApi<PrivacyData[]>('/policy/getPrivacyList', {
    lang: locale.value,
    view_type: 'talk'
  })

  if (response.status === 'success') {
    privacyList.value = response.data
    if (response.data.length > 0) {
      await selectPrivacy(response.data[0].idx)
    } else {
      selectedPrivacy.value = null
      selectedIndex.value = 0
    }
  } else {
    handleApiError(response.data)
  }
}

// 언어 변경 감지
watch(() => locale.value, async () => {
  await loadPrivacyList()
})

onMounted(async () => {
  await loadPrivacyList()

  window.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (target && !target.matches('.dropbtn')) {
      isDropdownOpen.value = false
    }
  })
})
</script>

<template>
  <div id="container" class="policy">
    <div class="cont_area">
      <div class="history">
        <span class="history_tit">{{ t('policy_tab_05') }}</span>
        <div class="dropdown">
          <button
              @click="toggleDropdown"
              id="dropdownButton"
              class="dropbtn"
              :class="{ on: isDropdownOpen }"
          >
            {{ selectedIndex === 0 ? t('policy_tab_06') + ' ' : '' }}{{ formatTDate(selectedPrivacy?.change_dt) }}{{ selectedIndex === 0 ? ' ' + t('policy_tab_07') : '' }}
          </button>
          <div
              id="myDropdown"
              class="dropdown-content"
              :class="{ show: isDropdownOpen }"
          >
            <a
                v-for="(privacy, index) in privacyList"
                :key="privacy.idx"
                href="javascript:void(0)"
                class="privacy_change_dt"
                @click="selectPrivacy(privacy.idx)"
            >
              {{ index === 0 ? t('policy_tab_06') + ' ' : '' }}{{ formatTDate(privacy.change_dt) }}{{ index === 0 ? ' ' + t('policy_tab_07') : '' }}
            </a>
          </div>
        </div>
      </div>

      <!-- 데이터가 없을 때 표시 -->
      <div v-if="!selectedPrivacy?.contents" class="policy-txt no-data" :style="{ minHeight: dynamicMinHeight }"></div>

      <!-- 데이터가 있을 때 표시 -->
      <div
          v-else
          class="policy-txt"
          id="privacy_contents"
          :style="{ minHeight: dynamicMinHeight }"
          v-html="selectedPrivacy.contents">
      </div>
    </div>
  </div>
</template>
