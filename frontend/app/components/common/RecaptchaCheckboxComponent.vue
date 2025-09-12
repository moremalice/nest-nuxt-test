<template>
  <div class="recaptcha-checkbox-container">
    <div class="checkbox-wrapper">
      <label class="checkbox-label" :class="{ disabled: isExecuting || !isRecaptchaReady }">
        <input
          type="checkbox"
          v-model="isChecked"
          @change="handleCheckboxChange"
          :disabled="isExecuting || !isRecaptchaReady"
          class="checkbox-input"
        />
        <span class="checkbox-custom" :class="checkboxStateClass">
          <svg
            v-if="isVerified"
            class="check-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
          </svg>
          <svg
            v-else-if="isExecuting"
            class="loading-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M8 3.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zM8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0zM8 1a7 7 0 1 1-7 7 7 7 0 0 1 7-7z"/>
          </svg>
        </span>
        <span class="checkbox-text">
          {{ checkboxText }}
        </span>
      </label>
    </div>
    
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
    
    <div v-if="showRetry && errorMessage && !isVerified && !isExecuting" class="retry-section">
      <button
        type="button"
        class="retry-button"
        @click="handleRetry"
      >
        다시 시도
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: boolean
  action?: string
  autoExecute?: boolean
  showRetry?: boolean
}

interface Emits {
  'update:modelValue': [value: boolean]
  'verified': [token: string]
  'error': [error: string]
  'retry': []
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  action: 'register',
  autoExecute: false,
  showRetry: true
})

const emit = defineEmits<Emits>()

const { executeRecaptcha, isRecaptchaReady, isExecuting, lastError, initializeRecaptcha } = useRecaptcha()

const isChecked = ref(props.modelValue)
const isVerified = ref(false)
const errorMessage = ref<string | null>(null)
const verifiedToken = ref<string | null>(null)

watch(() => props.modelValue, (newValue) => {
  isChecked.value = newValue
})

watch(isChecked, (newValue) => {
  emit('update:modelValue', newValue)
})

const checkboxStateClass = computed(() => ({
  'checkbox-verified': isVerified.value,
  'checkbox-loading': isExecuting.value,
  'checkbox-error': !!errorMessage.value,
  'checkbox-unchecked': !isChecked.value && !isVerified.value
}))

const checkboxText = computed(() => {
  if (isExecuting.value) return 'reCAPTCHA 토큰 생성 중...'
  if (isVerified.value) return '로봇이 아닙니다 ✓'
  return '로봇이 아닙니다'
})

const executeRecaptchaVerification = async (): Promise<boolean> => {
  try {
    errorMessage.value = null
    console.log(`Executing reCAPTCHA for action: ${props.action}`)
    
    const result = await executeRecaptcha(props.action)
    
    if (result.success && result.token) {
      isVerified.value = true
      verifiedToken.value = result.token
      emit('verified', result.token)
      console.log('reCAPTCHA token generated successfully')
      return true
    } else {
      const error = result.error || 'reCAPTCHA 토큰 생성에 실패했습니다'
      errorMessage.value = error
      emit('error', error)
      console.error('reCAPTCHA token generation failed:', error)
      return false
    }
  } catch (error: any) {
    const errorMsg = error?.message || 'reCAPTCHA 실행 중 오류가 발생했습니다'
    errorMessage.value = errorMsg
    emit('error', errorMsg)
    console.error('reCAPTCHA execution error:', error)
    return false
  }
}

const handleCheckboxChange = async () => {
  if (!isChecked.value) {
    // 체크 해제 시 검증 상태 리셋
    resetVerification()
    return
  }

  if (!isRecaptchaReady.value) {
    errorMessage.value = 'reCAPTCHA가 준비되지 않았습니다'
    isChecked.value = false
    return
  }

  const success = await executeRecaptchaVerification()
  if (!success) {
    // 검증 실패 시 체크 해제
    isChecked.value = false
  }
}

const resetVerification = () => {
  isVerified.value = false
  verifiedToken.value = null
  errorMessage.value = null
}

const handleRetry = async () => {
  resetVerification()
  emit('retry')
  
  if (isChecked.value) {
    await executeRecaptchaVerification()
  }
}

// Public methods for parent component
const verify = async (): Promise<string | null> => {
  if (isVerified.value && verifiedToken.value) {
    return verifiedToken.value
  }
  
  const success = await executeRecaptchaVerification()
  return success ? verifiedToken.value : null
}

const reset = () => {
  resetVerification()
  isChecked.value = false
}

// Auto-execute on mount if specified
onMounted(async () => {
  console.log('RecaptchaCheckboxComponent mounted')
  await initializeRecaptcha()
  
  if (props.autoExecute && isRecaptchaReady.value) {
    isChecked.value = true
    await executeRecaptchaVerification()
  }
})

// Watch for lastError from composable
watch(lastError, (newError) => {
  if (newError) {
    errorMessage.value = newError
  }
})

defineExpose({
  verify,
  reset,
  isVerified: readonly(isVerified),
  verifiedToken: readonly(verifiedToken)
})
</script>

<style scoped>
.recaptcha-checkbox-container {
  margin: 16px 0;
}

.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: var(--txt14);
  line-height: 1.5;
  transition: opacity 0.2s ease;
}

.checkbox-label.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  position: relative;
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray_d);
  border-radius: 4px;
  background-color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox-custom.checkbox-unchecked {
  border-color: var(--gray_d);
  background-color: var(--white);
}

.checkbox-custom.checkbox-loading {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.checkbox-custom.checkbox-verified {
  border-color: #22c55e;
  background-color: #22c55e;
}

.checkbox-custom.checkbox-error {
  border-color: var(--sub_primary);
  background-color: #fef2f2;
}

.check-icon {
  color: white;
}

.loading-icon {
  color: #3b82f6;
  animation: spin 1s linear infinite;
}

.checkbox-text {
  color: var(--black);
  font-weight: var(--weight500);
}

.error-message {
  margin-top: 8px;
  color: var(--sub_primary);
  font-size: var(--txt12);
  line-height: 1.4;
}

.retry-section {
  margin-top: 8px;
}

.retry-button {
  background: none;
  border: none;
  color: var(--primary);
  font-size: var(--txt12);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.retry-button:hover:not(:disabled) {
  color: var(--sub_primary);
}

.retry-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Hover effects */
.checkbox-label:not(.disabled):hover .checkbox-custom.checkbox-unchecked {
  border-color: var(--primary);
}

/* Focus styles for accessibility */
.checkbox-label:focus-within .checkbox-custom {
  box-shadow: 0 0 0 2px rgba(69, 69, 193, 0.1);
}
</style>