<!-- frontend/components/common/LayerModalComponent.vue -->
<script setup>
// Props 정의: 부모에서 visible 상태를 받음
defineProps({
  visible: Boolean
})

// Emits 정의: close 이벤트를 부모에게 전달
defineEmits(['close'])
</script>

<template>
  <div v-if="visible" class="layer_wrap">
    <!-- 배경 클릭 시 close 이벤트 발생 -->
    <div class="dimBg" @click="$emit('close')"></div>
    <div class="pop-layer">
      <div class="pop-container">
        <!-- 슬롯: 부모에서 전달한 콘텐츠가 여기에 들어감 -->
        <slot />
        <div class="btn_box">
          <!-- 버튼 클릭 시 close 이벤트 발생 -->
          <button type="button" class="btn-close" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

