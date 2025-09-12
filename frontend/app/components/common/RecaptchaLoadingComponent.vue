<template>
  <div class="recaptcha-loading">
    <div class="loading-dots">
      <div class="dot dot-1"></div>
      <div class="dot dot-2"></div>
      <div class="dot dot-3"></div>
    </div>
    <span class="loading-text">{{ loadingText }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  loadingText?: string
}

const props = withDefaults(defineProps<Props>(), {
  loadingText: 'Verifying...'
})
</script>

<style scoped>
.recaptcha-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4285f4;
  font-size: var(--txt14);
  font-weight: var(--weight500);
}

.loading-dots {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #4285f4;
  animation: pulse 1.4s ease-in-out infinite;
}

.dot-1 {
  animation-delay: 0s;
}

.dot-2 {
  animation-delay: 0.2s;
}

.dot-3 {
  animation-delay: 0.4s;
}

.loading-text {
  color: #4285f4;
  font-size: var(--txt14);
}

@keyframes pulse {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
  }
}
</style>