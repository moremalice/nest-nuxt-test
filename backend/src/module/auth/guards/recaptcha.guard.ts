import { Injectable, CanActivate, ExecutionContext, BadRequestException, Logger } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { RecaptchaStrategy } from '../strategies/recaptcha.strategy'
import { RECAPTCHA_METADATA_KEY, RecaptchaOptions } from '../decorators/recaptcha.decorator'

@Injectable()
export class RecaptchaGuard implements CanActivate {
  private readonly logger = new Logger(RecaptchaGuard.name)

  constructor(
    private readonly recaptchaStrategy: RecaptchaStrategy,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const recaptchaOptions = this.reflector.get<RecaptchaOptions>(
      RECAPTCHA_METADATA_KEY,
      context.getHandler()
    )

    if (!recaptchaOptions) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    
    const token = this.extractRecaptchaToken(request)
    const remoteIp = this.extractClientIp(request)

    if (!this.recaptchaStrategy.isEnabled()) {
      this.logger.debug('reCAPTCHA is disabled, skipping validation')
      return true
    }

    if (!token) {
      if (recaptchaOptions.required) {
        throw new BadRequestException('reCAPTCHA token is required')
      }
      return true
    }

    try {
      const result = await this.recaptchaStrategy.validate(
        token, 
        remoteIp, 
        recaptchaOptions.action
      )

      if (!result.isValid) {
        this.logger.warn(`reCAPTCHA validation failed: ${result.message}`)
        throw new BadRequestException(result.message || 'reCAPTCHA validation failed')
      }

      // 검증 결과를 request 객체에 저장하여 컨트롤러에서 사용할 수 있도록 함
      request['recaptchaResult'] = result

      return true
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      
      this.logger.error('reCAPTCHA guard error:', error)
      throw new BadRequestException('reCAPTCHA validation error')
    }
  }

  private extractRecaptchaToken(request: Request): string | undefined {
    // Body에서 g-recaptcha-response 또는 recaptchaToken 필드 찾기
    const body = request.body || {}
    return body['g-recaptcha-response'] || body['recaptchaToken'] || body['token']
  }

  private extractClientIp(request: Request): string | undefined {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip
    )?.split(',')[0]?.trim()
  }
}