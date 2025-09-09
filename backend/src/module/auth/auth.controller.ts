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
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 400, description: 'Registration failed' })
  @ApiResponse({ status: 429, description: 'Too many registration attempts' })
  @ApiSecurity('csrf-token')
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
  @ApiOperation({ summary: 'Login user (supports both web and mobile)' })
  @ApiHeader({
    name: 'X-Client-Type',
    description: 'Client type (mobile or web)',
    required: false,
    enum: ['mobile', 'web'],
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful (adaptive response based on client type)',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Login failed' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  @ApiSecurity('csrf-token')
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
  @ApiOperation({ summary: 'Refresh access token (supports both web and mobile)' })
  @ApiHeader({
    name: 'X-Client-Type',
    description: 'Client type (mobile or web)',
    required: false,
    enum: ['mobile', 'web'],
  })
  @ApiBearerAuth('refresh-token')
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully (adaptive response based on client type)',
    type: RefreshResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 429, description: 'Too many refresh attempts' })
  @ApiSecurity('csrf-token')
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user (supports both web and mobile)' })
  @ApiHeader({
    name: 'X-Client-Type',
    description: 'Client type (mobile or web)',
    required: false,
    enum: ['mobile', 'web'],
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful (adaptive response based on client type)',
    type: LogoutResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiSecurity('csrf-token')
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Req() request: AuthenticatedRequest): {
    user: ProfileResponseDto;
  } {
    const { password: _, ...userProfile } = request.user;
    return { user: userProfile };
  }

  @Get('test')
  @ApiOperation({ summary: 'Auth module test endpoint' })
  @ApiResponse({ status: 200, description: 'Auth module is working' })
  async test(): Promise<{ message: string; timestamp: string }> {
    return {
      message: 'Auth module is working correctly',
      timestamp: new Date().toISOString(),
    };
  }
}
