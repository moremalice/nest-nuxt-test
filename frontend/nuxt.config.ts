// frontend/nuxt.config.ts

export default defineNuxtConfig({
    srcDir: 'app',
    ssr: false,

    devtools: {
        enabled: process.env.NODE_ENV !== 'production',
        timeline: {
            enabled: true
        }
    },

    modules: [
        '@nuxtjs/i18n',
        '@pinia/nuxt',
        '@nuxtjs/sitemap',
        'nuxt-aos'
    ],

    // AOS 설정
    aos: {
        duration: 800,
        easing: 'ease-in-out',
        once: true
    },

    compatibilityDate: '2024-04-03',

    // Auto-import 설정
    imports: {
        dirs: ['composables/**']
    },

    components: [
        {path: '~/components', pathPrefix: false},
    ],

    site: {
        url: 'https://pikitalk.com',
        name: 'Pikitalk'
    },

    sitemap: {
        sources: ['/', '/api/__sitemap__/urls'],
    },

    i18n: {
        // ✅ 핵심: i18n 해석 기준 디렉토리를 app으로 변경
        restructureDir: 'app',

        // app/locales를 가리키게 됨
        langDir: 'locales',

        // (권장) SEO 사용 시 language 키 사용
        // 기존 iso 대신 language로 변경 예시
        locales: [
            {code: 'ko', language: 'ko-KR', file: 'ko.json'},
            {code: 'en', language: 'en-US', file: 'en.json'},
            {code: 'de', language: 'de-DE', file: 'de.json'},
            {code: 'es', language: 'es-ES', file: 'es.json'},
            {code: 'fr', language: 'fr-FR', file: 'fr.json'},
            {code: 'id', language: 'id-ID', file: 'id.json'},
            {code: 'it', language: 'it-IT', file: 'it.json'},
            {code: 'ja', language: 'ja-JP', file: 'ja.json'},
            {code: 'pt', language: 'pt-BR', file: 'pt-BR.json'},
            {code: 'ru', language: 'ru-RU', file: 'ru.json'},
            {code: 'th', language: 'th-TH', file: 'th.json'},
            {code: 'tr', language: 'tr-TR', file: 'tr.json'},
            {code: 'vi', language: 'vi-VN', file: 'vi.json'},
            // 중국어 표기는 BCP47 권장 표기 사용 권장 (예: zh-Hans/zh-Hant)
            {code: 'zh_s', language: 'zh-Hans', file: 'zh-CN.json'},
            {code: 'zh_t', language: 'zh-Hant', file: 'zh-TW.json'}
        ],

        defaultLocale: 'ko',
        strategy: 'no_prefix',

        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: 'i18n_redirected',
            redirectOn: 'root',
            alwaysRedirect: false,
            fallbackLocale: 'ko',
            // 운영 환경에서는 HTTPS 사용 시 true 권장
            cookieSecure: process.env.NODE_ENV === 'production',
        },

        // 보안/빌드 설정
        compilation: {
            // 운영에서 엄격 모드 권장 (HTML 삽입 차단)
            strictMessage: process.env.NODE_ENV === 'production',
            // strict를 false로 내려면 escapeHtml은 true 권장
            escapeHtml: process.env.NODE_ENV === 'production'
        },
    },

    app: {
        head: {
            // meta 배열 useSEO.ts에서 관리
            link: [
                {rel: 'apple-touch-icon', sizes: '57x57', href: '/favicon.ico'},
                {rel: 'icon', type: 'image/png', sizes: '57x57', href: '/favicon.ico'},
            ],
            script: [
            ]
        }
    },

    css: [
        '~/assets/css/font.css',
        '~/assets/css/default.css',
        '~/assets/css/common.css',
        'swiper/css',
        'swiper/css/pagination',
        'swiper/css/navigation',
        '~/assets/css/content.css'
    ],

    runtimeConfig: {
        public: {
            NUXT_APP_ENVIRONMENT: process.env.NUXT_PUBLIC_APP_ENV || 'development',
            NUXT_API_BASE_URL: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3020',
        }
    }
})
