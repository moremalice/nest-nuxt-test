// frontend/server/api/__sitemap__/urls.ts
import { useServerApiGet } from '~/composables/api/useApi'

export default defineEventHandler(async (event) => {
    try {
        const response = await useServerApiGet<any[]>('/land/recent-posts')

        // 백엔드 응답 구조 확인 { status: 'success', data: T[] }
        if (response.status !== 'success' || !Array.isArray(response.data)) {
            console.error('Invalid response from backend:', response.status === 'error' ? response.data : 'Invalid response structure')
            return []
        }

        const urls = response.data
            .filter(post => post?.post_idx != null)
            .map((post) => {
                const lastmod = toLastmodISO(post)
                const item: any = {
                    loc: `/land/detail/${post.post_idx}`,
                    changefreq: 'weekly',
                    priority: 0.8
                }
                if (lastmod) item.lastmod = lastmod
                return item
            })

        // (선택) 5분 캐시
        setResponseHeader(event, 'Cache-Control', 'public, max-age=300, stale-while-revalidate=86400')

        return urls
    } catch (error) {
        console.error('Failed to generate sitemap URLs:', error)
        return []
    }
})

/** post 안의 reg_date/timestamp들을 안전하게 ISO8601로 변환 */
function toLastmodISO(post: any): string | undefined {
    // 1) reg_date: 'YYYY-MM-DD HH:mm:ss' (KST로 가정)
    if (typeof post?.reg_date === 'string') {
        const isoKst = post.reg_date.replace(' ', 'T') + '+09:00' // 예: 2025-07-31T08:33:08+09:00
        const d = new Date(isoKst)
        if (!Number.isNaN(d.getTime())) return d.toISOString()
    }

    // 2) timestamp(초) 또는 ms 지원 (혹시 내려오는 경우 대비)
    if (post?.timestamp != null) {
        const n = Number(post.timestamp)
        if (Number.isFinite(n)) {
            const ms = n > 1e12 ? n : n * 1000
            const d = new Date(ms)
            if (!Number.isNaN(d.getTime())) return d.toISOString()
        }
    }
    if (post?.timestamp_ms != null) {
        const n = Number(post.timestamp_ms)
        if (Number.isFinite(n)) {
            const d = new Date(n)
            if (!Number.isNaN(d.getTime())) return d.toISOString()
        }
    }

    // 3) 기타 문자열 후보들(ISO 등)
    for (const key of ['updated_at', 'created_at', 'updatedAt', 'createdAt']) {
        const v = post?.[key]
        if (typeof v === 'string') {
            const d = new Date(v)
            if (!Number.isNaN(d.getTime())) return d.toISOString()
        }
    }

    // 유효한 값이 없으면 lastmod 생략
    return undefined
}
