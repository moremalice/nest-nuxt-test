// /backend/src/module/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Res, Get, HttpCode, HttpStatus, Req, Header, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiBearerAuth, ApiHeader, } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ProxyAwareThrottlerGuard } from '../../common/guards/proxy-aware-throttler.guard';
import { getRefreshCookieName } from './constants/cookies';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto, ProfileResponseDto, AuthResponseDto, RefreshResponseDto, LogoutResponseDto } from './dto/auth-response.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from './interfaces/auth-request.interface';
import { ClientType, GetClientType } from './decorators/client-type.decorator';

@ApiTags('AUTH')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @UseGuards(ProxyAwareThrottlerGuard)
  @Throttle({ register: { ttl: 60000, limit: 5 } }) // 5 attempts per minute
  @ApiOperation({ 
    summary: '회원가입',
    description: '웹: CSRF 토큰 필수 | 모바일: X-Client-Type: mobile'
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 409, description: '이미 존재하는 이메일' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: 'CSRF 토큰 오류 (웹 전용)' })
  @ApiResponse({ status: 429, description: '너무 많은 시도' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    const result = await this.authService.register(registerDto);

    // 회원가입 성공 시 생성된 사용자 정보 반환
    return {
      idx: result.user.idx,
      email: result.user.email,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ProxyAwareThrottlerGuard)
  @Throttle({ login: { ttl: 60000, limit: 10 } }) // 10 attempts per minute
  @ApiOperation({ 
    summary: '로그인',
    description: '웹: Refresh는 쿠키로 | 모바일: 모든 토큰 Body로 반환'
  })
  @ApiHeader({
    name: 'X-Client-Type',
    description: '클라이언트 타입',
    required: false,
    enum: ['mobile', 'web'],
    example: 'mobile',
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: AuthResponseDto,
    headers: {
      'Set-Cookie': {
        description: 'Refresh 토큰 쿠키 (웹 전용)',
        schema: { type: 'string' },
      },
      'X-CSRF-Skipped': {
        description: 'CSRF 우회 표시 (모바일)',
        schema: { type: 'string', example: 'mobile-client' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '잘못된 인증 정보' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: 'CSRF 토큰 오류 (웹 전용)' })
  @ApiResponse({ status: 429, description: '너무 많은 시도' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @GetClientType() clientType: ClientType,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(loginDto, clientType);

    // Mobile clients: return refresh token in response body
    if (clientType === ClientType.MOBILE) {
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      };
    }

    // Web clients: set refresh token as HttpOnly cookie
    const cookieOptions = this.authService.getRefreshTokenCookieOptions(clientType);
    const refreshCookieName = getRefreshCookieName(this.configService);
    response.cookie(refreshCookieName, result.refreshToken, cookieOptions);

    // Return unified response (without refresh token for web clients)
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard, ProxyAwareThrottlerGuard)
  @Throttle({ refresh: { ttl: 60000, limit: 20 } }) // 20 attempts per minute for refresh
  @ApiOperation({ 
    summary: '토큰 갱신',
    description: '웹: 쿠키에서 Refresh 읽음 | 모바일: Bearer로 Refresh 전송'
  })
  @ApiHeader({
    name: 'X-Client-Type',
    description: '클라이언트 타입',
    required: false,
    enum: ['mobile', 'web'],
    example: 'mobile',
  })
  @ApiBearerAuth('refresh-token')
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공',
    type: RefreshResponseDto,
    headers: {
      'Set-Cookie': {
        description: 'New refresh token cookie (web browsers only)',
        schema: { type: 'string' },
      },
      'X-CSRF-Skipped': {
        description: 'Indicates CSRF was skipped for mobile client',
        schema: { type: 'string', example: 'mobile-client' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '만료된 Refresh 토큰' })
  @ApiResponse({ status: 403, description: 'CSRF 토큰 오류 (웹 전용)' })
  @ApiResponse({ status: 429, description: '너무 많은 시도' })
  async refresh(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
    @GetClientType() clientType: ClientType,
  ): Promise<RefreshResponseDto> {
    const result = await this.authService.refresh(request.user, clientType);

    // Mobile clients: return new refresh token in response body
    if (clientType === ClientType.MOBILE) {
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      };
    }

    // Web clients: set new refresh token as HttpOnly cookie
    const cookieOptions = this.authService.getRefreshTokenCookieOptions(clientType);
    const refreshCookieName = getRefreshCookieName(this.configService);
    response.cookie(refreshCookieName, result.refreshToken, cookieOptions);

    // Return unified response (without refresh token for web clients)
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ 
    summary: '로그아웃',
    description: '웹: 쿠키 삭제 | 모바일: 토큰 삭제 안내'
  })
  @ApiHeader({
    name: 'X-Client-Type',
    description: '클라이언트 타입',
    required: false,
    enum: ['mobile', 'web'],
    example: 'mobile',
  })
  @ApiResponse({ 
    status: 200, 
    description: '로그아웃 성공',
    type: LogoutResponseDto,
    headers: {
      'Set-Cookie': {
        description: 'Cleared refresh token cookie (web browsers only)',
        schema: { type: 'string' },
      },
      'X-CSRF-Skipped': {
        description: 'Indicates CSRF was skipped for mobile client',
        schema: { type: 'string', example: 'mobile-client' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: 'CSRF 토큰 오류 (웹 전용)' })
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
    @GetClientType() clientType: ClientType,
  ): Promise<LogoutResponseDto> {
    // Get logout response from service (mobile-specific or void)
    const result = await this.authService.logout(request.user.idx, clientType);
    
    // Always clear refresh token cookie (for web clients)
    this.authService.clearRefreshTokenCookie(response);
    
    // Return unified response (mobile clients get detailed response, web gets empty object)
    return result || {};
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, ProxyAwareThrottlerGuard)
  @Throttle({ profile: { ttl: 60000, limit: 100 } })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiBearerAuth('access-token')
  @ApiOperation({ 
    summary: '사용자 프로필 조회',
    description: 'GET 요청은 CSRF 불필요'
  })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  getProfile(@Req() request: AuthenticatedRequest): {
    user: ProfileResponseDto;
  } {
    const { password: _, ...userProfile } = request.user;
    return { user: userProfile };
  }

  @Get('test')
  @ApiOperation({ 
    summary: '인증 모듈 테스트',
    description: '상태 확인용 엔드포인트'
  })
  @ApiResponse({ status: 200, description: '정상 동작 중' })
  async test(): Promise<{ message: string; timestamp: string }> {
    return {
      message: 'Auth module is working correctly',
      timestamp: new Date().toISOString(),
    };
  }
}
