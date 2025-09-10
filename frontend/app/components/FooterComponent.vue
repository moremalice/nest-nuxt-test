<script setup lang="ts">
const { locale, setLocale, t } = useI18n()

const downloadPC = (platform: string) => {
  // PC 다운로드 로직
  console.log(`Downloading for ${platform}`)
  closeLayer()
}

</script>

<template>
  <footer>
    <div class="footer_wrap">
      <div class="footer_logo">
        <NuxtLink to="/" @click="handleLogoClick">
          <img src="~/assets/images/common/logo_piki.svg" alt="piki">
        </NuxtLink>
      </div>
      <div class="footer_info">
        <div class="gnb">
          <ul>
            <li><button type="button" class="btn_layer" @click="openLayer(1)">{{ t('common_06') }}</button></li>
            <li><button type="button" class="btn_layer" @click="openLayer(2)">{{ t('common_07') }}</button></li>
            <li><NuxtLink to="/community/notice">{{ t('common_08') }}</NuxtLink></li>
            <li><NuxtLink to="/policy/privacy">{{ t('common_09') }}</NuxtLink></li>
            <li><NuxtLink to="/policy/terms">{{ t('common_10') }}</NuxtLink></li>
          </ul>
        </div>
        <div class="link_sns">
          <ul>
            <li>
              <a href="https://www.youtube.com/@Pikitalk" target="_blank">
                <img src="~/assets/images/common/sns_youtube.svg" alt="">
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/official_pikitalk_global/?hl=en" target="_blank">
                <img src="~/assets/images/common/sns_instagram.svg" alt="">
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div class="cpr">
        <p>©2025. Piki. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <!-- Layer 1 - Contact Us -->
  <!-- Props로 visible 전달, @close로 이벤트 수신 -->
  <LayerModalComponent :visible="activeLayer === 1" @close="closeLayer">
    <!-- 슬롯 콘텐츠 -->
    <h3>{{ t('common_06') }}</h3>
    <p class="pre-line">{{ t('footer_05') }}</p>
    <div class="cert_box">
      <div class="cert_text" ref="adminMail">help@sigmachain.net</div>
      <button class="cert_btn" @click="copyToClipboard('help@sigmachain.net')">{{ t('common_11') }}</button>
    </div>
    <div class="info">
      <h4>&#8251; {{ t('footer_06') }}</h4>
      <ul>
        <li>{{ t('footer_07') }}</li>
        <li class="pre-line">{{ t('footer_08') }}</li>
        <li>{{ t('footer_09') }}</li>
        <li class="mt10">{{ t('footer_10') }}</li>
      </ul>
    </div>
  </LayerModalComponent>

  <LayerModalComponent :visible="activeLayer === 2" @close="closeLayer">
    <h3>{{ t('common_07') }}</h3>
    <p class="pre-line">{{ t('footer_11') }}</p>
    <div class="cert_box">
      <div class="cert_text" ref="adminMail2">help@sigmachain.net</div>
      <button class="cert_btn" @click="copyToClipboard('help@sigmachain.net')">{{ t('common_11') }}</button>
    </div>
    <div class="info">
      <h4>&#8251; {{ t('footer_06') }}</h4>
      <ul>
        <li class="pre-line">{{ t('footer_12') }}</li>
        <li class="mt10">{{ t('footer_10') }}</li>
      </ul>
    </div>
  </LayerModalComponent>

  <!-- App Download Mobile -->
  <LayerModalComponent :visible="activeLayer === 'popup_appdownload_mobile'" @close="closeLayer">
    <h3>이 파일은 PC 전용 설치 파일입니다.<br>PC환경에서 다시 접속해 다운로드를 진행해주세요.</h3>
  </LayerModalComponent>

  <!-- App Download PC -->
  <LayerModalComponent :visible="activeLayer === 'popup_appdownload_pc'" @close="closeLayer">
    <h3>Download PC version</h3>
    <div class="download_box mt10">
      <div class="download_text">Windows</div>
      <button class="download_btn pc_down_btn" @click="downloadPC('windows')">Download</button>
    </div>
    <div class="download_box mb30">
      <div class="download_text">macOS</div>
      <button class="download_btn pc_down_btn" @click="downloadPC('macos')">Download</button>
    </div>
  </LayerModalComponent>

  <!-- Toast Message -->
  <div v-if="showToast" id="toast" class="show">{{ toastMessage }}</div>
</template>

<style scoped>
</style>
