<script setup lang="ts">
interface RegisterData {
  email: string;
  password: string;
  recaptchaToken?: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

defineEmits<{
  'switch-to-login': []
}>()

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const formData = ref<RegisterFormData>({
  email: '',
  password: '',
  confirmPassword: ''
})

const errorMessage = ref('')
const isSubmitting = ref(false)
const recaptchaValidated = ref(false)
const recaptchaToken = ref<string | null>(null)

// reCAPTCHA composable
const { executeRecaptcha, isRecaptchaReady, isExecuting, lastError, initializeRecaptcha } = useRecaptcha()

// Initialize reCAPTCHA when component mounts
onMounted(async () => {
  console.log('RegisterFormComponent mounted, initializing reCAPTCHA...')
  await initializeRecaptcha()
})

const isFormValid = computed(() => {
  return formData.value.email &&
      formData.value.password &&
      formData.value.confirmPassword &&
      formData.value.email.includes('@') &&
      formData.value.password.length >= 8 &&
      formData.value.password === formData.value.confirmPassword
})

const clearError = () => {
  errorMessage.value = ''
}

// Step 1: reCAPTCHA token generation (backend will validate)
const generateRecaptchaToken = async (): Promise<boolean> => {
  try {
    // Generate reCAPTCHA token using new composable
    const result = await executeRecaptcha('register')
    
    if (!result.success || !result.token) {
      errorMessage.value = result.error || 'reCAPTCHA 토큰 생성에 실패했습니다'
      return false
    }

    // Store the token for registration (backend will validate)
    recaptchaValidated.value = true
    recaptchaToken.value = result.token
    return true
  } catch (error: any) {
    console.error('reCAPTCHA token generation error:', error)
    errorMessage.value = 'reCAPTCHA 토큰 생성 중 오류가 발생했습니다'
    return false
  }
}

// Step 2: Registration submission
const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return

  isSubmitting.value = true
  clearError()

  // Basic validation
  if (formData.value.password !== formData.value.confirmPassword) {
    errorMessage.value = t('password_mismatch')
    isSubmitting.value = false
    return
  }

  if (formData.value.password.length < 8) {
    errorMessage.value = t('password_too_short')
    isSubmitting.value = false
    return
  }

  try {
    // Step 1: Generate reCAPTCHA token if not already generated
    if (!recaptchaValidated.value) {
      const recaptchaValid = await generateRecaptchaToken()
      if (!recaptchaValid) {
        isSubmitting.value = false
        return
      }
    }

    // Step 2: Submit registration
    const registerData: RegisterData = {
      email: formData.value.email,
      password: formData.value.password
    }

    // Add validated reCAPTCHA token
    if (recaptchaToken.value) {
      registerData.recaptchaToken = recaptchaToken.value
    }

    const success = await authStore.register(registerData)

    if (success) {
      $emit('switch-to-login')
    } else {
      errorMessage.value = t('register_failed')
      // Reset reCAPTCHA validation on registration failure
      recaptchaValidated.value = false
      recaptchaToken.value = null
    }
  } catch (error: any) {
    console.error('Registration error:', error)
    errorMessage.value = error?.message || t('register_failed')
    // Reset reCAPTCHA validation on error
    recaptchaValidated.value = false
    recaptchaToken.value = null
  } finally {
    isSubmitting.value = false
  }
}

// Manual reCAPTCHA token generation button handler
const handleRecaptchaVerify = async () => {
  clearError()
  await generateRecaptchaToken()
}

const { t } = useI18n()
</script>

<template>
  <div class="auth-container">
    <div class="auth-box">
      <div>
        <h2 class="auth-title">
          {{ t('sign_up_title') }}
        </h2>
        <p class="auth-subtitle">
          {{ t('sign_up_subtitle') }}
        </p>
      </div>
      
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div>
            <label for="email" class="sr-only">
              {{ t('email_label') }}
            </label>
            <input
              id="email"
              v-model="formData.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="auth-input"
              :placeholder="t('email_placeholder')"
              @keydown="clearError"
            />
          </div>
          
          <div>
            <label for="password" class="sr-only">
              {{ t('password_label') }}
            </label>
            <input
              id="password"
              v-model="formData.password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              class="auth-input"
              :placeholder="t('password_placeholder')"
              @keydown="clearError"
            />
          </div>
          
          <div>
            <label for="confirmPassword" class="sr-only">
              {{ t('confirm_password_label') }}
            </label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              class="auth-input"
              :placeholder="t('confirm_password_placeholder')"
              @keydown="clearError"
            />
          </div>
        </div>

        <!-- reCAPTCHA Status and Verification -->
        <RecaptchaStatusComponent
          :is-recaptcha-ready="isRecaptchaReady"
          :is-executing="isExecuting"
          :last-error="lastError"
        />
        
        <div v-if="!recaptchaValidated && isRecaptchaReady" class="recaptcha-verify">
          <button
            type="button"
            class="recaptcha-button"
            :disabled="isExecuting"
            @click="handleRecaptchaVerify"
          >
            {{ isExecuting ? 'reCAPTCHA 토큰 생성 중...' : 'reCAPTCHA 토큰 생성하기' }}
          </button>
        </div>

        <div v-if="recaptchaValidated" class="recaptcha-success">
          <svg class="success-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
          </svg>
          <span>reCAPTCHA 토큰 생성 완료</span>
        </div>

        <div v-if="errorMessage" class="auth-error">
          {{ errorMessage }}
        </div>

        <div>
          <button
            type="submit"
            class="auth-button"
            :disabled="!isFormValid || isSubmitting || (!recaptchaValidated && isRecaptchaReady)"
          >
            {{ isSubmitting ? t('submitting') : t('sign_up') }}
          </button>
        </div>

        <div class="text-center">
          <span class="text-sm text-gray-600">
            {{ t('have_account') }}
            <button
              type="button"
              class="auth-link"
              @click="$emit('switch-to-login')"
            >
              {{ t('sign_in') }}
            </button>
          </span>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--gray_f);
  padding: 50px 20px;
}

.auth-box {
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
}

.auth-title {
  margin: 20px 0 0 0;
  text-align: center;
  font-size: var(--txt24);
  font-weight: var(--weight700);
  color: var(--black);
}

.auth-subtitle {
  margin: 8px 0 0 0;
  text-align: center;
  font-size: var(--txt14);
  color: var(--dark);
}

.auth-form {
  margin: 32px 0 0 0;
}

.auth-form .space-y-4 > div:not(:first-child) {
  margin-top: 16px;
}

.auth-input {
  appearance: none;
  border-radius: 8px;
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--gray_d);
  font-size: var(--txt14);
  color: var(--black);
  background-color: var(--white);
}

.auth-input::placeholder {
  color: #999;
}

.auth-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(69, 69, 193, 0.1);
}

.auth-button {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 20px;
  margin: 24px 0 0 0;
  border: none;
  font-size: var(--txt14);
  font-weight: var(--weight700);
  border-radius: 8px;
  color: var(--white);
  background-color: var(--primary);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.auth-button:hover:not(:disabled) {
  background-color: var(--sub_primary);
}

.auth-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(69, 69, 193, 0.3);
}

.auth-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-error {
  color: var(--sub_primary);
  font-size: var(--txt14);
  text-align: center;
  margin: 16px 0 0 0;
}

.text-center {
  text-align: center;
  margin: 24px 0 0 0;
}

.text-sm {
  font-size: var(--txt14);
}

.text-gray-600 {
  color: var(--dark);
}

.auth-link {
  font-weight: var(--weight700);
  color: var(--primary);
  cursor: pointer;
  border: none;
  background: none;
  font-size: inherit;
  text-decoration: underline;
}

.auth-link:hover {
  color: var(--sub_primary);
}

/* reCAPTCHA specific styles */
.recaptcha-verify {
  margin: 16px 0;
  text-align: center;
}

.recaptcha-button {
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: var(--txt14);
  font-weight: var(--weight500);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.recaptcha-button:hover:not(:disabled) {
  background-color: #3367d6;
}

.recaptcha-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.recaptcha-success {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 16px 0;
  padding: 12px;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #15803d;
  font-size: var(--txt14);
  font-weight: var(--weight500);
}

.success-icon {
  color: #22c55e;
}
</style>