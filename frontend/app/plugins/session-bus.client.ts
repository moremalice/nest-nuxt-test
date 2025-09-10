// frontend/app/plugins/session-bus.client.ts
import { defineNuxtPlugin } from '#app'
import { useAuthStore } from '~/stores/auth'

interface AuthBusMessage {
  type: 'LOGIN' | 'ACCESS_TOKEN' | 'LOGOUT'
  from: string
  accessToken?: string
  user?: {
    idx: number
    email: string
    isActive: boolean
  }
}

export default defineNuxtPlugin(() => {
  // 클라이언트 환경에서만 실행
  if (!import.meta.client) return

  // BroadcastChannel 생성
  const channel = new BroadcastChannel('auth-bus')

  // 각 탭에 고유 ID 부여 (메시지 루프 방지용)
  const tabId = (crypto?.getRandomValues(new Uint32Array(1))[0] ?? Math.floor(Math.random() * 0xffffffff)).toString(16)

  // AuthStore 인스턴스
  const auth = useAuthStore()

  // 메시지 전송 헬퍼
  const broadcast = (msg: Omit<AuthBusMessage, 'from'>) => {
    const message: AuthBusMessage = { ...msg, from: tabId }
    channel.postMessage(message)
  }

  // ===== 아웃바운드: 스토어 액션 완료 시 브로드캐스트 =====
  auth.$onAction(({ name, after }) => {
    // 1) 로그인 성공 시
    if (name === 'login') {
      after((success: boolean) => {
        if (success && auth.accessToken) {
          broadcast({
            type: 'LOGIN',
            accessToken: auth.accessToken as string,
            user: auth.currentUser as any
          })
        }
      })
    }
    
    // 2) 토큰 갱신 성공 시
    if (name === 'refreshToken') {
      after((success: boolean) => {
        if (success && auth.accessToken) {
          broadcast({
            type: 'ACCESS_TOKEN',
            accessToken: auth.accessToken as string
          })
        }
      })
    }
    
    // 3) 로그아웃 성공 시
    if (name === 'logout') {
      after((success: boolean) => {
        if (success) {
          broadcast({ type: 'LOGOUT' })
        }
      })
    }
  })

  // ===== 인바운드: 다른 탭 이벤트 수신 및 처리 =====
  channel.onmessage = async (event: MessageEvent<AuthBusMessage>) => {
    const msg = event.data
    
    // 자신이 보낸 메시지는 무시
    if (!msg || msg.from === tabId) return

    switch (msg.type) {
      case 'LOGIN': {
        // 다른 탭에서 로그인 시 AT 동기화
        if (msg.accessToken && auth.accessToken !== msg.accessToken) {
          // @ts-ignore - Pinia $patch는 readonly를 우회
          auth.$patch({ 
            accessToken: msg.accessToken,
            user: msg.user || null
          })
          
          // 유저 정보가 없으면 프로필 로드
          if (!auth.currentUser && msg.accessToken) {
            await auth.getProfile()
          }
        }
        break
      }
      
      case 'ACCESS_TOKEN': {
        // 다른 탭에서 토큰 갱신 시 AT만 동기화
        if (msg.accessToken && auth.accessToken !== msg.accessToken) {
          // @ts-ignore - Pinia $patch는 readonly를 우회
          auth.$patch({ accessToken: msg.accessToken })
        }
        break
      }
      
      case 'LOGOUT': {
        // 다른 탭에서 로그아웃 시 현재 탭도 로그아웃
        await auth.clearAuth()
        
        // CSRF 토큰도 정리
        const { clearCsrfToken } = useCsrf()
        clearCsrfToken()
        break
      }
    }
  }

  // 탭 종료 시 정리
  window.addEventListener('beforeunload', () => {
    channel.close()
  })
})