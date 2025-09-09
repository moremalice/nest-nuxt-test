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
        // 먼저 Authorization 헤더에서 토큰 추출 시도 (모바일용)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 그 다음 쿠키에서 토큰 추출 시도 (웹용)
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

    // Stateless 검증 - 데이터베이스 토큰 비교 불필요
    // JWT 서명 검증은 passport-jwt에서 이미 수행됨

    // 선택사항: 보안 강화를 위한 추가 클레임 검증
    if (payload.iss && payload.iss !== this.configService.get('JWT_ISSUER', 'nest-nuxt-app')) {
      throw new UnauthorizedException('Invalid token issuer');
    }

    if (payload.aud && payload.aud !== this.configService.get('JWT_AUDIENCE', 'nest-nuxt-app')) {
      throw new UnauthorizedException('Invalid token audience');
    }

    // 사용자 존재 여부 및 활성 상태만 확인
    const user = await this.userRepository.findOne({
      where: { idx: payload.sub, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // 성공적인 토큰 갱신
    return user;
  }
}
