<!-- components/common/swiper/CustomSwiperComponent.vue -->
<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import type { SwiperModule } from 'swiper/types'

interface SlideData {
  id?: string | number
  image?: string
  title?: string
  content?: string
  alt?: string
  slideClass?: string
  [key: string]: any
}

interface Props {
  /** 슬라이드 데이터 */
  slides: SlideData[]
  /** Swiper 모듈 (Autoplay, Pagination 등) */
  modules: SwiperModule[]
  /** Swiper 옵션 객체 */
  swiperOptions?: Record<string, any>
  /** 사용자 지정 Pagination 요소 표시 여부 */
  showPagination?: boolean
  /** Pagination 요소 클래스 */
  paginationClass?: string
}

const route = useRoute()
const { locale } = useI18n()

const props = withDefaults(defineProps<Props>(), {
  swiperOptions: () => ({}),
  showPagination: false,
  paginationClass: 'swiper-pagination'
})

const emit = defineEmits<{
  /** Swiper 인스턴스 전달 */
  swiper: [swiper: any]
  /** 슬라이드 변경 */
  slideChange: [swiper: any]
}>()

const swiperRef = ref<any | null>(null)

const handleSwiper = (swiper: any) => {
  swiperRef.value = swiper
  emit('swiper', swiper)
}

const handleSlideChange = (swiper: any) => emit('slideChange', swiper)

/* 라우트 변경(다른 페이지 → 돌아오기) */
watch(
    () => route.fullPath,
    () => nextTick(() => swiperRef.value?.update?.())
)

/* 언어 변경(페이징 bullet 라벨 등 즉시 반영) */
watch(locale, () => swiperRef.value?.update?.())

/* 컴포넌트 언마운트 시 메모리 정리 */
onBeforeUnmount(() => swiperRef.value?.destroy?.(true, true))
</script>

<template>
  <div class="custom-swiper-container">
    <!-- 외부 위치에 별도 만들어야 할 때만 div 사용 -->
    <div v-if="showPagination" :class="paginationClass"></div>

    <ClientOnly>
      <Swiper
          :modules="modules"
          :observer="true"
          :observe-parents="true"
          v-bind="swiperOptions"
          @swiper="handleSwiper"
          @slideChange="handleSlideChange"
      >
        <SwiperSlide
            v-for="(slide, i) in slides"
            :key="slide.id ?? i"
            :class="slide.slideClass"
        >
          <slot name="slide" :slide="slide" :index="i">
            <!-- 기본 템플릿 (슬롯 미사용 시) -->
            <div class="default-slide">
              <img v-if="slide.image" :src="slide.image" :alt="slide.alt || ''" />
              <div v-if="slide.title" class="slide-title">{{ slide.title }}</div>
              <div
                  v-if="slide.content"
                  class="slide-content"
                  v-html="slide.content"
              ></div>
            </div>
          </slot>
        </SwiperSlide>
      </Swiper>
    </ClientOnly>
  </div>
</template>

