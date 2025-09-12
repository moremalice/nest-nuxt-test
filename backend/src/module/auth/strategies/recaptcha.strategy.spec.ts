import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { RecaptchaStrategy } from './recaptcha.strategy'
import { RecaptchaValidationResult } from '../interfaces/recaptcha.interface'

// Mock fetch globally
global.fetch = jest.fn()

describe('RecaptchaStrategy', () => {
  let strategy: RecaptchaStrategy
  let configService: jest.Mocked<ConfigService>

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecaptchaStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ]
    }).compile()

    strategy = module.get<RecaptchaStrategy>(RecaptchaStrategy)
    configService = module.get<ConfigService>(ConfigService) as jest.Mocked<ConfigService>

    // Setup default config values
    configService.get.mockImplementation((key: string, defaultValue?: any) => {
      const configs = {
        'RECAPTCHA_SECRET_KEY': 'test-secret-key',
        'RECAPTCHA_VERIFY_URL': 'https://www.google.com/recaptcha/api/siteverify',
        'RECAPTCHA_SCORE_THRESHOLD': 0.5,
        'RECAPTCHA_ENABLED': true
      }
      return configs[key] ?? defaultValue
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('validate', () => {
    it('should return disabled validation when reCAPTCHA is disabled', async () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'RECAPTCHA_ENABLED') return false
        return 'mock-value'
      })

      const result = await strategy.validate('test-token')

      expect(result.isValid).toBe(true)
      expect(result.message).toBe('reCAPTCHA validation disabled')
    })

    it('should return error when secret key is missing', async () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'RECAPTCHA_SECRET_KEY') return ''
        return 'mock-value'
      })

      const result = await strategy.validate('test-token')

      expect(result.isValid).toBe(false)
      expect(result.message).toBe('reCAPTCHA configuration error')
    })

    it('should return error when token is missing', async () => {
      const result = await strategy.validate('')

      expect(result.isValid).toBe(false)
      expect(result.message).toBe('reCAPTCHA token is required')
    })

    it('should validate successfully with good token', async () => {
      const mockResponse = {
        success: true,
        score: 0.8,
        action: 'submit',
        hostname: 'localhost'
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any)

      const result = await strategy.validate('valid-token', '192.168.1.1', 'submit')

      expect(result.isValid).toBe(true)
      expect(result.score).toBe(0.8)
      expect(result.action).toBe('submit')
      expect(result.hostname).toBe('localhost')
      expect(result.message).toBe('reCAPTCHA validation successful')
    })

    it('should fail validation with low score', async () => {
      const mockResponse = {
        success: true,
        score: 0.3,
        action: 'submit',
        hostname: 'localhost'
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any)

      const result = await strategy.validate('low-score-token')

      expect(result.isValid).toBe(false)
      expect(result.score).toBe(0.3)
      expect(result.message).toBe('reCAPTCHA score 0.3 is too low (threshold: 0.5)')
    })

    it('should fail validation with action mismatch', async () => {
      const mockResponse = {
        success: true,
        score: 0.8,
        action: 'login',
        hostname: 'localhost'
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any)

      const result = await strategy.validate('valid-token', undefined, 'submit')

      expect(result.isValid).toBe(false)
      expect(result.action).toBe('login')
      expect(result.message).toBe('Action mismatch. Expected: submit, Got: login')
    })

    it('should handle Google API errors', async () => {
      const mockResponse = {
        success: false,
        'error-codes': ['invalid-input-response']
      }

      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any)

      const result = await strategy.validate('invalid-token')

      expect(result.isValid).toBe(false)
      expect(result.errorCodes).toEqual(['invalid-input-response'])
      expect(result.message).toBe('reCAPTCHA verification failed: invalid-input-response')
    })

    it('should handle network errors', async () => {
      ;(fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      )

      const result = await strategy.validate('test-token')

      expect(result.isValid).toBe(false)
      expect(result.message).toBe('reCAPTCHA validation service error')
    })
  })

  describe('utility methods', () => {
    it('should return enabled status', () => {
      expect(strategy.isEnabled()).toBe(true)
    })

    it('should return score threshold', () => {
      expect(strategy.getScoreThreshold()).toBe(0.5)
    })
  })
})