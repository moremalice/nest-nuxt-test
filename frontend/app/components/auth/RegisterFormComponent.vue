<script setup lang="ts">
interface RegisterData {
  email: string;
  password: string;
}

interface RegisterFormData extends RegisterData {
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

const handleSubmit = async () => {
  if (!isFormValid.value) return

  clearError()

  if (formData.value.password !== formData.value.confirmPassword) {
    errorMessage.value = t('password_mismatch')
    return
  }

  if (formData.value.password.length < 6) {
    errorMessage.value = t('password_too_short')
    return
  }

  const success = await authStore.register({
    email: formData.value.email,
    password: formData.value.password
  })

  if (success) {
    $emit('switch-to-login')
  } else {
    errorMessage.value = t('register_failed')
  }
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

        <div v-if="errorMessage" class="auth-error">
          {{ errorMessage }}
        </div>

        <div>
          <button
            type="submit"
            class="auth-button"
            :disabled="!isFormValid"
          >
            {{ t('sign_up') }}
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
</style>