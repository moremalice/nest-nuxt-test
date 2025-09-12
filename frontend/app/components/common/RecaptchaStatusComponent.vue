<template>
  <div v-if="showStatus" class="recaptcha-status">
    <div class="recaptcha-info">
      <div class="recaptcha-icon">
        <svg
          v-if="isRecaptchaReady"
          class="icon-ready"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
        </svg>
        <svg
          v-else-if="isExecuting"
          class="icon-loading"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8 3.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zM8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0zM8 1a7 7 0 1 1-7 7 7 7 0 0 1 7-7z"/>
        </svg>
        <svg
          v-else
          class="icon-waiting"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        </svg>
      </div>
      <div class="recaptcha-text">
        <span v-if="isExecuting" class="status-text executing">
          reCAPTCHA 처리 중...
        </span>
        <span v-else-if="isRecaptchaReady" class="status-text ready">
          reCAPTCHA 준비 완료
        </span>
        <span v-else class="status-text waiting">
          reCAPTCHA 로딩 중...
        </span>
      </div>
    </div>
    <div v-if="lastError" class="recaptcha-error">
      {{ lastError }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isRecaptchaReady?: boolean
  isExecuting?: boolean
  lastError?: string | null
  showStatus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isRecaptchaReady: false,
  isExecuting: false,
  lastError: null,
  showStatus: true
})

// No i18n needed - using hardcoded Korean text
</script>

<style scoped>
.recaptcha-status {
  margin: 16px 0;
  padding: 12px;
  background-color: var(--gray_f);
  border: 1px solid var(--gray_d);
  border-radius: 8px;
  font-size: var(--txt14);
}

.recaptcha-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recaptcha-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-ready {
  color: #22c55e;
}

.icon-loading {
  color: #3b82f6;
  animation: spin 1s linear infinite;
}

.icon-waiting {
  color: #6b7280;
}

.recaptcha-text {
  flex: 1;
}

.status-text {
  font-weight: var(--weight500);
}

.status-text.ready {
  color: #22c55e;
}

.status-text.executing {
  color: #3b82f6;
}

.status-text.waiting {
  color: #6b7280;
}

.recaptcha-error {
  margin-top: 8px;
  color: var(--sub_primary);
  font-size: var(--txt12);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* reCAPTCHA badge styling (global) */
:global(.grecaptcha-badge) {
  z-index: 1000;
}
</style>