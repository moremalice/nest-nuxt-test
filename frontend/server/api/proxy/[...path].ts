// server/api/proxy/[...path].ts
export default defineEventHandler(async (event) => {
    const path = getRouterParam(event, 'path') as string

    try {
        const response = await fetch(`https://pikitalk.com/data/${path}`)

        if (!response.ok) {
            throw createError({
                statusCode: response.status,
                statusMessage: JSON.stringify({
                    status: 'error',
                    data: {
                        name: 'ProxyError',
                        message: 'Failed to fetch data from external source'
                    }
                })
            })
        }

        // 원본 응답의 헤더들을 복사
        setHeader(event, 'Access-Control-Allow-Origin', '*')

        // Content-Type을 파일 확장자에 따라 설정
        const contentType = response.headers.get('Content-Type') || getContentType(path)
        setHeader(event, 'Content-Type', contentType)

        // Content-Length 헤더가 존재할 때만 설정
        const contentLength = response.headers.get('Content-Length')
        if (contentLength) {
            setHeader(event, 'Content-Length', parseInt(contentLength))
        }

        // Cache-Control 설정 (파일 타입에 따라 다르게)
        const cacheControl = getCacheControl(path)
        setHeader(event, 'Cache-Control', response.headers.get('Cache-Control') || cacheControl)

        return response.body

    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: JSON.stringify({
                status: 'error',
                data: {
                    name: 'ProxyError',
                    message: 'Proxy request failed'
                }
            })
        })
    }
})

// Content-Type 결정 함수
function getContentType(path: string): string {
    if (path.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl'
    if (path.endsWith('.ts')) return 'video/mp2t'
    if (path.endsWith('.yml') || path.endsWith('.yaml')) return 'text/yaml'
    if (path.endsWith('.json')) return 'application/json'
    return 'application/octet-stream'
}

// Cache-Control 결정 함수
function getCacheControl(path: string): string {
    if (path.endsWith('.m3u8')) return 'public, max-age=60' // HLS 매니페스트는 짧게
    if (path.endsWith('.ts')) return 'public, max-age=3600' // 비디오 세그먼트는 길게
    if (path.endsWith('.yml')) return 'public, max-age=300' // YML은 중간
    return 'public, max-age=3600'
}
