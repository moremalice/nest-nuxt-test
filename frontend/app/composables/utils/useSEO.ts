// composables/utils/useSEO.ts

/* --------------------------------------------------------------------------
 * 글로벌(기본) SEO 상수
 * -------------------------------------------------------------------------- */
const SEO_CONSTANTS = {
    title: 'Pikitalk – Secure chats, forever on blockchain',
    description:
        'A trustworthy messenger, secure with no server records, and the ability to store conversations on the blockchain, ensuring they last forever!',
    ogTitle: 'Pikitalk – Secure chats, forever on blockchain',
    ogDescription:
        'A trustworthy messenger, secure with no server records, and the ability to store conversations on the blockchain, ensuring they last forever!',
    // 기본값은 상대 경로이지만, 아래 toAbsolute()로 항상 절대 URL로 변환해 사용함
    ogImage: '/img/common/Pikibrand_preview.png',
    // 도메인은 www 없이 한쪽으로 통일
    ogUrl: 'https://pikitalk.com',
    keywords: 'pikitalk, blockchain, secure chat, messenger, privacy',
    author: 'Pikitalk',
    googleSiteVerification: 'wG3jvR0PNNdEwKMtRMbEZNG-BM6kTJ6iNjNwRmBE1bk'
}

/* --------------------------------------------------------------------------
 * 공통 유틸
 * -------------------------------------------------------------------------- */
const CANONICAL_HOST = 'https://pikitalk.com' // ← 반드시 한쪽으로 통일

const toAbsolute = (src?: string) => {
    const fallback = `${CANONICAL_HOST}/img/common/Pikibrand_preview.png`
    if (!src) return fallback
    return /^https?:\/\//i.test(src) ? src : new URL(src, CANONICAL_HOST).toString()
}
const toAbsoluteUrl = (url?: string) => {
    if (!url) return CANONICAL_HOST
    return /^https?:\/\//i.test(url) ? url : new URL(url, CANONICAL_HOST).toString()
}
const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '')
const trim160 = (s: string) => (s.length > 160 ? s.slice(0, 157) + '...' : s)
const trimTitle = (s: string, length: number = 60) => {
    const cleaned = s.trim()
    return cleaned.length > length ? cleaned.slice(0, length - 3) + '...' : cleaned
}

/* --------------------------------------------------------------------------
 * 기본 SEO 데이터를 객체로 반환
 * -------------------------------------------------------------------------- */
export const getSEOData = () => ({
    title: SEO_CONSTANTS.title,
    description: SEO_CONSTANTS.description,
    ogTitle: SEO_CONSTANTS.ogTitle,
    ogDescription: SEO_CONSTANTS.ogDescription,
    ogImage: SEO_CONSTANTS.ogImage,
    ogUrl: SEO_CONSTANTS.ogUrl,
    keywords: SEO_CONSTANTS.keywords,
    author: SEO_CONSTANTS.author,
    googleSiteVerification: SEO_CONSTANTS.googleSiteVerification
})

/* --------------------------------------------------------------------------
 * 공통 SEO 적용 함수 (전역 기본 + 커스텀만 병합)
 *  - 상세 페이지가 아닌 경우(레이아웃/일반 페이지)에서 호출
 *  - land 경로 관련 분기 제거
 * -------------------------------------------------------------------------- */
export const applySEO = (customSEO: Partial<ReturnType<typeof getSEOData>> = {}) => {
    const defaultSEO = getSEOData()

    // 기본 → 커스텀 병합
    const finalSEO = { ...defaultSEO, ...customSEO }

    // 절대 URL/이미지 강제
    const finalOgUrl = toAbsoluteUrl(finalSEO.ogUrl)
    const finalOgImage = toAbsolute(finalSEO.ogImage)

    // 핵심 SEO 메타 (SSR 반영)
    useSeoMeta({
        title: finalSEO.title,
        description: finalSEO.description,
        ogType: 'website',
        ogTitle: finalSEO.ogTitle || finalSEO.title,
        ogDescription: finalSEO.ogDescription || finalSEO.description,
        ogImage: finalOgImage,
        ogUrl: finalOgUrl,
        twitterCard: 'summary_large_image'
    })

    // 부가 메타 + canonical
    useHead({
        meta: [
            { charset: 'utf-8' },
            {
                name: 'viewport',
                content:
                    'width=device-width, initial-scale=1, user-scalable=no, maximum-scale=1, minimum-scale=1'
            },
            { 'http-equiv': 'X-UA-Compatible', content: 'IE=Edge,chrome' },
            { name: 'format-detection', content: 'telephone=no' },

            { name: 'keywords', content: finalSEO.keywords },
            { name: 'author', content: finalSEO.author },
            { name: 'google-site-verification', content: finalSEO.googleSiteVerification }
        ],
        link: [{ rel: 'canonical', href: finalOgUrl }]
    })

    return {
        ...finalSEO,
        ogImage: finalOgImage,
        ogUrl: finalOgUrl
    }
}

/* --------------------------------------------------------------------------
 * composable export
 * -------------------------------------------------------------------------- */
export const useSEO = () => ({
    getSEOData,
    applySEO,
})
