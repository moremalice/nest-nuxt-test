// /backend/src/module/auth/jwt-config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtConfigService {
  constructor(private readonly config: ConfigService) {}

  private getSecret(envKey: string): string {
    const isProd =
      this.config.get<string>('NODE_ENV', 'local') === 'production';
    const secret = this.config.get<string>(envKey);

    if (!secret) {
      if (isProd) {
        throw new Error(`JWT misconfig: ${envKey} is required in production.`);
      }
      return 'dev-fallback-secret';
    }

    if (isProd && secret.length < 32) {
      throw new Error(
        `JWT weak secret: ${envKey} must be >= 32 chars in production.`,
      );
    }

    return secret;
  }

  get accessSecret(): string {
    return this.getSecret('JWT_ACCESS_SECRET');
  }

  get refreshSecret(): string {
    return this.getSecret('JWT_REFRESH_SECRET');
  }

  get accessExpiresIn(): string {
    return this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
  }

  get refreshExpiresIn(): string {
    return this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '12h');
  }
}
