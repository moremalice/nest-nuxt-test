// /backend/src/module/auth/strategies/jwt-refresh.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { getRefreshCookieName } from '../constants/cookies';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { JwtConfigService } from '../jwt-config.service';

export interface JwtRefreshPayload {
  sub: number;
  email: string;
  type: 'refresh';
  jti?: string;
  iat?: number;
  iss?: string;
  aud?: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @InjectRepository(User, 'test_user_db')
    private readonly userRepository: Repository<User>,
    private readonly jwtConfig: JwtConfigService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const refreshCookieName = getRefreshCookieName(configService);
          const token = request?.cookies?.[refreshCookieName];
          return token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.refreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtRefreshPayload): Promise<User> {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Stateless validation - no database token comparison needed
    // JWT signature validation is already done by passport-jwt

    // Optional: Validate additional claims for enhanced security
    if (payload.iss && payload.iss !== this.configService.get('JWT_ISSUER', 'nest-nuxt-app')) {
      throw new UnauthorizedException('Invalid token issuer');
    }

    if (payload.aud && payload.aud !== this.configService.get('JWT_AUDIENCE', 'nest-nuxt-app')) {
      throw new UnauthorizedException('Invalid token audience');
    }

    // Only verify user exists and is active
    const user = await this.userRepository.findOne({
      where: { idx: payload.sub, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Successful refresh
    return user;
  }
}
