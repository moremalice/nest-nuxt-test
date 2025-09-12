import { SetMetadata } from '@nestjs/common'

export const RECAPTCHA_METADATA_KEY = 'recaptcha'

export interface RecaptchaOptions {
  action?: string
  required?: boolean
}

export const Recaptcha = (options: RecaptchaOptions = {}) => 
  SetMetadata(RECAPTCHA_METADATA_KEY, { required: true, ...options })

export const OptionalRecaptcha = (options: Omit<RecaptchaOptions, 'required'> = {}) => 
  SetMetadata(RECAPTCHA_METADATA_KEY, { required: false, ...options })