import { VueReCaptcha } from 'vue-recaptcha-v3'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  const options = {
    siteKey: config.public.RECAPTCHA_SITE_KEY || '',
    loaderOptions: {
      autoHideBadge: true,
      useRecaptchaNet: false,
      renderParameters: {
        hl: 'ko'
      }
    }
  }

  if (!options.siteKey) {
    console.warn('reCAPTCHA: RECAPTCHA_SITE_KEY가 설정되지 않았습니다.')
  }

  nuxtApp.vueApp.use(VueReCaptcha, options)
})