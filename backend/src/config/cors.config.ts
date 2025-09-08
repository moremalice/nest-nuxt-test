// backend/src/config/cors.config.ts
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export const corsConfigs = {
  default: {
    factory: (configService: ConfigService): CorsOptions => {
      const nodeEnv = configService.get<string>('NODE_ENV', 'local');

      if (nodeEnv === 'production') {
        return {
          origin: ['https://pikitalk.com', 'https://www.pikitalk.com'],
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
        };
      }

      return {
        origin: true,
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
      };
    },
  },
};
