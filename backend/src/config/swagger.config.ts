// backend/src/config/swagger.config.ts
import { DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

export const swaggerConfigs = {
  default: {
    factory: (configService?: ConfigService) => {
      const nodeEnv =
        configService?.get<string>('NODE_ENV', 'local') || 'local';

      if (nodeEnv !== 'production') {
        return new DocumentBuilder()
          .setTitle('Nest Nuxt Web API')
          .setDescription(`
            ## 인증 시스템
            
            ### 🌐 웹 브라우저
            - **Access Token**: 15분 (Bearer)
            - **Refresh Token**: 7일 (HttpOnly Cookie)
            - **CSRF**: 필수
            
            ### 📱 모바일 앱
            - **Access Token**: 30분 (Bearer)
            - **Refresh Token**: 30일 (Response Body)
            - **CSRF**: 불필요 (X-Client-Type: mobile)
          `)
          .setVersion('1.00')
          .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            name: 'access-token',
            description: 'JWT 액세스 토큰',
            in: 'header',
          })
          .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            name: 'refresh-token',
            description: 'JWT 리프레시 토큰 (모바일 전용)',
            in: 'header',
          })
          .addApiKey({
            type: 'apiKey',
            in: 'header',
            name: 'X-CSRF-Token',
            description: 'CSRF 보호 토큰 (웹 브라우저 전용)',
          }, 'csrf-token')
          .addApiKey({
            type: 'apiKey',
            in: 'header',
            name: 'X-Client-Type',
            description: '클라이언트 타입 (mobile/web)',
          }, 'client-type')
          .addTag('AUTH', '인증 관련 API')
          .addTag('CSRF', 'CSRF 토큰 관리')
          .build();
      }

      return undefined;
    },
  },
};
