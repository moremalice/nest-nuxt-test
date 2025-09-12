import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { 
  RecaptchaVerificationRequest, 
  RecaptchaVerificationResponse, 
  RecaptchaValidationResult,
  RecaptchaConfig
} from '../interfaces/recaptcha.interface'

@Injectable()
export class RecaptchaStrategy {
  private readonly logger = new Logger(RecaptchaStrategy.name)
  private readonly config: RecaptchaConfig

  constructor(private readonly configService: ConfigService) {
    this.config = {
      secretKey: this.configService.get<string>('RECAPTCHA_SECRET_KEY', ''),
      verifyUrl: this.configService.get<string>('RECAPTCHA_VERIFY_URL', 'https://www.google.com/recaptcha/api/siteverify'),
      scoreThreshold: this.configService.get<number>('RECAPTCHA_SCORE_THRESHOLD', 0.5),
      enabled: this.configService.get<boolean>('RECAPTCHA_ENABLED', true)
    }

    if (this.config.enabled && !this.config.secretKey) {
      this.logger.warn('reCAPTCHA is enabled but RECAPTCHA_SECRET_KEY is not configured')
    }
  }

  async validate(token: string, remoteIp?: string, expectedAction?: string): Promise<RecaptchaValidationResult> {
    if (!this.config.enabled) {
      this.logger.debug('reCAPTCHA validation disabled')
      return {
        isValid: true,
        message: 'reCAPTCHA validation disabled'
      }
    }

    if (!this.config.secretKey) {
      this.logger.error('reCAPTCHA secret key not configured')
      return {
        isValid: false,
        message: 'reCAPTCHA configuration error'
      }
    }

    if (!token) {
      return {
        isValid: false,
        message: 'reCAPTCHA token is required'
      }
    }

    try {
      const verificationResult = await this.verifyWithGoogle(token, remoteIp)
      
      if (!verificationResult.success) {
        return {
          isValid: false,
          errorCodes: verificationResult['error-codes'],
          message: `reCAPTCHA verification failed: ${verificationResult['error-codes']?.join(', ') || 'Unknown error'}`
        }
      }

      const score = verificationResult.score ?? 1.0
      const action = verificationResult.action
      const hostname = verificationResult.hostname

      if (score < this.config.scoreThreshold) {
        this.logger.warn(`reCAPTCHA score ${score} below threshold ${this.config.scoreThreshold}`)
        return {
          isValid: false,
          score,
          action,
          hostname,
          message: `reCAPTCHA score ${score} is too low (threshold: ${this.config.scoreThreshold})`
        }
      }

      if (expectedAction && action !== expectedAction) {
        this.logger.warn(`reCAPTCHA action mismatch. Expected: ${expectedAction}, Got: ${action}`)
        return {
          isValid: false,
          score,
          action,
          hostname,
          message: `Action mismatch. Expected: ${expectedAction}, Got: ${action}`
        }
      }

      this.logger.debug(`reCAPTCHA validation successful. Score: ${score}, Action: ${action}`)
      return {
        isValid: true,
        score,
        action,
        hostname,
        message: 'reCAPTCHA validation successful'
      }

    } catch (error) {
      this.logger.error('reCAPTCHA validation error:', error)
      return {
        isValid: false,
        message: 'reCAPTCHA validation service error'
      }
    }
  }

  private async verifyWithGoogle(token: string, remoteIp?: string): Promise<RecaptchaVerificationResponse> {
    const requestData: RecaptchaVerificationRequest = {
      secret: this.config.secretKey,
      response: token
    }

    if (remoteIp) {
      requestData.remoteip = remoteIp
    }

    const formData = new URLSearchParams()
    Object.entries(requestData).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value)
      }
    })

    const response = await fetch(this.config.verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json() as RecaptchaVerificationResponse
  }

  isEnabled(): boolean {
    return this.config.enabled
  }

  getScoreThreshold(): number {
    return this.config.scoreThreshold
  }
}