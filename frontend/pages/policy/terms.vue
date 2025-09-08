<!-- pages/policy/terms.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'policy'
})

interface TermsData {
  idx: number
  change_dt: string
  contents: string
}

const { t, locale } = useI18n()
const isDropdownOpen = ref(false)
const termsList = ref<TermsData[]>([])
const selectedTerms = ref<TermsData | null>(null)
const selectedIndex = ref(0)

const dynamicMinHeight = computed(() => {
  // selectedTerms가 null이 아닐 때만 contents 접근
  if (!selectedTerms.value?.contents || selectedTerms.value.contents.trim() === '') {
    if (isDropdownOpen.value) {
      const dropdownItemHeight = 40
      const dropdownPadding = 32
      const baseHeight = 200
      return `${(termsList.value.length * dropdownItemHeight) + dropdownPadding + baseHeight}px`
    }
    return '200px'
  }
  return 'auto'
})

// 이용약관 상세 조회
const selectTerms = async (termsIdx: number) => {
    const response = await useApi<TermsData>('/policy/getTermsDetail', {
    idx: Number(termsIdx),
    lang: locale.value
  })

  if (response.status === 'success') {
    selectedTerms.value = response.data
    selectedIndex.value = termsList.value.findIndex((term: TermsData) => term.idx === termsIdx)
    isDropdownOpen.value = false
  } else {
    handleApiError(response.data)

    selectedTerms.value = null
    selectedIndex.value = -1
    isDropdownOpen.value = false
  }
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

// 이용약관 목록 조회
const loadTermsList = async () => {
    const response = await useApi<TermsData[]>('/policy/getTermsList', {
    lang: locale.value,
    view_type: 'talk'
  })

  if (response.status === 'success') {
    termsList.value = response.data
    if (response.data.length > 0) {
      await selectTerms(response.data[0].idx)
    } else {
      selectedTerms.value = null
      selectedIndex.value = 0
    }
  } else {
    handleApiError(response.data)
  }
}

watch(locale, async () => {
  await loadTermsList()
})

onMounted(async () => {
  await loadTermsList()

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
            {{ selectedIndex === 0 ? t('policy_tab_06') + ' ' : '' }}{{ formatTDate(selectedTerms?.change_dt) }}{{ selectedIndex === 0 ? ' ' + t('policy_tab_07') : '' }}
          </button>
          <div
              id="myDropdown"
              class="dropdown-content"
              :class="{ show: isDropdownOpen }"
          >
            <a
                v-for="(term, index) in termsList"
                :key="term.idx"
                href="javascript:void(0)"
                class="terms_change_dt"
                @click="selectTerms(term.idx)"
            >
              {{ index === 0 ? t('policy_tab_06') + ' ' : '' }}{{ formatTDate(term.change_dt) }}{{ index === 0 ? ' ' + t('policy_tab_07') : '' }}
            </a>
          </div>
        </div>
      </div>
      <div
          class="policy-txt"
          id="terms_contents"
          :style="{ minHeight: dynamicMinHeight }"
          v-html="selectedTerms?.contents">
      </div>
    </div>
  </div>
</template>
