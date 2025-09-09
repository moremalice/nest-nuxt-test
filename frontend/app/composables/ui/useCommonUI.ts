// composables/ui/useCommonUI.ts

// 내부 상태 (private)
const _activeLayer = ref<number | string | null>(null)
const _showToast = ref(false)
const _toastMessage = ref('')
const _isToastShown = ref(false)

export const openLayer = (layerNum: number | string): void => {
    _activeLayer.value = layerNum
}

export const closeLayer = (): void => {
    _activeLayer.value = null
}

// 토스트 메시지
export const showToastMessage = (message: string) => {
    if (_isToastShown.value || !message.trim()) return

    _isToastShown.value = true
    _toastMessage.value = message
    _showToast.value = true

    setTimeout(() => {
        _showToast.value = false
        _toastMessage.value = ''
        _isToastShown.value = false
    }, 1500)
}

// 클립보드 복사
export const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text)
        showToastMessage('Copied to clipboard!')
        return true
    } catch (err) {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.top = '0'
        textArea.style.left = '0'
        textArea.style.opacity = '0'

        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
            document.execCommand('copy')
            document.body.removeChild(textArea)
            showToastMessage('Copied to clipboard!')
            return true
        } catch (err) {
            document.body.removeChild(textArea)
            showToastMessage('Failed to copy')
            return false
        }
    }
}

// 읽기 전용으로 상태값들 export (직접 사용 가능)
export const activeLayer = readonly(_activeLayer)
export const showToast = readonly(_showToast)
export const toastMessage = readonly(_toastMessage)

// 기존 방식(구조분해할당)
export const useCommonUI = () => ({
    activeLayer: readonly(activeLayer),
    showToast: readonly(showToast),
    toastMessage: readonly(toastMessage),
    openLayer,
    closeLayer,
    showToastMessage,
    copyToClipboard,
})
