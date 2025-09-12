export interface RecaptchaVerificationRequest {
  secret: string
  response: string
  remoteip?: string
}

export interface RecaptchaVerificationResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  score?: number
  action?: string
  'error-codes'?: string[]
}

export interface RecaptchaValidationResult {
  isValid: boolean
  score?: number
  action?: string
  hostname?: string
  errorCodes?: string[]
  message?: string
}

export interface RecaptchaConfig {
  secretKey: string
  verifyUrl: string
  scoreThreshold: number
  enabled: boolean
}