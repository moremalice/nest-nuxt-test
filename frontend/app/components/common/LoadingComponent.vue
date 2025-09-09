<!-- components/common/LoadingComponent.vue -->
<script setup lang="ts">
const { isLoading } = useLoadingUI()
</script>

<template>
  <Teleport to="body">
    <Transition name="loading">
      <div v-if="isLoading" class="app-loading-overlay">
        <div class="app-loading-spinner">
          <!-- CSS로 만든 스피너 -->
          <div class="spinner-icon"></div>
          <div class="spinner-text">Loading...</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.app-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-loading-spinner {
  color: #fff;
  text-align: center;
}

.spinner-icon {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin: 0 auto 16px;
}

.spinner-text {
  font-size: 18px;
  font-weight: 500;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-enter-active,
.loading-leave-active {
  transition: opacity 0.3s ease;
}

.loading-enter-from,
.loading-leave-to {
  opacity: 0;
}
</style>
