import { ref, readonly } from 'vue'

type RecaptchaInstance = {
  ready: (callback: () => void) => void
  execute: (siteKey: string, options: { action: string }) => Promise<string>
  render: (elementId: string, options: any) => string
}

interface RecaptchaResult {
  success: boolean
  token?: string
  error?: string
}

let recaptchaInstance: RecaptchaInstance | null = null
let isScriptLoaded = false
let isLoading = false
let loadingPromise: Promise<boolean> | null = null

export const useRecaptcha = () => {
  const isRecaptchaReady = ref(false)
  const isExecuting = ref(false)
  const lastError = ref<string | null>(null)

  const config = useRuntimeConfig()
  const configSiteKey = config.public.NUXT_RECAPTCHA_SITE_KEY
  const siteKey = configSiteKey || ''
  
  console.log('reCAPTCHA: Using site key:', siteKey.substring(0, 20) + '...')

  // Dynamically load reCAPTCHA script
  const loadRecaptchaScript = async (): Promise<boolean> => {
    if (isScriptLoaded) return true
    if (isLoading && loadingPromise) return loadingPromise

    isLoading = true
    loadingPromise = new Promise((resolve) => {
      try {
        // Check if script already exists
        const existingScript = document.querySelector('script[src*="recaptcha"]')
        if (existingScript) {
          console.log('reCAPTCHA script already exists')
          isScriptLoaded = true
          isLoading = false
          resolve(true)
          return
        }

        const scriptUrl = `https://www.google.com/recaptcha/api.js?render=${siteKey}&hl=ko`
        console.log('Loading reCAPTCHA script from:', scriptUrl)

        const script = document.createElement('script')
        script.src = scriptUrl
        script.async = true
        script.defer = true

        let timeoutId: NodeJS.Timeout

        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId)
          isLoading = false
        }

        script.onload = () => {
          cleanup()
          isScriptLoaded = true
          console.log('reCAPTCHA script loaded successfully')
          resolve(true)
        }

        script.onerror = (error) => {
          cleanup()
          isScriptLoaded = false
          console.error('Failed to load reCAPTCHA script from:', scriptUrl)
          console.error('This might be due to:')
          console.error('1. Network connectivity issues')
          console.error('2. Invalid reCAPTCHA site key')
          console.error('3. Domain not registered with reCAPTCHA')
          console.error('4. Firewall or ad blocker interference')
          console.error('Error details:', error)
          
          resolve(false)
        }

        // Set a timeout for loading
        timeoutId = setTimeout(() => {
          cleanup()
          isScriptLoaded = false
          console.error('reCAPTCHA script loading timeout after 10 seconds')
          resolve(false)
        }, 10000)

        // Add additional debugging
        console.log('Appending reCAPTCHA script to head')
        document.head.appendChild(script)
        
      } catch (error) {
        isScriptLoaded = false
        isLoading = false
        console.error('Exception while loading reCAPTCHA script:', error)
        resolve(false)
      }
    })

    return loadingPromise
  }

  // Initialize reCAPTCHA instance
  const initializeRecaptcha = async (): Promise<boolean> => {
    if (!import.meta.client) {
      console.log('reCAPTCHA: Not running on client side')
      return false
    }

    console.log('reCAPTCHA: Starting initialization...')
    console.log('reCAPTCHA: Site key:', siteKey)

    try {
      const scriptLoaded = await loadRecaptchaScript()
      if (!scriptLoaded) {
        lastError.value = 'Failed to load reCAPTCHA script'
        console.error('reCAPTCHA: Script loading failed')
        return false
      }

      console.log('reCAPTCHA: Script loaded successfully, waiting for grecaptcha...')

      // Wait for grecaptcha to be available
      return new Promise((resolve) => {
        let attempts = 0
        const maxAttempts = 100 // 10 seconds at 100ms intervals
        
        const checkGrecaptcha = () => {
          attempts++
          console.log(`reCAPTCHA: Checking grecaptcha availability (attempt ${attempts}/${maxAttempts})`)
          
          if (window.grecaptcha && window.grecaptcha.ready) {
            console.log('reCAPTCHA: grecaptcha found, calling ready()...')
            window.grecaptcha.ready(() => {
              recaptchaInstance = window.grecaptcha as RecaptchaInstance
              isRecaptchaReady.value = true
              console.log('reCAPTCHA initialized successfully with key:', siteKey.substring(0, 20) + '...')
              resolve(true)
            })
          } else if (attempts < maxAttempts) {
            console.log('reCAPTCHA: grecaptcha not ready yet, retrying...')
            setTimeout(checkGrecaptcha, 100)
          } else {
            lastError.value = 'reCAPTCHA initialization timeout - grecaptcha not found'
            console.error('reCAPTCHA: Timeout - grecaptcha never became available')
            resolve(false)
          }
        }
        
        checkGrecaptcha()
      })
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : 'reCAPTCHA initialization error'
      console.error('reCAPTCHA initialization error:', error)
      return false
    }
  }

  // Check if reCAPTCHA is ready
  const isRecaptchaLoaded = async (): Promise<boolean> => {
    if (isRecaptchaReady.value && recaptchaInstance) return true
    
    return await initializeRecaptcha()
  }

  // Execute reCAPTCHA and return token
  const executeRecaptcha = async (action: string = 'submit'): Promise<RecaptchaResult> => {
    if (isExecuting.value) {
      console.log('reCAPTCHA: Already executing, skipping...')
      return {
        success: false,
        error: 'reCAPTCHA is already executing'
      }
    }

    try {
      isExecuting.value = true
      lastError.value = null
      console.log(`reCAPTCHA: Starting token generation for action: ${action}`)

      // Initialize reCAPTCHA if not ready
      const ready = await isRecaptchaLoaded()
      if (!ready || !recaptchaInstance) {
        console.error('reCAPTCHA: Instance not ready or failed to initialize')
        console.error('reCAPTCHA: ready =', ready)
        console.error('reCAPTCHA: recaptchaInstance =', recaptchaInstance)
        return {
          success: false,
          error: 'reCAPTCHA not ready or failed to initialize'
        }
      }

      console.log('reCAPTCHA: Instance ready, executing with site key:', siteKey)
      console.log('reCAPTCHA: Action:', action)
      console.log('reCAPTCHA: recaptchaInstance.execute type:', typeof recaptchaInstance.execute)
      console.log('reCAPTCHA: window.grecaptcha:', window.grecaptcha)

      const token = await recaptchaInstance.execute(siteKey, { action })
      
      console.log('reCAPTCHA: Execute completed, token:', token ? 'received' : 'null')
      console.log('reCAPTCHA: Token length:', token ? token.length : 0)
      
      if (!token || typeof token !== 'string' || token.trim() === '') {
        console.error('reCAPTCHA: Token generation failed - invalid token received')
        console.error('reCAPTCHA: Token value:', token)
        console.error('reCAPTCHA: Token type:', typeof token)
        return {
          success: false,
          error: 'Token generation failed - invalid token received'
        }
      }

      console.log('reCAPTCHA token generated successfully for action:', action)
      return {
        success: true,
        token
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'reCAPTCHA execution error'
      lastError.value = errorMessage
      console.error('reCAPTCHA execution error:', error)
      console.error('reCAPTCHA execution error stack:', error?.stack)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      isExecuting.value = false
    }
  }

  /**
   * @deprecated Frontend validation is not used. Backend handles validation automatically via RecaptchaGuard
   * The actual validation happens when calling protected endpoints (e.g., /auth/register)
   * This function is kept for backward compatibility but should not be used
   */
  const validateToken = async (token: string, action: string = 'submit'): Promise<boolean> => {
    console.warn('validateToken is deprecated. Backend handles validation automatically.')
    return false
  }

  // Token management
  const currentToken = ref<string | null>(null)
  const tokenGeneratedAt = ref<number | null>(null)
  const TOKEN_EXPIRY_MS = 110000 // 110 seconds (2 minutes - 10 seconds buffer)

  // Check if current token is still valid
  const isTokenValid = (): boolean => {
    if (!currentToken.value || !tokenGeneratedAt.value) {
      return false
    }
    
    const elapsed = Date.now() - tokenGeneratedAt.value
    return elapsed < TOKEN_EXPIRY_MS
  }

  // Get valid token (refresh if needed)
  const getValidToken = async (action: string = 'submit'): Promise<RecaptchaResult> => {
    // If we have a valid token, return it
    if (isTokenValid()) {
      console.log('reCAPTCHA: Using existing valid token')
      return {
        success: true,
        token: currentToken.value!
      }
    }

    // Generate new token
    console.log('reCAPTCHA: Generating new token (expired or missing)')
    const result = await executeRecaptcha(action)
    
    if (result.success && result.token) {
      currentToken.value = result.token
      tokenGeneratedAt.value = Date.now()
    }
    
    return result
  }

  // Clear stored token
  const clearToken = () => {
    currentToken.value = null
    tokenGeneratedAt.value = null
    console.log('reCAPTCHA: Token cleared')
  }

  // Enhanced execute function that stores token
  const executeRecaptchaWithStorage = async (action: string = 'submit'): Promise<RecaptchaResult> => {
    const result = await executeRecaptcha(action)
    
    if (result.success && result.token) {
      currentToken.value = result.token
      tokenGeneratedAt.value = Date.now()
    }
    
    return result
  }

  return {
    isRecaptchaReady: readonly(isRecaptchaReady),
    isExecuting: readonly(isExecuting),
    lastError: readonly(lastError),
    executeRecaptcha: executeRecaptchaWithStorage,
    validateToken,
    isRecaptchaLoaded,
    initializeRecaptcha,
    getValidToken,
    clearToken,
    isTokenValid,
    currentToken: readonly(currentToken)
  }
}

// Global type declaration
declare global {
  interface Window {
    grecaptcha: RecaptchaInstance
  }
}