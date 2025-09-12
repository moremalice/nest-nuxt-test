// frontend/nuxt.config.ts

export default defineNuxtConfig({
    srcDir: 'app',
    ssr: false,

    experimental: {
        asyncContext: true
    },

    devtools: {
        enabled: process.env.NUXT_PUBLIC_APP_ENV !== 'production',
        timeline: {
            enabled: true
        }
    },

    modules: [
        '@nuxtjs/i18n',
        '@pinia/nuxt',
        '@nuxtjs/sitemap',
        '@nuxtjs/robots',
        'nuxt-aos',
        'nuxt-qrcode'
    ],

    // AOS 설정
    aos: {
        duration: 800,
        easing: 'ease-in-out',
        once: true
    },

    // QR 코드 설정
    qrcode: {
        options: {
            ecc: 'medium',
            blackColor: '#000000',
            whiteColor: '#ffffff',
            border: 2
        }
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
        url: process.env.NUXT_PUBLIC_SITE_URL,
        name: 'Pikitalk'
    },

    sitemap: {
        sources: ['/api/__sitemap__/urls'],
    },

    i18n: {
        // i18n 해석 기준 디렉토리를 app으로 변경
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
            cookieSecure: process.env.NUXT_PUBLIC_APP_ENV === 'production',
        },

        // 보안/빌드 설정
        compilation: {
            // 엄격한 보안 모드 - HTML 태그 차단으로 XSS 공격 방지
            strictMessage: true,
            // HTML 이스케이프 처리로 보안 강화
            escapeHtml: true
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

    // === Robots ===
    robots: {
        groups: [
            {
                userAgent: '*',
                // 프로덕션만 인덱싱 허용
                disallow: process.env.NUXT_PUBLIC_APP_ENV === 'production' ? [] : ['/'],
            }
        ],
        // Search Console 제출을 위해 사이트맵 URL을 명시
        sitemap: ['/sitemap.xml'],
        // robots.txt 캐시 헤더(운영/부하 상황에 맞춰 조정)
        cacheControl: 'max-age=14400, must-revalidate', // 4시간
    },

    // === 캐시 / 헤더 ===
    routeRules: {
        // nuxt sitemap은 기본 SWR 캐시가 있으나, 서비스 특성에 맞게 조정 가능
        '/sitemap.xml': {
            swr: 600, // 10분
            headers: { 'cache-control': 'public, max-age=600, stale-while-revalidate=86400' }
        },
        '/sitemap-*.xml': {
            swr: 600,
            headers: { 'cache-control': 'public, max-age=600, stale-while-revalidate=86400' }
        },
        '/robots.txt': {
            swr: 600,
            headers: { 'cache-control': 'public, max-age=600, must-revalidate' }
        },
        // === 프록시 설정 ===
        '/api/proxy/**': {
            proxy: `${process.env.NUXT_PUBLIC_SITE_URL}/data/**`,
            headers: {
                'access-control-allow-origin': '*',
                'cache-control': 'public, max-age=3600'
            }
        }
    },

    runtimeConfig: {
        // 서버 전용 (비공개)
        NUXT_RECAPTCHA_SECRET_KEY: process.env.NUXT_RECAPTCHA_SECRET_KEY,

        // 클라이언트 노출 (공개)
        public: {
            NUXT_APP_ENVIRONMENT: process.env.NUXT_PUBLIC_APP_ENV || 'local',
            NUXT_API_BASE_URL: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3020',
            NUXT_APP_SITE_URL: process.env.NUXT_PUBLIC_SITE_URL,
            NUXT_RECAPTCHA_SITE_KEY: process.env.NUXT_PUBLIC_RECAPTCHA_SITE_KEY,
            NUXT_RECAPTCHA_TEST_KEY: process.env.NUXT_PUBLIC_RECAPTCHA_TEST_KEY,
        }
    }
})
