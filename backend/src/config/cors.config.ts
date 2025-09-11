// backend/src/config/cors.config.ts
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export const corsConfigs = {
  default: {
    factory: (configService: ConfigService): CorsOptions => {
      const nodeEnv = configService.get<string>('NODE_ENV', 'local');
      const allowedOriginsStr = configService.get<string>('CORS_ALLOWED_ORIGINS', '');
      const credentials = configService.get<boolean>('CORS_CREDENTIALS', true);

      // 환경변수에서 허용 도메인 파싱 (콤마로 구분)
      const allowedOrigins = allowedOriginsStr
        ? allowedOriginsStr.split(',').map(origin => origin.trim())
        : [];

      // 개발 환경에서는 환경변수가 없으면 특정 도메인들 허용
      const origin = allowedOrigins.length > 0 
        ? allowedOrigins 
        : (nodeEnv === 'production' ? false : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']);

      return {
        origin: (requestOrigin, callback) => {
          // 개발 환경에서는 모든 localhost 포트 허용
          if (nodeEnv !== 'production') {
            if (!requestOrigin || /^https?:\/\/localhost(:\d+)?$/.test(requestOrigin)) {
              callback(null, true);
              return;
            }
          }
          
          // production 환경이거나 허용된 도메인 확인
          if (Array.isArray(allowedOrigins)) {
            callback(null, allowedOrigins.includes(requestOrigin));
          } else {
            callback(null, false);
          }
        },
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: [
          'Origin',
          'Content-Type',
          'Accept',
          'Authorization',
          'X-CSRF-Token',
        ],
        exposedHeaders: ['X-CSRF-Token'],
        optionsSuccessStatus: 200,
        preflightContinue: false,
      };
    },
  },
};
