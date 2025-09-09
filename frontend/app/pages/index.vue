<!-- pages/index.vue -->
<script setup lang="ts">
import { load } from 'js-yaml'
const { t, locale } = useI18n()
const route = useRoute()
const videoPlayer = ref<HTMLVideoElement>()
const env = useRuntimeConfig().public.NUXT_APP_ENVIRONMENT

// 비디오 소스 가져오기
const getVideoSrc = () => {
  switch(env) {
    case 'development':
      return '/api/proxy/vod/pikitalk/pikitalk.m3u8'
    case 'production':
      return 'https://pikitalk.com/data/vod/pikitalk/pikitalk.m3u8'
    default:
      return '/api/proxy/vod/pikitalk/pikitalk.m3u8'
  }
}

// YML 소스 가져오기
const getYmlSrc = (ymlName: string) => {
  switch(env) {
    case 'development':
      return `/api/proxy/${ymlName}.yml`
    case 'production':
      return `https://pikitalk.com/data/${ymlName}.yml`
    default:
      return `/api/proxy/${ymlName}.yml`
  }
}

// HLS 비디오 초기화
const initializeVideo = async () => {
  if (!import.meta.client) return

  const video = videoPlayer.value
  if (!video) return

  const videoSrc = getVideoSrc()

  try {
    const { default: Hls } = await import('hls.js')

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(videoSrc)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play()
      })
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoSrc
      video.addEventListener("loadedmetadata", () => {
        video.play()
      })
    } else {
      console.error("HLS playback is not supported in this browser.")
    }
  } catch (error) {
    console.error("Failed to load HLS:", error)
  }
}

// OS 감지 함수
const getOS = (): 'windows' | 'mac' | 'other' => {
  if (!import.meta.client) return 'other'

  const userAgent = navigator.userAgent.toLowerCase()

  if (userAgent.includes("win")) {
    return "windows"
  } else if (userAgent.includes("mac")) {
    return "mac"
  } else {
    return "other"
  }
}

// 모바일 감지 함수
const isMobile = (): boolean => {
  if (!import.meta.client) return false
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

// Mac 다운로드 함수
const downloadMac = async () => {
  const ymlName = 'latest-mac'

  if (isMobile()) {
    alert(t('download_txt_01'))
    return false
  }

  await getDownloadUrl(ymlName)
}

// 다운로드 URL 가져오기
const getDownloadUrl = async (ymlName: string) => {
  try {
    const ymlSrc = getYmlSrc(ymlName)
    const response = await $fetch(ymlSrc)
    const data = load(response)

    const dmgFileNames = data.files.find((file: any) => file.url.endsWith('.dmg'))
    const path = dmgFileNames.url

    await navigateTo(`https://pikitalk.com/data/${path}`, { external: true })
  } catch (error) {
    console.error("YML data ", error)
  }
}

/* ---------- 생명주기 ---------- */
onMounted(async () => {
  await initializeVideo()
  await handleUrlAnchor()
})
</script>

<template>
  <div id="container" class="pikitalk">
    <section class="top_visual">
      <div class="visual">
        <div class="vedio">
          <video
              ref="videoPlayer"
              autoplay
              muted
              loop
              playsinline
          ></video>
          <a
              href="https://youtu.be/ggFgYYJqx6k?si=f0Z14SlqDA7Ye-tP"
              target="_blank"
              class="btn_more btn_white_normal"
          >
            <span class="title">{{ t('common_04') }}</span>
            <i class="icon_arrow"></i>
          </a>
        </div>
        <div class="side_box">
          <div class="side_box_wrap">
            <div class="character">
              <img src="/img/content/talk/piki_section3_img01.svg" alt="">
            </div>
            <div class="float_box">
              <div class="sns_banner">
                <a href="https://www.instagram.com/official_pikitalk_global/?hl=en" target="_blank">
                  <div class="flex_box">
                    <i><img src="/img/content/talk/icon_insta_w.svg" alt=""></i>
                    <b>{{ t('common_01') }}</b>
                    <p>{{ t('common_02') }}</p>
                  </div>
                </a>
              </div>
              <div class="btn_box">
                <a :href="t('p_talk_17')" target="_blank" class="btn_white_line_sq96">
                  <img src="/img/content/piki/icon_apple.svg" alt="">
                </a>
                <a :href="t('p_talk_15')" target="_blank" class="btn_white_line_sq96">
                  <img src="/img/content/piki/icon_ggplay.svg" alt="">
                </a>
                <a
                    href="https://pikitalk.com/data/PikiTalk Setup 0.7.0.exe"
                    target="_blank"
                    class="btn_white_line_sq96"
                >
                  <img src="/img/content/talk/icon_download_win.svg" alt="">
                </a>
                <a
                    @click="downloadMac"
                    class="btn_white_line_sq96 icon_mac icon_mac mac_down_btn"
                    href="javascript:void(0)"
                >
                  <img src="/img/content/talk/icon_download_mac.svg" alt="">
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section2" id="intro">
      <div class="inner">
        <div class="float_box">
          <div class="left_box" data-aos="fade-up">
            <div class="left_inner">
              <div class="left_tit"><p>The most private messenger</p></div>
              <div class="left_main_txt" v-html="t('p_talk_01')"></div>
              <div class="left_sub_txt" v-html="t('p_talk_02')"></div>
              <div class="btn_box">
                <a :href="t('p_talk_17')" target="_blank" class="btn_white_line_sq64">
                  <img src="/img/content/piki/icon_apple.svg" alt="">
                </a>
                <a :href="t('p_talk_15')" target="_blank" class="btn_white_line_sq64">
                  <img src="/img/content/piki/icon_ggplay.svg" alt="">
                </a>
                <a
                    href="https://pikitalk.com/data/PikiTalk Setup 0.7.0.exe"
                    class="btn_layer btn_white_line_sq64 win_down_btn"
                >
                  <img src="/img/content/talk/icon_download_win.svg" alt="">
                </a>
                <a
                    @click="downloadMac"
                    class="btn_layer btn_white_line_sq64 icon_mac mac_down_btn"
                    href="javascript:void(0)"
                >
                  <img src="/img/content/talk/icon_download_mac.svg" alt="">
                </a>
              </div>
            </div>
          </div>
          <div class="right_box">
            <div class="right_inner">
              <ul data-aos="fade-up">
                <li><img src="/img/content/talk/img_talk_01.png" alt=""></li>
              </ul>
              <ul data-aos="fade-up" data-aos-delay="100">
                <li><img src="/img/content/talk/img_talk_02.png" alt=""></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section3" data-aos="fade-up">
      <div class="inner">
        <div class="right_box">
          <div class="right_inner">
            <div class="right_tit"><p>The most secure messenger</p></div>
            <div class="right_main_txt" v-html="t('p_talk_03')"></div>
            <div class="right_sub_txt" v-html="t('p_talk_04')"></div>
          </div>
        </div>
        <div class="left_box">
          <div class="img">
            <span><img src="/img/content/talk/talk_section3_img01.png" alt=""></span>
          </div>
        </div>
      </div>
    </section>

    <section class="section4" id="functions" data-aos="fade-up">
      <div class="inner">
        <div class="title">
          <p v-html="t('p_talk_05')"></p>
        </div>
        <PikiTalkSwiperComponent />
      </div>
    </section>

    <section class="section5">
      <div class="inner">
        <div class="title">
          <div class="main_text" v-html="t('p_talk_07')"></div>
        </div>
        <div class="content_box">
          <div class="chat">
            <div data-aos="fade-up"><div><p v-html="t('p_talk_07_1')"></p></div></div>
            <div data-aos="fade-up" data-aos-delay="100"><div><p v-html="t('p_talk_07_2')"></p></div></div>
            <div data-aos="fade-up" data-aos-delay="200"><div><p v-html="t('p_talk_07_3')"></p></div></div>
            <div data-aos="fade-up" data-aos-delay="300"><div><p v-html="t('p_talk_07_4')"></p></div></div>
          </div>
          <div class="img">
            <div><img src="/img/content/talk/people01.png" alt=""></div>
            <div><img src="/img/content/talk/people03.png" alt=""></div>
            <div><img src="/img/content/talk/people02.png" alt=""></div>
            <div><img src="/img/content/talk/people04.png" alt=""></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section6" data-aos="fade-up">
      <div class="inner">
        <div class="text_box">
          <div class="sort"><span>For everyone, anytime, anywhere</span></div>
          <p class="main_text" v-html="t('p_talk_08')"></p>
          <p class="sub_text" v-html="t('p_talk_09')"></p>
        </div>
        <div class="img_box">
          <span><img :src="t('p_talk_16')" alt=""></span>
        </div>
      </div>
    </section>

    <section class="section7">
      <div class="inner">
        <div class="title" data-aos="fade-up">
          <p class="main_text" v-html="t('p_talk_10')"></p>
          <p class="sub_text" v-html="t('p_talk_11')"></p>
          <div class="btn_box">
            <a :href="t('p_talk_17')" target="_blank" class="btn_white_line_sq64">
              <img src="/img/content/piki/icon_apple.svg" alt="">
            </a>
            <a :href="t('p_talk_15')" target="_blank" class="btn_white_line_sq64">
              <img src="/img/content/piki/icon_ggplay.svg" alt="">
            </a>
            <a
                href="https://pikitalk.com/data/PikiTalk Setup 0.7.0.exe"
                class="btn_layer btn_white_line_sq64"
            >
              <img src="/img/content/talk/icon_download_win.svg" alt="" :title="t('common_05')">
            </a>
            <a
                @click="downloadMac"
                class="btn_layer btn_white_line_sq64 icon_mac"
                href="javascript:void(0)"
            >
              <img src="/img/content/talk/icon_download_mac.svg" alt="" :title="t('common_05')">
            </a>
          </div>
        </div>
        <div class="img_box">
          <div data-aos="fade-up" data-aos-delay="100"><div><img src="/img/content/talk/pt_img02.png" alt=""></div></div>
          <div data-aos="fade-up" data-aos-delay="200"><div><img src="/img/content/talk/pt_img01.png" alt=""></div></div>
          <div data-aos="fade-up" data-aos-delay="300"><div><img src="/img/content/talk/pt_img3.png" alt=""></div></div>
          <div data-aos="fade-up" data-aos-delay="400"><div><img src="/img/content/talk/pt_img4.png" alt=""></div></div>
        </div>
      </div>
    </section>
  </div>
</template>
