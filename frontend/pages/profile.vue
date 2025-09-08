<template>
  <div class="profile-container">
    <div class="profile-content">
      <!-- 페이지 헤더 -->
      <div class="profile-header">
        <h1 class="profile-title">프로필</h1>
        <p class="profile-description">사용자 정보를 확인하고 관리할 수 있습니다.</p>
      </div>

      <!-- 사용자 정보 카드 -->
      <div v-if="authStore.isAuthenticated && authStore.currentUser" class="profile-card">
        <div class="user-header">
          <!-- 아바타 -->
          <div class="avatar">
            <span class="avatar-text">
              {{ authStore.currentUser.email.charAt(0).toUpperCase() }}
            </span>
          </div>
          
          <!-- 사용자 정보 -->
          <div class="user-info">
            <h2 class="user-email">
              {{ authStore.currentUser.email }}
            </h2>
            <div class="status-container">
              <span class="status-badge"
                    :class="authStore.currentUser.isActive ? 'status-active' : 'status-inactive'">
                {{ authStore.currentUser.isActive ? '활성' : '비활성' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 계정 통계 -->
        <div class="stats-grid">
          <div class="stat-item">
            <h3 class="stat-label">가입일</h3>
            <p class="stat-value">{{ formatDate(new Date()) }}</p>
          </div>
          <div class="stat-item">
            <h3 class="stat-label">계정 상태</h3>
            <p class="stat-value">정상</p>
          </div>
          <div class="stat-item">
            <h3 class="stat-label">로그인 방식</h3>
            <p class="stat-value">이메일</p>
          </div>
        </div>

        <!-- 액션 버튼들 -->
        <div class="action-buttons">
          <button
            class="btn btn-primary"
            @click="refreshProfile"
            :disabled="isRefreshing">
            <span v-if="isRefreshing">새로고침 중...</span>
            <span v-else>프로필 새로고침</span>
          </button>
          
          <button
            class="btn btn-danger"
            @click="handleLogout">
            로그아웃
          </button>
        </div>
      </div>

      <!-- 에러 상태 (글로벌 로딩은 API에서 처리됨) -->
      <div v-else-if="!authStore.isAuthenticated" class="error-card">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <h3 class="error-title">프로필을 불러올 수 없습니다</h3>
          <p class="error-message">인증 정보를 확인할 수 없습니다.</p>
          <button
            class="btn btn-primary"
            @click="$router.push('/login')">
            로그인하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ===============================================
// 🔐 인증이 필요한 페이지 예시
// ===============================================
// 이 페이지는 로그인한 사용자만 접근할 수 있습니다.
// definePageMeta의 middleware: 'auth-middleware'를 통해 인증을 강제합니다.

// 페이지 메타데이터 - 인증 미들웨어 적용
definePageMeta({
  middleware: 'auth-middleware', // 🔑 이 한 줄이 인증을 필수로 만듭니다!
  title: '프로필',
  description: '사용자 프로필 페이지'
})

// 인증 스토어 사용
const authStore = useAuthStore()
const router = useRouter()

// 로컬 상태 (글로벌 로딩은 API 플러그인에서 처리됨)
const isRefreshing = ref(false)

// 유틸리티 함수
const formatDate = (date: Date) => {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 프로필 새로고침
const refreshProfile = async () => {
  isRefreshing.value = true
  try {
    // API 호출 시 글로벌 로딩이 자동으로 처리됨
    await authStore.getProfile()
  } catch (error) {
    console.error('Profile refresh failed:', error)
  } finally {
    isRefreshing.value = false
  }
}

// 로그아웃 처리
const handleLogout = async () => {
  try {
    // API 호출 시 글로벌 로딩이 자동으로 처리됨
    await authStore.logout()
    await router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// 페이지 로드 시 프로필 데이터 확인
onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.currentUser) {
    try {
      // API 호출 시 글로벌 로딩이 자동으로 처리됨
      await authStore.getProfile()
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }
})
</script>

<style scoped>
/* CSS 변수 정의 */
:root {
  --color-indigo-100: #e0e7ff;
  --color-indigo-600: #4f46e5;
  --color-indigo-700: #4338ca;
  --color-green-100: #dcfce7;
  --color-green-800: #166534;
  --color-red-100: #fee2e2;
  --color-red-500: #ef4444;
  --color-red-600: #dc2626;
  --color-red-700: #b91c1c;
  --color-red-800: #991b1b;
  --color-gray-50: #f9fafb;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-900: #111827;
  --color-white: #ffffff;
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-focus: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

/* 프로필 페이지 컨테이너 */
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.profile-content {
  max-width: 42rem;
  margin: 0 auto;
}

/* 페이지 헤더 */
.profile-header {
  margin-bottom: 2rem;
}

.profile-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
  line-height: 2.25rem;
}

.profile-description {
  color: var(--color-gray-600);
  font-size: 1rem;
  line-height: 1.5rem;
}

/* 프로필 카드 */
.profile-card {
  background-color: var(--color-white);
  box-shadow: var(--shadow-lg);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

/* 사용자 헤더 */
.user-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.avatar {
  width: 4rem;
  height: 4rem;
  background-color: var(--color-indigo-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-indigo-600);
  line-height: 2rem;
}

.user-info {
  flex: 1;
}

.user-email {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-900);
  line-height: 1.75rem;
}

.user-id {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  line-height: 1.25rem;
}

.status-container {
  display: flex;
  align-items: center;
  margin-top: 0.25rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1rem;
}

.status-active {
  background-color: var(--color-green-100);
  color: var(--color-green-800);
}

.status-inactive {
  background-color: var(--color-red-100);
  color: var(--color-red-800);
}

/* 통계 그리드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  background-color: var(--color-gray-50);
  padding: 1rem;
  border-radius: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-500);
  margin-bottom: 0.25rem;
  line-height: 1.25rem;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-900);
  line-height: 1.75rem;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.15s ease-in-out;
  border: none;
  cursor: pointer;
  line-height: 1.5rem;
}

.btn:focus {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-indigo-600);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-indigo-700);
}

.btn-primary:focus {
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.btn-danger {
  background-color: var(--color-red-600);
  color: var(--color-white);
}

.btn-danger:hover {
  background-color: var(--color-red-700);
}

.btn-danger:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

/* 에러 카드 */
.error-card {
  background-color: var(--color-white);
  box-shadow: var(--shadow-lg);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.error-content {
  text-align: center;
}

.error-icon {
  color: var(--color-red-500);
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
  line-height: 1.75rem;
}

.error-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
  line-height: 1.75rem;
}

.error-message {
  color: var(--color-gray-500);
  margin-bottom: 1rem;
  font-size: 1rem;
  line-height: 1.5rem;
}

/* 반응형 디자인 */
@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .user-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(1, 1fr);
    gap: 0.75rem;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .profile-container {
    padding: 1.5rem 0.75rem;
  }
}

@media (max-width: 640px) {
  .profile-title {
    font-size: 1.5rem;
    line-height: 2rem;
  }
  
  .user-email {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }
  
  .avatar {
    width: 3rem;
    height: 3rem;
  }
  
  .avatar-text {
    font-size: 1.25rem;
    line-height: 1.75rem;
  }
}
</style>