<!-- components/swiper/PikiTalkSwiperComponent.vue -->
<script setup lang="ts">
import { Autoplay, Pagination } from 'swiper/modules'

const { t } = useI18n()
const swiperModules = [Autoplay, Pagination]

const bulletLabels = computed(() => [
  t('p_talk_06_1_1'),
  t('p_talk_06_2_1'),
  t('p_talk_06_3_1')
])

const swiperConfig = computed(() => ({
  spaceBetween: 30,
  slidesPerView: 'auto',
  autoplay: {
    delay: 10000,
    disableOnInteraction: false,
  },
  loop: true,
  centeredSlides: true,
  pagination: {
    el: '.pikitalk-slider .pagination',
    clickable: true,
    renderBullet: (index: number, className: string) => {
      return `<div class="${className}"><span>${bulletLabels.value[index]}</span></div>`
    }
  }
}))

const slides = computed(() => [
  {
    id: 1,
    title: t('p_talk_06_1_1'),
    mainText: t('p_talk_06_1_2'),
    subText: t('p_talk_06_1_3'),
    image: '/img/content/talk/talk_slide_01.png',
    icon: '/img/content/talk/icon_slide_log_talk.png',
    dark: false
  },
  {
    id: 2,
    title: t('p_talk_06_2_1'),
    mainText: t('p_talk_06_2_2'),
    subText: t('p_talk_06_2_3'),
    image: '/img/content/talk/talk_slide_02.png',
    icon: '/img/content/talk/icon_slide_log_talk2.png',
    dark: false
  },
  {
    id: 3,
    title: t('p_talk_06_3_1'),
    mainText: t('p_talk_06_3_2'),
    subText: t('p_talk_06_3_3'),
    image: '/img/content/talk/talk_slide_03.png',
    icon: '/img/content/talk/icon_slide_log_talk3.png',
    dark: true
  }
])

</script>

<template>
  <div class="pikitalk-slider">
    <CustomSwiperComponent
        :slides="slides"
        :modules="swiperModules"
        :swiper-options="swiperConfig"
        :show-pagination="true"
        pagination-class="pagination"
    >
      <template #slide="{ slide }">
        <div
            class="slide_wrap"
            :class="{ 'slide_dark': slide.dark }"
            :style="`background-image:url('${slide.image}')`"
            :data-talk="slide.title"
        >
          <div class="text_box">
            <b class="sort">{{ slide.title }}</b>
            <div class="detail">
              <i><img :src="slide.icon" alt=""></i>
              <p class="main_text" v-html="slide.mainText"></p>
              <p class="sub_text" v-html="slide.subText"></p>
            </div>
          </div>
        </div>
      </template>
    </CustomSwiperComponent>
    <div id="features"></div>
  </div>
</template>
