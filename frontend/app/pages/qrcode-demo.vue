<template>
  <div class="qrcode-demo-container">
    <div class="demo-content">
      <!-- 페이지 헤더 -->
      <div class="demo-header">
        <h1 class="demo-title">QR 코드 데모</h1>
        <p class="demo-description">현대화된 QR 코드 라이브러리 사용 예시입니다.</p>
      </div>

      <!-- QR 코드 생성 섹션 -->
      <div class="demo-section">
        <h2 class="section-title">QR 코드 생성</h2>
        <div class="input-group">
          <label for="qr-input" class="input-label">
            QR 코드로 변환할 텍스트:
          </label>
          <input
            id="qr-input"
            v-model="qrText"
            type="text"
            placeholder="https://pikitalk.com"
            class="text-input"
          />
        </div>

        <div class="qr-display">
          <QRCodeComponent
            :value="qrText"
            title="생성된 QR 코드"
            :description="`입력된 텍스트: ${qrText}`"
            :options="qrOptions"
          />
        </div>

        <!-- 옵션 설정 -->
        <div class="options-group">
          <h3 class="options-title">QR 코드 옵션</h3>
          <div class="options-grid">
            <div class="option-item">
              <label class="option-label">크기:</label>
              <select v-model="qrOptions.width" class="option-select">
                <option :value="150">150px</option>
                <option :value="200">200px</option>
                <option :value="250">250px</option>
                <option :value="300">300px</option>
              </select>
            </div>
            
            <div class="option-item">
              <label class="option-label">오류 수정 레벨:</label>
              <select v-model="qrOptions.errorCorrectionLevel" class="option-select">
                <option value="L">L (낮음)</option>
                <option value="M">M (중간)</option>
                <option value="Q">Q (높음)</option>
                <option value="H">H (최고)</option>
              </select>
            </div>
            
            <div class="option-item">
              <label class="option-label">전경색:</label>
              <input
                v-model="qrOptions.color.dark"
                type="color"
                class="color-input"
              />
            </div>
            
            <div class="option-item">
              <label class="option-label">배경색:</label>
              <input
                v-model="qrOptions.color.light"
                type="color"
                class="color-input"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
// 페이지 메타데이터
definePageMeta({
  title: 'QR 코드 데모',
  description: 'QR 코드 생성 기능 데모 페이지'
})

// 반응형 데이터
const qrText = ref('https://pikitalk.com')

// QR 코드 옵션
const qrOptions = ref({
  width: 200,
  errorCorrectionLevel: 'M' as const,
  color: {
    dark: '#000000',
    light: '#ffffff'
  },
  margin: 4
})

</script>

<style scoped>
.qrcode-demo-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.demo-content {
  max-width: 42rem;
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

.input-group {
  margin-bottom: 2rem;
}

.input-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.text-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.text-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.qr-display {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.options-group {
  border-top: 1px solid #e5e7eb;
  padding-top: 2rem;
}

.options-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.option-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.color-input {
  width: 60px;
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
}


/* 반응형 디자인 */
@media (max-width: 640px) {
  .demo-title {
    font-size: 1.875rem;
  }
  
  .options-grid {
    grid-template-columns: 1fr;
  }
  
  .demo-section {
    padding: 1.5rem;
  }
}
</style>