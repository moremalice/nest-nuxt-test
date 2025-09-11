<template>
  <div class="qrcode-container">
    <!-- QR 코드 생성 -->
    <div class="qrcode-generator">
      <h3 v-if="title" class="qrcode-title">{{ title }}</h3>
      <div class="qrcode-wrapper">
        <Qrcode
          :value="value"
          :options="qrcodeOptions"
        />
      </div>
      <p v-if="description" class="qrcode-description">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  width?: number
  color?: {
    dark: string
    light: string
  }
  margin?: number
}

interface Props {
  value?: string
  title?: string
  description?: string
  options?: QRCodeOptions
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  options: () => ({})
})

// QR 코드 옵션 계산
const qrcodeOptions = computed<QRCodeOptions>(() => ({
  errorCorrectionLevel: 'M',
  width: 200,
  color: {
    dark: '#000000',
    light: '#ffffff'
  },
  margin: 4,
  ...props.options
}))

// props 검증
if (!props.value) {
  console.warn('QRCodeComponent: value prop이 필요합니다.')
}
</script>

<style scoped>
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.qrcode-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  text-align: center;
}

.qrcode-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.qrcode-description {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin-top: 0.5rem;
}


/* 반응형 디자인 */
@media (max-width: 640px) {
  .qrcode-wrapper {
    padding: 0.75rem;
  }
  
  .qrcode-title {
    font-size: 1.125rem;
  }
}
</style>