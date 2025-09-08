// composables/ui/useLoadingUI.ts
const isLoading = ref(false)

export const useLoadingUI = () => {
    const showLoading = () => {
        isLoading.value = true
    }

    const hideLoading = () => {
        isLoading.value = false
    }

    return {
        isLoading: readonly(isLoading),
        showLoading,
        hideLoading
    }
}

