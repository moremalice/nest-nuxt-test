// /backend/src/module/auth/auth.service.ts
import {Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger,} from '@nestjs/common';
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
import { JwtPayload } from './strategies/jwt.strategy';
import { JwtRefreshPayload } from './strategies/jwt-refresh.strategy';
import { JwtConfigService } from './jwt-config.service';
import { ClientType } from './decorators/client-type.decorator';

// 컨트롤러에서 사용하는 refreshToken이 포함된 내부 인터페이스
export interface InternalAuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        idx: number;
        email: string;
        isActive: boolean;
    };
}

export interface InternalRefreshResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        idx: number;
        email: string;
        isActive: boolean;
    };
}

// 회원가입 결과 인터페이스 (토큰 없음)
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
            // 민감한 정보 없이 오류 로깅
            this.logger.error('Registration failed');

            if (error instanceof ConflictException) {
                throw error;
            }

            throw new BadRequestException(
                this.i18n.translate('auth.REGISTRATION_FAILED'),
            );
        }
    }

    async login(loginDto: LoginDto, clientType: ClientType = ClientType.WEB): Promise<InternalAuthResponse> {
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

            const tokens = await this.generateTokens(user, clientType);
            // Stateless 모드: 데이터베이스 저장 필요 없음

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
            // 민감한 정보 없이 오류 로깅
            this.logger.error('Login failed');

            if (error instanceof UnauthorizedException) {
                throw error;
            }

            throw new BadRequestException(this.i18n.translate('auth.LOGIN_FAILED'));
        }
    }

    async refresh(user: User, clientType: ClientType = ClientType.WEB): Promise<InternalRefreshResponse> {
        try {
            const tokens = await this.generateTokens(user, clientType);
            // Stateless 모드: 데이터베이스 저장 필요 없음

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
            // 민감한 정보 없이 오류 로깅
            this.logger.error('Token refresh failed');
            throw new UnauthorizedException(
                this.i18n.translate('auth.TOKEN_REFRESH_FAILED'),
            );
        }
    }

    async logout(userId: number, clientType: ClientType = ClientType.WEB): Promise<{ message: string; loggedOutAt: string; cleanup: { clearTokens: boolean; tokenTypes: string[] } } | void> {
        // Stateless 모드: 데이터베이스 정리 필요 없음
        // 토큰 무효화는 쿠키 제거를 통해서만 수행됨

        // 모바일 클라이언트의 경우, 상세한 로그아웃 안내 반환
        if (clientType === ClientType.MOBILE) {
            return {
                message: 'Successfully logged out',
                loggedOutAt: new Date().toISOString(),
                cleanup: {
                    clearTokens: true,
                    tokenTypes: ['access_token', 'refresh_token'],
                },
            };
        }

        // 웹 클라이언트의 경우, void 반환 (기존 동작)
        return;
    }

    async validateUser(email: string): Promise<User | null> {
        try {
            return await this.userRepository.findOne({
                where: { email, isActive: true },
            });
        } catch (error) {
            // 민감한 정보 없이 오류 로깅
            this.logger.error('User validation failed');
            return null;
        }
    }

    async generateTokens(
        user: User,
        clientType: ClientType = ClientType.WEB,
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
            expiresIn: this.jwtConfig.getAccessExpiresIn(clientType),
        });

        const refreshToken = this.jwtService.sign(refreshPayload, {
            secret: this.jwtConfig.refreshSecret,
            expiresIn: this.jwtConfig.getRefreshExpiresIn(clientType),
        });

        return { accessToken, refreshToken };
    }

    private generateJTI(): string {
        return randomUUID();
    }

    getRefreshTokenCookieOptions(clientType: ClientType = ClientType.WEB) {
        const isProd = this.configService.get<string>('NODE_ENV') === 'production';

        // 쿠키 maxAge를 위해 만료 시간 문자열을 밀리초로 변환
        const expiresIn = this.jwtConfig.getRefreshExpiresIn(clientType);
        const maxAge = this.parseExpirationToMilliseconds(expiresIn);

        return {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? ('strict' as const) : ('lax' as const),
            path: '/', // __Host-는 path="/"를 요구함
            // ⚠️ __Host- 쿠키 사용 시 domain 없음
            maxAge,
        };
    }

    private parseExpirationToMilliseconds(expiresIn: string): number {
        const time = parseInt(expiresIn.slice(0, -1));
        const unit = expiresIn.slice(-1);

        switch (unit) {
            case 's': return time * 1000;
            case 'm': return time * 60 * 1000;
            case 'h': return time * 60 * 60 * 1000;
            case 'd': return time * 24 * 60 * 60 * 1000;
            default: return 12 * 60 * 60 * 1000; // 12시간으로 폴백
        }
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
