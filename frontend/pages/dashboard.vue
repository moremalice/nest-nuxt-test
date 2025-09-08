<template>
  <div class="dashboard-container">
    <!-- 대시보드 헤더 -->
    <div class="dashboard-header">
      <h1 class="dashboard-title">대시보드</h1>
      <p class="dashboard-welcome">환영합니다, {{ authStore.currentUser?.email }}님!</p>
    </div>

    <!-- 통계 카드 섹션 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-card-content">
          <div class="stat-icon stat-icon-indigo">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="stat-info">
            <h3 class="stat-label">사용자 계정</h3>
            <p class="stat-value">{{ authStore.currentUser?.email.split('@')[0] }}</p>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-content">
          <div class="stat-icon stat-icon-green">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-info">
            <h3 class="stat-label">계정 상태</h3>
            <p class="stat-value">
              {{ authStore.currentUser?.isActive ? '활성' : '비활성' }}
            </p>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-content">
          <div class="stat-icon stat-icon-blue">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-info">
            <h3 class="stat-label">세션 시간</h3>
            <p class="stat-value">{{ sessionTime }}</p>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-content">
          <div class="stat-icon stat-icon-yellow">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-info">
            <h3 class="stat-label">알림</h3>
            <p class="stat-value">3</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 최근 활동 섹션 -->
    <div class="content-grid">
      <!-- 최근 활동 -->
      <div class="content-card">
        <div class="content-card-header">
          <h2 class="content-card-title">최근 활동</h2>
        </div>
        <div class="content-card-body">
          <div class="activity-list">
            <div v-for="activity in recentActivities" :key="activity.id" 
                 class="activity-item">
              <div class="activity-icon">
                <div class="activity-icon-circle">
                  <svg class="activity-check-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <div class="activity-content">
                <p class="activity-action">{{ activity.action }}</p>
                <p class="activity-time">{{ activity.time }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 빠른 액션 -->
      <div class="content-card">
        <div class="content-card-header">
          <h2 class="content-card-title">빠른 액션</h2>
        </div>
        <div class="content-card-body">
          <div class="action-list">
            <button
              class="action-button action-button-indigo"
              @click="$router.push('/profile')">
              <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="action-text">프로필 보기</span>
            </button>

            <button
              class="action-button action-button-green"
              @click="refreshTokens">
              <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span class="action-text">토큰 새로고침</span>
            </button>

            <button
              class="action-button action-button-blue"
              @click="$router.push('/community/faq')">
              <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="action-text">FAQ 보기</span>
            </button>

            <button
              class="action-button action-button-red"
              @click="handleLogout">
              <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span class="action-text">로그아웃</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ===============================================
// 🔐 인증이 필요한 대시보드 페이지 예시
// ===============================================
// 이 페이지는 로그인한 사용자만 접근할 수 있습니다.
// middleware: 'auth-middleware'를 통해 인증되지 않은 사용자는 로그인 페이지로 리다이렉트됩니다.

// 페이지 메타데이터 - 인증 미들웨어 적용
definePageMeta({
  middleware: 'auth-middleware', // 🔑 인증 필수 페이지로 설정
  title: '대시보드',
  description: '사용자 대시보드 페이지'
})

// 인증 스토어 및 라우터
const authStore = useAuthStore()
const router = useRouter()

// 세션 시간 계산
const sessionTime = ref('00:00')
const startTime = Date.now()

// 최근 활동 더미 데이터
const recentActivities = ref([
  { id: 1, action: '프로필을 업데이트했습니다', time: '5분 전' },
  { id: 2, action: '로그인했습니다', time: '1시간 전' },
  { id: 3, action: 'FAQ를 조회했습니다', time: '2시간 전' },
  { id: 4, action: '공지사항을 확인했습니다', time: '1일 전' }
])

// 세션 시간 업데이트
const updateSessionTime = () => {
  const elapsed = Date.now() - startTime
  const minutes = Math.floor(elapsed / 60000)
  const seconds = Math.floor((elapsed % 60000) / 1000)
  sessionTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// 토큰 새로고침
const refreshTokens = async () => {
  try {
    // API 호출 시 글로벌 로딩이 자동으로 처리됨
    const success = await authStore.refreshToken()
    if (success) {
      // 성공 피드백 (실제 프로젝트에서는 토스트 메시지 등 사용)
      alert('토큰이 성공적으로 새로고침되었습니다!')
    } else {
      alert('토큰 새로고침에 실패했습니다.')
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
    alert('토큰 새로고침 중 오류가 발생했습니다.')
  }
}

// 로그아웃
const handleLogout = async () => {
  if (confirm('정말로 로그아웃하시겠습니까?')) {
    try {
      // API 호출 시 글로벌 로딩이 자동으로 처리됨
      await authStore.logout()
      await router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
}

// 생명주기 훅
onMounted(() => {
  // 세션 시간 업데이트 (1초마다)
  const interval = setInterval(updateSessionTime, 1000)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
  
  // 사용자 프로필이 없으면 가져오기
  if (authStore.isAuthenticated && !authStore.currentUser) {
    // API 호출 시 글로벌 로딩이 자동으로 처리됨
    authStore.getProfile()
  }
})
</script>

<style scoped>
/* CSS 변수 정의 */
:root {
  --color-indigo-50: #eef2ff;
  --color-indigo-100: #e0e7ff;
  --color-indigo-600: #4f46e5;
  --color-indigo-700: #4338ca;
  --color-green-50: #f0fdf4;
  --color-green-100: #dcfce7;
  --color-green-600: #16a34a;
  --color-green-700: #15803d;
  --color-blue-50: #eff6ff;
  --color-blue-100: #dbeafe;
  --color-blue-600: #2563eb;
  --color-blue-700: #1d4ed8;
  --color-yellow-50: #fefce8;
  --color-yellow-100: #fef3c7;
  --color-yellow-600: #ca8a04;
  --color-red-50: #fef2f2;
  --color-red-100: #fee2e2;
  --color-red-600: #dc2626;
  --color-red-700: #b91c1c;
  --color-gray-200: #e5e7eb;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-900: #111827;
  --color-white: #ffffff;
}

/* 대시보드 컨테이너 */
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* 대시보드 헤더 */
.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
  line-height: 2.25rem;
}

.dashboard-welcome {
  color: var(--color-gray-600);
  font-size: 1rem;
  line-height: 1.5rem;
}

/* 통계 카드 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: var(--color-white);
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.15s ease-in-out;
}

.stat-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.stat-card-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  padding: 0.75rem;
  border-radius: 50%;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-indigo {
  background-color: var(--color-indigo-100);
}

.stat-icon-green {
  background-color: var(--color-green-100);
}

.stat-icon-blue {
  background-color: var(--color-blue-100);
}

.stat-icon-yellow {
  background-color: var(--color-yellow-100);
}

.icon {
  width: 1.5rem;
  height: 1.5rem;
}

.stat-icon-indigo .icon {
  color: var(--color-indigo-600);
}

.stat-icon-green .icon {
  color: var(--color-green-600);
}

.stat-icon-blue .icon {
  color: var(--color-blue-600);
}

.stat-icon-yellow .icon {
  color: var(--color-yellow-600);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: 0.25rem;
  line-height: 1.75rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  line-height: 2rem;
}

/* 콘텐츠 그리드 */
.content-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 2rem;
}

.content-card {
  background-color: var(--color-white);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.15s ease-in-out;
}

.content-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.content-card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.content-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-900);
  line-height: 1.75rem;
}

.content-card-body {
  padding: 1.5rem;
}

/* 활동 목록 */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.activity-icon {
  flex-shrink: 0;
}

.activity-icon-circle {
  width: 2rem;
  height: 2rem;
  background-color: var(--color-indigo-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-check-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-indigo-600);
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-action {
  font-size: 0.875rem;
  color: var(--color-gray-900);
  line-height: 1.25rem;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  line-height: 1rem;
}

/* 액션 버튼 */
.action-list {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.15s ease-in-out;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.action-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.action-button-indigo {
  background-color: var(--color-indigo-50);
}

.action-button-indigo:hover {
  background-color: var(--color-indigo-100);
}

.action-button-indigo:focus {
  box-shadow: 0 0 0 2px var(--color-indigo-600);
}

.action-button-green {
  background-color: var(--color-green-50);
}

.action-button-green:hover {
  background-color: var(--color-green-100);
}

.action-button-green:focus {
  box-shadow: 0 0 0 2px var(--color-green-600);
}

.action-button-blue {
  background-color: var(--color-blue-50);
}

.action-button-blue:hover {
  background-color: var(--color-blue-100);
}

.action-button-blue:focus {
  box-shadow: 0 0 0 2px var(--color-blue-600);
}

.action-button-red {
  background-color: var(--color-red-50);
}

.action-button-red:hover {
  background-color: var(--color-red-100);
}

.action-button-red:focus {
  box-shadow: 0 0 0 2px var(--color-red-600);
}

.action-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.75rem;
}

.action-button-indigo .action-icon {
  color: var(--color-indigo-600);
}

.action-button-green .action-icon {
  color: var(--color-green-600);
}

.action-button-blue .action-icon {
  color: var(--color-blue-600);
}

.action-button-red .action-icon {
  color: var(--color-red-600);
}

.action-text {
  font-weight: 500;
}

.action-button-indigo .action-text {
  color: var(--color-indigo-700);
}

.action-button-green .action-text {
  color: var(--color-green-700);
}

.action-button-blue .action-text {
  color: var(--color-blue-700);
}

.action-button-red .action-text {
  color: var(--color-red-700);
}

/* 반응형 디자인 */
@media (min-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .stats-cards {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .content-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: repeat(1, 1fr);
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
  }
  
  .dashboard-container {
    padding: 1.5rem 0.75rem;
  }
  
  .content-card-body {
    padding: 1rem;
  }
}

@media (max-width: 640px) {
  .stats-cards {
    gap: 0.75rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .dashboard-title {
    font-size: 1.5rem;
    line-height: 2rem;
  }
}
</style>