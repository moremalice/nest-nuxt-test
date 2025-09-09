// frontend/nuxt.config.ts

export default defineNuxtConfig({
    ssr: false,

    devtools: {
        enabled: true,
        timeline: {
            enabled: true
        }
    },

    modules: [
        '@nuxtjs/i18n',
        '@pinia/nuxt',
        'nuxt-simple-sitemap',
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
        bundle: {
            optimizeTranslationDirective: false
        },
        compilation: {
            strictMessage: false,
            escapeHtml: false
        },
        locales: [
            {code: 'ko', iso: 'ko-KR', file: 'ko.json'},
            {code: 'en', iso: 'en-US', file: 'en.json'},
            {code: 'de', iso: 'de-DE', file: 'de.json'},
            {code: 'es', iso: 'es-ES', file: 'es.json'},
            {code: 'fr', iso: 'fr-FR', file: 'fr.json'},
            {code: 'id', iso: 'id-ID', file: 'id.json'},
            {code: 'it', iso: 'it-IT', file: 'it.json'},
            {code: 'ja', iso: 'ja-JP', file: 'ja.json'},
            {code: 'pt', iso: 'pt-BR', file: 'pt.json'},
            {code: 'ru', iso: 'ru-RU', file: 'ru.json'},
            {code: 'th', iso: 'th-TH', file: 'th.json'},
            {code: 'tr', iso: 'tr-TR', file: 'tr.json'},
            {code: 'vi', iso: 'vi-VN', file: 'vi.json'},
            {code: 'zh_s', iso: 'zh-CN', file: 'zh-CN.json'},
            {code: 'zh_t', iso: 'zh-TW', file: 'zh-TW.json'}
        ],
        langDir: 'locales/',
        defaultLocale: 'ko',
        strategy: 'no_prefix',

        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: 'i18n_redirected',
            redirectOn: 'root',
            alwaysRedirect: false,
            fallbackLocale: 'ko',
            cookieSecure: false,
        },
        lazy: true,
    },

    app: {
        head: {
            // meta 배열 useSEO.ts에서 관리
            link: [
                {rel: 'apple-touch-icon', sizes: '57x57', href: '/img/common/favicon.ico'},
                {rel: 'icon', type: 'image/png', sizes: '57x57', href: '/img/common/favicon.ico'},
                {rel: 'stylesheet', href: '/css/font.css'},
                {rel: 'stylesheet', href: '/css/default.css'},
                {rel: 'stylesheet', href: '/css/common.css'},
                {rel: 'stylesheet', href: '/css/content.css'},
            ],
            script: [
            ]
        }
    },

    css: [
        'swiper/css',
        'swiper/css/pagination',
        'swiper/css/navigation'
    ],

    runtimeConfig: {
        public: {
            NUXT_APP_ENVIRONMENT: process.env.NUXT_PUBLIC_APP_ENV || 'development',
            NUXT_API_BASE_URL: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3020',
        }
    }
})
