<template>
  <div class="recaptcha-demo-container">
    <div class="demo-content">
      <!-- 페이지 헤더 -->
      <div class="demo-header">
        <h1 class="demo-title">reCAPTCHA v3 데모</h1>
        <p class="demo-description">Google reCAPTCHA v3를 사용한 현대적인 스팸 방지 시스템입니다.</p>
      </div>

      <!-- reCAPTCHA 컴포넌트 섹션 -->
      <div class="demo-section">
        <h2 class="section-title">reCAPTCHA 상태</h2>
        <RecaptchaComponent
          ref="recaptchaRef"
          :show-branding="true"
          :show-status="true"
          :show-debug="showDebugMode"
          :auto-execute="false"
          action="demo"
          @ready="handleRecaptchaReady"
          @token="handleRecaptchaToken"
          @error="handleRecaptchaError"
        />
        
        <div class="control-buttons">
          <button
            class="btn btn-primary"
            @click="executeRecaptcha"
            :disabled="!isReady || isExecuting">
            <span v-if="isExecuting">토큰 생성 중...</span>
            <span v-else>reCAPTCHA 토큰 생성</span>
          </button>
          
          <button
            class="btn btn-secondary"
            @click="toggleDebugMode">
            {{ showDebugMode ? '디버그 모드 끄기' : '디버그 모드 켜기' }}
          </button>
        </div>
      </div>

      <!-- 폼 제출 예제 -->
      <div class="demo-section">
        <h2 class="section-title">폼 제출 예제</h2>
        <form @submit.prevent="handleFormSubmit" class="demo-form">
          <div class="form-group">
            <label for="name" class="form-label">이름:</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="홍길동"
              required
            />
          </div>

          <div class="form-group">
            <label for="email" class="form-label">이메일:</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              class="form-input"
              placeholder="example@email.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="message" class="form-label">메시지:</label>
            <textarea
              id="message"
              v-model="formData.message"
              class="form-textarea"
              placeholder="메시지를 입력하세요..."
              rows="4"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            class="btn btn-success"
            :disabled="isSubmitting">
            <span v-if="isSubmitting">제출 중...</span>
            <span v-else>폼 제출</span>
          </button>
        </form>

        <!-- 제출 결과 -->
        <div v-if="submitResult" class="submit-result" :class="submitResult.success ? 'result-success' : 'result-error'">
          <div class="result-icon">{{ submitResult.success ? '✅' : '❌' }}</div>
          <div class="result-content">
            <h3 class="result-title">{{ submitResult.success ? '제출 성공' : '제출 실패' }}</h3>
            <p class="result-message">{{ submitResult.message }}</p>
            <div v-if="submitResult.data" class="result-data">
              <details class="data-details">
                <summary>제출된 데이터</summary>
                <pre class="data-content">{{ JSON.stringify(submitResult.data, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>
      </div>

      <!-- 토큰 정보 표시 -->
      <div v-if="latestToken" class="demo-section">
        <h2 class="section-title">생성된 토큰</h2>
        <div class="token-display">
          <div class="token-info">
            <p class="token-meta">생성 시간: {{ tokenTimestamp }}</p>
            <p class="token-meta">토큰 길이: {{ latestToken.length }} 문자</p>
          </div>
          <div class="token-content">
            <label class="token-label">reCAPTCHA 토큰:</label>
            <textarea
              class="token-textarea"
              :value="latestToken"
              readonly
              rows="6"
            ></textarea>
          </div>
          <button
            class="btn btn-outline"
            @click="copyToken">
            {{ tokenCopied ? '복사됨!' : '토큰 복사' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'reCAPTCHA 데모',
  description: 'Google reCAPTCHA v3 기능 데모 페이지'
})

const { executeRecaptcha: executeRecaptchaComposable } = useRecaptcha()

const recaptchaRef = ref()
const isReady = ref(false)
const isExecuting = ref(false)
const isSubmitting = ref(false)
const showDebugMode = ref(false)
const latestToken = ref<string>('')
const tokenTimestamp = ref<string>('')
const tokenCopied = ref(false)

const formData = ref({
  name: '',
  email: '',
  message: ''
})

interface SubmitResult {
  success: boolean
  message: string
  data?: any
}

const submitResult = ref<SubmitResult | null>(null)

const handleRecaptchaReady = () => {
  isReady.value = true
  console.log('reCAPTCHA가 준비되었습니다.')
}

const handleRecaptchaToken = (token: string) => {
  latestToken.value = token
  tokenTimestamp.value = new Date().toLocaleString('ko-KR')
  console.log('reCAPTCHA 토큰을 받았습니다:', token.substring(0, 50) + '...')
}

const handleRecaptchaError = (error: string) => {
  console.error('reCAPTCHA 오류:', error)
}

const executeRecaptcha = async () => {
  if (!isReady.value || isExecuting.value) return

  isExecuting.value = true
  try {
    if (recaptchaRef.value) {
      await recaptchaRef.value.executeAction('manual_trigger')
    }
  } finally {
    isExecuting.value = false
  }
}

const toggleDebugMode = () => {
  showDebugMode.value = !showDebugMode.value
}

const handleFormSubmit = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  submitResult.value = null

  try {
    const recaptchaResult = await executeRecaptchaComposable('form_submit')
    
    if (!recaptchaResult.success || !recaptchaResult.token) {
      submitResult.value = {
        success: false,
        message: recaptchaResult.error || 'reCAPTCHA 검증에 실패했습니다.'
      }
      return
    }

    const submitData = {
      ...formData.value,
      'g-recaptcha-response': recaptchaResult.token,
      timestamp: new Date().toISOString()
    }

    // 실제 서버로 전송하는 대신 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    submitResult.value = {
      success: true,
      message: '폼이 성공적으로 제출되었습니다. (시뮬레이션)',
      data: submitData
    }

    formData.value = { name: '', email: '', message: '' }

  } catch (error) {
    submitResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const copyToken = async () => {
  if (!latestToken.value) return

  try {
    await navigator.clipboard.writeText(latestToken.value)
    tokenCopied.value = true
    setTimeout(() => {
      tokenCopied.value = false
    }, 2000)
  } catch (error) {
    console.error('토큰 복사 실패:', error)
  }
}

onUnmounted(() => {
  if (tokenCopied.value) {
    tokenCopied.value = false
  }
})
</script>

<style scoped>
.recaptcha-demo-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.demo-content {
  max-width: 48rem;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 3rem;
}

.demo-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
}

.demo-description {
  font-size: 1.125rem;
  color: #6b7280;
}

.demo-section {
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
}

.control-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.demo-form {
  max-width: 32rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 6rem;
}

.submit-result {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.375rem;
  margin-top: 1.5rem;
}

.result-success {
  background-color: #dcfce7;
  border: 1px solid #bbf7d0;
}

.result-error {
  background-color: #fee2e2;
  border: 1px solid #fecaca;
}

.result-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.result-content {
  flex: 1;
}

.result-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.result-message {
  color: #374151;
  margin-bottom: 0.75rem;
}

.data-details {
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.5);
}

.data-details summary {
  cursor: pointer;
  font-weight: 500;
  color: #4b5563;
}

.data-content {
  margin-top: 0.5rem;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
}

.token-display {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  background-color: #f9fafb;
}

.token-info {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.token-meta {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.token-content {
  margin-bottom: 1rem;
}

.token-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.token-textarea {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  background-color: #ffffff;
  resize: none;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: all 0.15s ease-in-out;
  cursor: pointer;
  border: none;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #4f46e5;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #4338ca;
}

.btn-secondary {
  background-color: #6b7280;
  color: #ffffff;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #4b5563;
}

.btn-success {
  background-color: #059669;
  color: #ffffff;
}

.btn-success:hover:not(:disabled) {
  background-color: #047857;
}

.btn-outline {
  background-color: transparent;
  color: #4f46e5;
  border: 1px solid #4f46e5;
}

.btn-outline:hover {
  background-color: #4f46e5;
  color: #ffffff;
}

@media (max-width: 768px) {
  .demo-title {
    font-size: 1.875rem;
  }

  .demo-section {
    padding: 1.5rem;
  }

  .control-buttons {
    flex-direction: column;
  }

  .token-info {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 640px) {
  .recaptcha-demo-container {
    padding: 1.5rem 0.75rem;
  }
}
</style>