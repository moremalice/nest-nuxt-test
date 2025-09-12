<template>
  <div class="recaptcha-container">
    <div v-if="showBranding" class="recaptcha-branding">
      <p class="branding-text">
        이 사이트는 reCAPTCHA에 의해 보호
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">개인정보처리방침</a>과
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener">서비스 약관</a>이 적용됩니다.
      </p>
    </div>

    <div v-if="showStatus && status" class="recaptcha-status" :class="statusClass">
      <div class="status-icon">{{ statusIcon }}</div>
      <span class="status-message">{{ status }}</span>
    </div>

    <div v-if="showDebug && debugInfo" class="recaptcha-debug">
      <details class="debug-details">
        <summary>reCAPTCHA 디버그 정보</summary>
        <pre class="debug-content">{{ debugInfo }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showBranding?: boolean
  showStatus?: boolean
  showDebug?: boolean
  autoExecute?: boolean
  action?: string
  disabled?: boolean
}

interface RecaptchaStatus {
  type: 'loading' | 'success' | 'error' | 'ready'
  message: string
}

const props = withDefaults(defineProps<Props>(), {
  showBranding: true,
  showStatus: true,
  showDebug: false,
  autoExecute: false,
  action: 'verify',
  disabled: false
})

const emit = defineEmits<{
  ready: []
  token: [token: string]
  error: [error: string]
}>()

const { executeRecaptcha, isRecaptchaLoaded, initializeRecaptcha } = useRecaptcha()

const status = ref<string>('')
const statusType = ref<RecaptchaStatus['type']>('loading')
const debugInfo = ref<any>(null)
const isReady = ref<boolean>(false)
const isExecuting = ref<boolean>(false)

const statusClass = computed(() => ({
  'status-loading': statusType.value === 'loading',
  'status-success': statusType.value === 'success',
  'status-error': statusType.value === 'error',
  'status-ready': statusType.value === 'ready'
}))

const statusIcon = computed(() => {
  switch (statusType.value) {
    case 'loading': return '⏳'
    case 'success': return '✅'
    case 'error': return '❌'
    case 'ready': return '🔒'
    default: return '🔒'
  }
})

const updateStatus = (type: RecaptchaStatus['type'], message: string) => {
  statusType.value = type
  status.value = message
}

const executeAction = async (action: string = props.action): Promise<string | null> => {
  if (props.disabled || isExecuting.value) {
    console.warn('reCAPTCHA는 현재 비활성화되어 있거나 실행 중입니다.')
    return null
  }

  isExecuting.value = true
  updateStatus('loading', 'reCAPTCHA 처리 중...')
  
  try {
    const result = await executeRecaptcha(action)
    
    if (props.showDebug) {
      debugInfo.value = {
        action,
        timestamp: new Date().toISOString(),
        success: result.success,
        tokenLength: result.token?.length || 0,
        error: result.error,
        disabled: props.disabled,
        ready: isReady.value
      }
    }
    
    if (result.success && result.token) {
      updateStatus('success', 'reCAPTCHA 검증 완료')
      emit('token', result.token)
      return result.token
    } else {
      const errorMsg = result.error || 'reCAPTCHA 토큰 생성 실패'
      updateStatus('error', errorMsg)
      emit('error', errorMsg)
      return null
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'reCAPTCHA 실행 오류'
    updateStatus('error', errorMsg)
    emit('error', errorMsg)
    return null
  } finally {
    isExecuting.value = false
  }
}

const checkReady = async () => {
  try {
    if (props.disabled) {
      updateStatus('ready', 'reCAPTCHA 비활성화됨')
      isReady.value = false
      return
    }

    const isLoaded = await isRecaptchaLoaded()
    if (isLoaded) {
      isReady.value = true
      updateStatus('ready', 'reCAPTCHA 준비 완료')
      emit('ready')
      
      if (props.autoExecute && !props.disabled) {
        await executeAction()
      }
    } else {
      isReady.value = false
      updateStatus('error', 'reCAPTCHA 로드 실패')
    }
  } catch (error) {
    isReady.value = false
    const errorMsg = error instanceof Error ? error.message : 'reCAPTCHA 초기화 오류'
    updateStatus('error', errorMsg)
    console.error('reCAPTCHA 초기화 오류:', error)
  }
}

onMounted(async () => {
  updateStatus('loading', 'reCAPTCHA 초기화 중...')
  await checkReady()
})

defineExpose({
  executeAction,
  checkReady,
  isReady: readonly(isReady),
  isExecuting: readonly(isExecuting)
})
</script>

<style scoped>
.recaptcha-container {
  margin: 1rem 0;
}

.recaptcha-branding {
  margin-bottom: 1rem;
}

.branding-text {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

.branding-text a {
  color: #4f46e5;
  text-decoration: none;
}

.branding-text a:hover {
  text-decoration: underline;
}

.recaptcha-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease-in-out;
}

.status-loading {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fed7aa;
}

.status-success {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status-error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.status-ready {
  background-color: #e0e7ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
}

.status-icon {
  flex-shrink: 0;
}

.status-message {
  font-weight: 500;
}

.recaptcha-debug {
  margin-top: 1rem;
}

.debug-details {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.75rem;
  background-color: #f9fafb;
}

.debug-details summary {
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  user-select: none;
}

.debug-details summary:hover {
  color: #111827;
}

.debug-content {
  margin-top: 0.75rem;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  background-color: #ffffff;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #d1d5db;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 640px) {
  .recaptcha-status {
    padding: 0.5rem 0.75rem;
  }
  
  .branding-text {
    font-size: 0.6875rem;
  }
}
</style>