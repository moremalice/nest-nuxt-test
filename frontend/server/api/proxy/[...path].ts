// server/api/proxy/[...path].ts
export default defineEventHandler(async (event) => {
    const path = getRouterParam(event, 'path') ?? ''

    // HLS(.m3u8/.ts) 등 Range 중요 리소스: 필요한 헤더만 포워딩
    const reqHeaders = getRequestHeaders(event)
    const forward: Record<string, string> = {}
    for (const h of ['range', 'if-none-match', 'if-modified-since', 'accept', 'user-agent', 'referer']) {
        if (reqHeaders[h]) forward[h] = reqHeaders[h] as string
    }

    try {
        const upstream = await fetch(`https://pikitalk.com/data/${path}`, { headers: forward })

        // 핵심: Response 객체를 그대로 반환 (헤더/상태/스트림 자동 전달)
        return upstream

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
