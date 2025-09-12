<template>
  <div class="recaptcha-checkbox-container">
    <div class="checkbox-wrapper">
      <label class="checkbox-label" :class="{ disabled: isExecuting || !isRecaptchaReady }">
        <input
          type="checkbox"
          v-model="isChecked"
          @change="handleCheckboxChange"
          :disabled="isExecuting || !isRecaptchaReady || (isVerified && !reVerifyReason) || !canVerify"
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
        <div class="checkbox-content">
          <RecaptchaLoadingComponent 
            v-if="isExecuting"
            loading-text="Generating reCAPTCHA token..."
          />
          <div v-else-if="isVerified" class="verified-content">
            <svg
              class="verified-check"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
            </svg>
            <span class="verified-text">Verified</span>
            <span v-if="displayTime > 0" class="token-expiry">
              ({{ formatTime(displayTime) }})
            </span>
          </div>
          <div v-else class="checkbox-text">
            This site is protected by reCAPTCHA and the Google 
            <a 
              href="https://policies.google.com/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              class="recaptcha-link"
            >
              Privacy Policy
            </a>
            and 
            <a 
              href="https://policies.google.com/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              class="recaptcha-link"
            >
              Terms of Service
            </a>
            apply.
          </div>
        </div>
      </label>
    </div>
    
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
    
    <!-- Verification limit message -->
    <div v-if="verificationCount >= MAX_NORMAL_VERIFICATIONS && !reVerifyReason" class="limit-message">
      최대 검증 횟수({{ MAX_NORMAL_VERIFICATIONS }}회)를 초과했습니다.
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

const { 
  executeRecaptcha, 
  isRecaptchaReady, 
  isExecuting, 
  lastError, 
  initializeRecaptcha,
  isTokenValid,
  tokenExpiresIn
} = useRecaptcha()

const isChecked = ref(props.modelValue)
const isVerified = ref(false)
const errorMessage = ref<string | null>(null)
const verifiedToken = ref<string | null>(null)

// Verification attempt management
const verificationCount = ref(0)
const MAX_NORMAL_VERIFICATIONS = 3
const reVerifyReason = ref<'submission_failed' | 'token_expired' | null>(null)

// Real-time countdown display
const displayTime = ref(0)
let countdownInterval: NodeJS.Timeout | null = null

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

// Check if verification is allowed
const canVerify = computed(() => {
  // 1. Cannot verify if already executing
  if (isExecuting.value) return false
  
  // 2. Always allow if there's a valid re-verification reason
  if (reVerifyReason.value) return true
  
  // 3. For normal verifications, check attempt limit
  return verificationCount.value < MAX_NORMAL_VERIFICATIONS
})

// Format time display
const formatTime = (seconds: number) => {
  if (seconds > 60) {
    return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`
  }
  return `${seconds}초`
}

// Start countdown timer
const startCountdown = () => {
  displayTime.value = tokenExpiresIn.value
  
  if (countdownInterval) clearInterval(countdownInterval)
  
  countdownInterval = setInterval(() => {
    if (displayTime.value > 0) {
      displayTime.value--
    } else {
      stopCountdown()
      // Auto-enable re-verification when token expires
      if (isVerified.value) {
        errorMessage.value = '토큰이 만료되었습니다. 다시 검증해주세요.'
        enableReVerification('token_expired')
      }
    }
  }, 1000) // Update every second
}

// Stop countdown timer
const stopCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  displayTime.value = 0
}


const executeRecaptchaVerification = async (): Promise<boolean> => {
  try {
    errorMessage.value = null
    console.log(`Executing reCAPTCHA for action: ${props.action}`)
    
    const result = await executeRecaptcha(props.action)
    
    if (result.success && result.token) {
      isVerified.value = true
      verifiedToken.value = result.token
      emit('verified', result.token)
      startCountdown() // Start real-time countdown
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

  // Check if already verified with valid token
  if (isVerified.value && isTokenValid()) {
    console.log('Token is still valid (remaining:', tokenExpiresIn.value, 'seconds)')
    isChecked.value = true
    return
  }

  if (!isRecaptchaReady.value) {
    errorMessage.value = 'reCAPTCHA가 준비되지 않았습니다'
    isChecked.value = false
    return
  }

  // Check if verification is allowed
  if (!canVerify.value) {
    isChecked.value = false
    if (verificationCount.value >= MAX_NORMAL_VERIFICATIONS) {
      errorMessage.value = '최대 검증 횟수를 초과했습니다'
    } else {
      errorMessage.value = '이미 검증 중입니다'
    }
    return
  }

  const success = await executeRecaptchaVerification()
  if (success) {
    // Only increment counter for normal user-initiated verifications
    if (!reVerifyReason.value) {
      verificationCount.value++
    }
    reVerifyReason.value = null // Clear re-verification reason
  } else {
    // 검증 실패 시 체크 해제
    isChecked.value = false
  }
}

const resetVerification = () => {
  isVerified.value = false
  verifiedToken.value = null
  errorMessage.value = null
  stopCountdown() // Stop timer when resetting
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
  reVerifyReason.value = null
  stopCountdown() // Stop timer when resetting
}

// Enable re-verification (called by parent component)
const enableReVerification = (reason: 'submission_failed' | 'token_expired') => {
  reVerifyReason.value = reason
  isChecked.value = false
  isVerified.value = false
  verifiedToken.value = null
  errorMessage.value = null
  stopCountdown() // Stop timer when enabling re-verification
  console.log(`Re-verification enabled due to: ${reason}`)
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

// Cleanup timer on unmount
onUnmounted(() => {
  stopCountdown()
  console.log('RecaptchaCheckboxComponent unmounted, timer cleaned up')
})

// Watch for lastError from composable
watch(lastError, (newError) => {
  if (newError) {
    errorMessage.value = newError
  }
})

// Note: tokenExpiresIn watch removed - now handled by real-time countdown timer

defineExpose({
  verify,
  reset,
  enableReVerification,
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

.checkbox-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkbox-text {
  color: var(--black);
  font-weight: var(--weight500);
  font-size: var(--txt14);
  line-height: 1.4;
}

.verified-content {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #22c55e;
  font-weight: var(--weight600);
}

.verified-check {
  color: #22c55e;
}

.verified-text {
  color: #22c55e;
  font-size: var(--txt14);
  font-weight: var(--weight600);
}

.token-expiry {
  color: #6b7280;
  font-size: var(--txt12);
  font-weight: var(--weight400);
  margin-left: 4px;
}


.recaptcha-link {
  color: #4285f4;
  text-decoration: none;
  font-weight: var(--weight500);
  transition: all 0.2s ease;
}

.recaptcha-link:hover {
  text-decoration: underline;
  color: #3367d6;
}

.recaptcha-link:focus {
  outline: 2px solid rgba(66, 133, 244, 0.3);
  outline-offset: 2px;
  border-radius: 2px;
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

.limit-message {
  margin-top: 8px;
  color: #f59e0b;
  font-size: var(--txt12);
  line-height: 1.4;
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 4px;
  padding: 8px 12px;
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