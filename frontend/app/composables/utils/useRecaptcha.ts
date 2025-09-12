import { useReCaptcha } from 'vue-recaptcha-v3'

interface RecaptchaResult {
  token: string | null
  success: boolean
  error?: string
}

export const useRecaptcha = () => {
  const recaptchaInstance = useReCaptcha()

  const executeRecaptcha = async (action: string = 'submit'): Promise<RecaptchaResult> => {
    try {
      if (!recaptchaInstance) {
        return {
          token: null,
          success: false,
          error: 'reCAPTCHA 인스턴스를 찾을 수 없습니다.'
        }
      }

      await recaptchaInstance.recaptchaLoaded()
      
      const token = await recaptchaInstance.executeRecaptcha(action)
      
      if (!token) {
        return {
          token: null,
          success: false,
          error: 'reCAPTCHA 토큰을 생성할 수 없습니다.'
        }
      }

      return {
        token,
        success: true
      }
    } catch (error) {
      console.error('reCAPTCHA 실행 오류:', error)
      return {
        token: null,
        success: false,
        error: error instanceof Error ? error.message : 'reCAPTCHA 실행 중 오류가 발생했습니다.'
      }
    }
  }

  const isRecaptchaLoaded = async (): Promise<boolean> => {
    try {
      if (!recaptchaInstance) return false
      return await recaptchaInstance.recaptchaLoaded()
    } catch (error) {
      console.error('reCAPTCHA 로드 상태 확인 오류:', error)
      return false
    }
  }

  return {
    executeRecaptcha,
    isRecaptchaLoaded
  }
}