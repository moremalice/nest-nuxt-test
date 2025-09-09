<!-- pages/community/faq/index.vue -->
<script setup lang="ts">
interface FaqItem {
  idx: number
  question: string
  answer: string
  open?: boolean
}

interface FaqListData {
  faq_list: FaqItem[]
}

const { locale } = useI18n()

const faqList = ref<FaqItem[]>([])
const heights = ref<Record<number, number>>({})
const faqBodyRefs = ref<HTMLElement[]>([])

const langCode = ref(locale.value)

const fetchFaqList = async () => {
  const response = await useApi<FaqListData>('/community/getFaqList', {
    lang: langCode.value,
  })

  if (response.status === 'success') {
    faqList.value = response.data.faq_list.map(faq => ({ ...faq, open: false }))
    await nextTick()
    measureHeights()
  } else {
    handleApiError(response.data)

    faqList.value = []
    heights.value = {}
  }
}

const measureHeights = () => {
  heights.value = {}
  faqBodyRefs.value.forEach(el => {
    if (!el) return
    const idxAttr = el.getAttribute('data-idx')
    if (!idxAttr) return
    const idx = Number(idxAttr)
    heights.value[idx] = el.scrollHeight
  })
}

watch(locale, (newLocale) => {
  langCode.value = newLocale
  fetchFaqList()
})

watch(faqList, async () => {
  await nextTick()
  measureHeights() // 렌더링 완료 후 높이 재계산
})

const toggleAccordion = async (idx: number) => {
  const target = faqList.value.find(faq => faq.idx === idx)
  if (target) {
    target.open = !target.open
    await nextTick()
    measureHeights()
  }
}

onMounted(() => {
  fetchFaqList()
})
</script>

<template>
  <div id="container" class="community">
    <CommunityTabComponent />
    <div class="cont_area">
      <div class="faq_accordion">
        <div v-if="faqList.length > 0">
          <div v-for="faq in faqList" :key="faq.idx" class="accordion-item multi-item">
            <div class="accordion-head" @click="toggleAccordion(faq.idx)" :class="{ active: faq.open }">
              <p>{{ faq.question }}</p>
            </div>
            <div class="accordion-body multi-body" :style="{ maxHeight: faq.open ? heights[faq.idx] + 'px' : '0' }">
              <div class="accordion-body-cnt" ref="faqBodyRefs" :data-idx="faq.idx" v-html="faq.answer"/>
            </div>
          </div>
        </div>
        <div v-else>
          <p>{{ langCode === 'ko' ? '등록된 FAQ가 없습니다.' : 'No FAQ available.' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
