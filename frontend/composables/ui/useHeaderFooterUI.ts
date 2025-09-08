// composables/ui/useHeaderFooterUI.ts

// Constants
const DESKTOP_BREAKPOINT = 1240
const RESIZE_DEBOUNCE_DELAY = 150

// SSR-safe global state management
const createHeaderState = () => {
  const route = useRoute()
  const _isMobileMenuOpen = ref(false)
  const _isLanguageListOpen = ref(false)
  const _activeMenuItems = ref<Set<number>>(new Set())
  const _windowWidth = ref(DESKTOP_BREAKPOINT)
  const _currentPath = computed(() => route.path)
  const _isMainPage = computed(() => route.path === '/')
  const _isDesktop = computed(() => _windowWidth.value > DESKTOP_BREAKPOINT)
  let _isInitialized = false // 중복 초기화 방지

  return {
    _isMobileMenuOpen,
    _isLanguageListOpen,
    _activeMenuItems,
    _windowWidth,
    _currentPath,
    _isMainPage,
    _isDesktop,
    _isInitialized: () => _isInitialized,
    _setInitialized: (value: boolean) => { _isInitialized = value },
    _resizeTimeoutId: null as number | null
  }
}

// Global state instance
let headerState: ReturnType<typeof createHeaderState> | null = null

const getHeaderState = () => {
  if (!headerState) {
    headerState = createHeaderState()
  }
  return headerState
}

// 초기화 함수
const initializeHeaderUI = () => {
    const state = getHeaderState()
    if (state._isInitialized()) return // 중복 초기화 방지

    try {
        updateWindowWidthImmediate() // 초기화 시에는 즉시 실행
        window.addEventListener('resize', updateWindowWidth, { passive: true })
        document.addEventListener('click', handleOutsideClick, { passive: true })
        state._setInitialized(true)
    } catch (error) {
        console.error('Failed to initialize header UI:', error)
    }
}

// 정리 함수
const cleanupHeaderUI = () => {
    const state = getHeaderState()
    
    try {
        // 이벤트 리스너 제거
        window.removeEventListener('resize', updateWindowWidth)
        document.removeEventListener('click', handleOutsideClick)
        
        // 타이머 정리
        if (state._resizeTimeoutId !== null) {
            clearTimeout(state._resizeTimeoutId)
            state._resizeTimeoutId = null
        }
        
        state._setInitialized(false)
    } catch (error) {
        console.error('Failed to cleanup header UI:', error)
        // 에러가 발생해도 초기화 상태는 리셋
        state._setInitialized(false)
    }
}

// 자동 초기화를 위한 헬퍼 함수
export const setupHeaderUI = () => {
    onMounted(() => {
        initializeHeaderUI()
    })

    onUnmounted(() => {
        cleanupHeaderUI()
    })
}

// 윈도우 크기 감지 (즉시 실행)
const updateWindowWidthImmediate = () => {
    if (import.meta.client) {
        const state = getHeaderState()
        state._windowWidth.value = window.innerWidth
        // 데스크톱으로 전환 시 모바일 메뉴 상태 초기화
        if (state._windowWidth.value > DESKTOP_BREAKPOINT) {
            state._isMobileMenuOpen.value = false
            state._activeMenuItems.value.clear()
        }
    }
}

// 디바운스된 윈도우 크기 감지
const updateWindowWidth = () => {
    if (!import.meta.client) return
    
    const state = getHeaderState()
    
    // 기존 타이머 정리
    if (state._resizeTimeoutId !== null) {
        clearTimeout(state._resizeTimeoutId)
    }
    
    // 새 타이머 설정
    state._resizeTimeoutId = window.setTimeout(() => {
        updateWindowWidthImmediate()
        state._resizeTimeoutId = null
    }, RESIZE_DEBOUNCE_DELAY)
}

// 외부 클릭 감지
const handleOutsideClick = (event: Event) => {
    try {
        const state = getHeaderState()
        const target = event.target as HTMLElement

        // 안전한 DOM 접근 확인
        if (!target || typeof target.closest !== 'function') return

        // 언어 메뉴 외부 클릭
        if (state._isLanguageListOpen.value && !target.closest('#lang')) {
            state._isLanguageListOpen.value = false
        }
    } catch (error) {
        console.error('Error in outside click handler:', error)
    }
}

// 모바일 메뉴 토글
export const handleMobileMenuToggle = () => {
    const state = getHeaderState()
    state._isMobileMenuOpen.value = !state._isMobileMenuOpen.value
    if (!state._isMobileMenuOpen.value) {
        state._activeMenuItems.value.clear()
    }
}

// 언어 메뉴 토글
export const handleLanguageListToggle = () => {
    const state = getHeaderState()
    state._isLanguageListOpen.value = !state._isLanguageListOpen.value
}

// 언어 메뉴 닫기 함수 추가
export const handleLanguageListClose = () => {
    const state = getHeaderState()
    state._isLanguageListOpen.value = false
}

// 서브메뉴 토글 (모바일용)
export const handleSubMenuToggle = (index: number) => {
    const state = getHeaderState()
    if (state._activeMenuItems.value.has(index)) {
        state._activeMenuItems.value.delete(index)
    } else {
        state._activeMenuItems.value.add(index)
    }
}

// 메뉴 클릭 시 모바일에서 닫기
export const handleMenuClick = () => {
    const state = getHeaderState()
    if (state._windowWidth.value <= DESKTOP_BREAKPOINT) {
        state._isMobileMenuOpen.value = false
        state._activeMenuItems.value.clear()
    }
}

// 메인 메뉴 클릭 핸들러
export const handleMainMenuClick = (event: Event, item: { href: string }, index: number) => {
    const state = getHeaderState()
    if (state._currentPath.value === item.href) {
        event.preventDefault()
        scrollToTop()
    }
    if (state._isDesktop.value) {
        handleMenuClick()
    } else {
        handleSubMenuToggle(index)
    }
}

// 메인 페이지 여부를 받아서 서브 메뉴 링크 경로를 반환
export function getSubItemPath(isMainPage: boolean, subItemHref: string) {
    if (subItemHref.startsWith('#')) {
        return isMainPage ? subItemHref : `/${subItemHref}`
    }
    return subItemHref
}

export const getSubItemLink = (subItemHref: string) => {
    const state = getHeaderState()
    return getSubItemPath(state._isMainPage.value, subItemHref)
}

// 앵커 클릭
export const handleAnchorClick = (event: Event, href: string) => {
    try {
        const state = getHeaderState()
        if (href.startsWith('#') && state._isMainPage.value) {
            event.preventDefault()
            const elementId = href.slice(1)
            const element = document.getElementById(elementId)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } else {
                console.warn(`Element with id "${elementId}" not found`)
            }
        }
        handleMenuClick()
    } catch (error) {
        console.error('Error in anchor click handler:', error)
        handleMenuClick() // 에러가 발생해도 메뉴는 닫아줌
    }
}

// URL 앵커 처리
export const handleUrlAnchor = async () => {
    if (!import.meta.client) return

    try {
        const hash = window.location.hash
        if (hash) {
            await nextTick()
            const elementId = hash.replace('#', '')
            const element = document.getElementById(elementId)

            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                })
            } else {
                console.warn(`Element with id "${elementId}" not found for URL anchor`)
            }
        }
    } catch (error) {
        console.error('Error in URL anchor handler:', error)
    }
}

// 페이지 상단으로 스크롤
export const scrollToTop = () => {
    if (!import.meta.client) return
    try {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
        console.error('Error scrolling to top:', error)
        // 폴백: 즉시 스크롤
        try {
            window.scrollTo(0, 0)
        } catch (fallbackError) {
            console.error('Fallback scroll also failed:', fallbackError)
        }
    }
}

// 특정 요소로 스크롤
export const scrollToElement = (elementId: string) => {
    if (!import.meta.client) return
    try {
        const element = document.getElementById(elementId)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else {
            console.warn(`Element with id "${elementId}" not found for scrolling`)
        }
    } catch (error) {
        console.error('Error scrolling to element:', error)
    }
}

export const handleLogoClick = (event: Event) => {
    const state = getHeaderState()
    if (state._isMainPage.value) {
        event.preventDefault() // 기본 동작(페이지 이동) 차단
        scrollToTop()
    }
}

// 읽기 전용으로 상태값들 export
export const isMobileMenuOpen = computed(() => readonly(getHeaderState()._isMobileMenuOpen))
export const isLanguageListOpen = computed(() => readonly(getHeaderState()._isLanguageListOpen))
export const activeMenuItems = computed(() => readonly(getHeaderState()._activeMenuItems))
export const windowWidth = computed(() => readonly(getHeaderState()._windowWidth))
export const isMainPage = computed(() => readonly(getHeaderState()._isMainPage))
export const isDesktop = computed(() => readonly(getHeaderState()._isDesktop))
export const currentPath = computed(() => readonly(getHeaderState()._currentPath))

// 템플릿에서 직접 사용하기 위한 헬퍼 함수들
export const hasActiveMenuItem = (index: number) => {
    return getHeaderState()._activeMenuItems.value.has(index)
}

export const isDesktopOrHasActiveMenuItem = (index: number) => {
    const state = getHeaderState()
    return state._isDesktop.value || state._activeMenuItems.value.has(index)
}

export const getLanguageListOpenState = () => {
    return getHeaderState()._isLanguageListOpen.value
}

export const getMobileMenuOpenState = () => {
    return getHeaderState()._isMobileMenuOpen.value
}

// 기존 방식(구조분해할당) - 호환성 유지
export const useHeaderFooterUI = () => {
    setupHeaderUI() // 자동으로 lifecycle 설정

    const state = getHeaderState()
    
    return {
        isMobileMenuOpen: readonly(state._isMobileMenuOpen),
        isLanguageListOpen: readonly(state._isLanguageListOpen),
        activeMenuItems: readonly(state._activeMenuItems),
        windowWidth: readonly(state._windowWidth),
        isMainPage: readonly(state._isMainPage),
        isDesktop: readonly(state._isDesktop),
        currentPath: readonly(state._currentPath),
        // 함수들
        handleMobileMenuToggle,
        handleLanguageListToggle,
        handleLanguageListClose,
        handleSubMenuToggle,
        handleMenuClick,
        handleMainMenuClick,
        getSubItemPath,
        getSubItemLink,
        handleAnchorClick,
        handleUrlAnchor,
        scrollToTop,
        scrollToElement,
        handleLogoClick,
    }
}
