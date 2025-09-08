// /backend/src/module/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { getRefreshCookieName } from './constants/cookies';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, RefreshResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { JwtRefreshPayload } from './strategies/jwt-refresh.strategy';
import { JwtConfigService } from './jwt-config.service';

// Internal interfaces with refreshToken for controller use
export interface InternalAuthResponse extends AuthResponseDto {
  refreshToken: string;
}

export interface InternalRefreshResponse extends RefreshResponseDto {
  refreshToken: string;
}

// Registration result interface (no tokens)
export interface RegisterResult {
  user: {
    idx: number;
    email: string;
    isActive: boolean;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User, 'test_user_db')
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly jwtConfig: JwtConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResult> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        throw new ConflictException(
          this.i18n.translate('auth.EMAIL_ALREADY_EXISTS'),
        );
      }

      const rounds = Number(this.configService.get('BCRYPT_ROUNDS') ?? 12);
      const hashedPassword = await bcrypt.hash(registerDto.password, rounds);

      const user = this.userRepository.create({
        email: registerDto.email,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(user);

      return {
        user: {
          idx: savedUser.idx,
          email: savedUser.email,
          isActive: savedUser.isActive,
        },
      };
    } catch (error) {
      // Log error without sensitive details
      this.logger.error('Registration failed');

      if (error instanceof ConflictException) {
        throw error;
      }

      throw new BadRequestException(
        this.i18n.translate('auth.REGISTRATION_FAILED'),
      );
    }
  }

  async login(loginDto: LoginDto): Promise<InternalAuthResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: loginDto.email, isActive: true },
      });

      if (!user) {
        throw new UnauthorizedException(
          this.i18n.translate('auth.INVALID_CREDENTIALS'),
        );
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException(
          this.i18n.translate('auth.INVALID_CREDENTIALS'),
        );
      }

      const tokens = await this.generateTokens(user);
      // Stateless mode: no database storage needed

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          idx: user.idx,
          email: user.email,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      // Log error without sensitive details
      this.logger.error('Login failed');

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new BadRequestException(this.i18n.translate('auth.LOGIN_FAILED'));
    }
  }

  async refresh(user: User): Promise<InternalRefreshResponse> {
    try {
      const tokens = await this.generateTokens(user);
      // Stateless mode: no database storage needed

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          idx: user.idx,
          email: user.email,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      // Log error without sensitive details
      this.logger.error('Token refresh failed');
      throw new UnauthorizedException(
        this.i18n.translate('auth.TOKEN_REFRESH_FAILED'),
      );
    }
  }

  async logout(userId: number): Promise<void> {
    // Stateless mode: no database cleanup needed
    // Token invalidation happens via cookie removal only
  }

  async validateUser(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { email, isActive: true },
      });
    } catch (error) {
      // Log error without sensitive details
      this.logger.error('User validation failed');
      return null;
    }
  }

  async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const now = Math.floor(Date.now() / 1000);
    const issuer = this.configService.get('JWT_ISSUER', 'nest-nuxt-app');
    const audience = this.configService.get('JWT_AUDIENCE', 'nest-nuxt-app');

    const accessPayload: JwtPayload = {
      sub: user.idx,
      email: user.email,
      type: 'access',
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.idx,
      email: user.email,
      type: 'refresh',
      jti: this.generateJTI(),
      iat: now,
      iss: issuer,
      aud: audience,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.jwtConfig.accessSecret,
      expiresIn: this.jwtConfig.accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.jwtConfig.refreshSecret,
      expiresIn: this.jwtConfig.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  private generateJTI(): string {
    return randomUUID();
  }

  getRefreshTokenCookieOptions() {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? ('strict' as const) : ('lax' as const),
      path: '/', // __Host- requires path="/"
      // ⚠️ No domain when using __Host- cookie
      maxAge: 12 * 60 * 60 * 1000, // 12 hours (matches JWT expiration)
    };
  }

  clearRefreshTokenCookie(response: Response): void {
    const opts = this.getRefreshTokenCookieOptions();
    const refreshCookieName = getRefreshCookieName(this.configService);
    response.clearCookie(refreshCookieName, {
      ...opts,
      maxAge: 0,
      expires: new Date(0),
    });
  }
}
