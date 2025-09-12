// /backend/src/module/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { RecaptchaStrategy } from './strategies/recaptcha.strategy';
import { RecaptchaGuard } from './guards/recaptcha.guard';
import { JwtConfigService } from './jwt-config.service';
import { throttlerConfigs } from '../../config';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    ThrottlerModule.forRootAsync({
      useFactory: throttlerConfigs.auth.factory,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User], 'test_user_db'),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, RecaptchaStrategy, RecaptchaGuard, JwtConfigService],
  exports: [AuthService, JwtStrategy, RecaptchaStrategy, RecaptchaGuard, PassportModule, JwtConfigService],
})
export class AuthModule {}
