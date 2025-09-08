// composables/utils/useCommonUtils.ts

type DateInput = number | string | Date | null | undefined

const isNumeric = (v: string) => /^[0-9]+$/.test(v.trim())
const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * DateInput → Date
 * - number: 1e12 이상이면 ms, 아니면 s로 간주 (자동감지)
 * - string: 숫자면 number 처리, 아니면 Date 파서에 위임(ISO/날짜문자열)
 * - invalid면 null
 */
const toDate = (input: DateInput): Date | null => {
    if (input === null || input === undefined) return null
    if (input instanceof Date) return isNaN(input.getTime()) ? null : input

    if (typeof input === 'number') {
        const ms = input > 1e12 ? input : input * 1000
        const d = new Date(ms)
        return isNaN(d.getTime()) ? null : d
    }

    const s = String(input).trim()
    if (!s) return null

    if (isNumeric(s)) {
        const n = Number(s)
        const ms = n > 1e12 ? n : n * 1000
        const d = new Date(ms)
        return isNaN(d.getTime()) ? null : d
    }

    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
}

const parts = (d: Date, utc = false) => {
    const y  = utc ? d.getUTCFullYear()  : d.getFullYear()
    const m  = utc ? d.getUTCMonth() + 1 : d.getMonth() + 1
    const dd = utc ? d.getUTCDate()      : d.getDate()
    const h  = utc ? d.getUTCHours()     : d.getHours()
    const mi = utc ? d.getUTCMinutes()   : d.getMinutes()
    const s  = utc ? d.getUTCSeconds()   : d.getSeconds()
    return { y, m, dd, h, mi, s }
}

/**
 * YYYY-MM-DD (기본 UTC, 기존 toISOString().split('T')[0]과 동일 의도)
 */
export const formatTDate = (input?: DateInput, opts?: { utc?: boolean }) => {
    const d = toDate(input)
    if (!d) return ''
    const { y, m, dd } = parts(d, opts?.utc ?? true)
    return `${y}-${pad2(m)}-${pad2(dd)}`
}

/**
 * YYYY-MM-DD (기본 로컬)
 */
export const formatDateDash = (input: DateInput, opts?: { utc?: boolean }) => {
    const d = toDate(input)
    if (!d) return ''
    const { y, m, dd } = parts(d, opts?.utc ?? false)
    return `${y}-${pad2(m)}-${pad2(dd)}`
}

/**
 * YYYY-MM-DD HH:mm:ss (기본 로컬)
 */
export const formatDateTimeDash = (input: DateInput, opts?: { utc?: boolean }) => {
    const d = toDate(input)
    if (!d) return ''
    const { y, m, dd, h, mi, s } = parts(d, opts?.utc ?? false)
    return `${y}-${pad2(m)}-${pad2(dd)} ${pad2(h)}:${pad2(mi)}:${pad2(s)}`
}

/**
 * 2025년 8월 12일 오전 3:07 (기본 로컬, 한글 포맷 유지)
 */
export const formatTimestamp = (input: DateInput, opts?: { utc?: boolean }) => {
    const d = toDate(input)
    if (!d) return ''
    const { y, m, dd, h, mi } = parts(d, opts?.utc ?? false)
    const ampm = h >= 12 ? '오후' : '오전'
    const h12 = h % 12 || 12
    return `${y}년 ${m}월 ${dd}일 ${ampm} ${h12}:${pad2(mi)}`
}

export const directFileDownload = async (
    fileUrl: string,
    filename?: string
): Promise<{ status: 'success' | 'error', message?: string }> => {
    try {
        showLoading()


        // 외부 파일서버에 직접 요청
        const response = await fetch(fileUrl, {
            method: 'GET',
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: File not found.`)
        }

        const blob = await response.blob()

        // 파일명 처리
        const downloadFilename = filename || fileUrl.split('/').pop() || 'download'

        // 파일 다운로드 실행
        const objectUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = downloadFilename
        link.style.display = 'none'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setTimeout(() => {
            window.URL.revokeObjectURL(objectUrl)
        }, 100)

        return { status: 'success' }
    } catch (error: any) {
        console.error('Direct file download error:', error)
        return {
            status: 'error',
            message: error.message || 'An error occurred during file download.'
        }
    } finally {
        hideLoading()
    }
}

export const backendFileDownload = async (
    filePath: string,
    fileName?: string,
): Promise<{ status: 'success' | 'error'; message?: string }> => {
    try {
        const response = await useApiGet<{ url: string }>('/file/get-download-url', {
            file_path: filePath
        });

        if (response.status === 'success') {
            const fileUrl = response.data.url;

            const fileResponse = await fetch(fileUrl);

            if (!fileResponse.ok) {
                throw new Error(`HTTP ${fileResponse.status}: File not found.`);
            }

            const blob = await fileResponse.blob();
            const downloadFilename = fileName || filePath.split('/').pop() || 'download';

            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = downloadFilename;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => {
                window.URL.revokeObjectURL(objectUrl);
            }, 100);

            return { status: 'success' };
        } else {
            handleApiError(response.data);

            return {
                status: 'error',
                message: response.data.message || 'Failed to get download URL'
            };
        }

    } catch (error: any) {
        const errorData = {
            name: 'FileDownloadError',
            message: error.message || 'An error occurred during file download.'
        };

        handleApiError(errorData);

        return {
            status: 'error',
            message: errorData.message
        };
    }
};

export const useCommonUtils = () => ({
    formatTDate,
    formatDateDash,
    formatDateTimeDash,
    formatTimestamp,
    directFileDownload,
    backendFileDownload
})
