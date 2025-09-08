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
          .setVersion('1.00')
          .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            name: 'JWT',
            in: 'header',
          })
          .addSecurity('csrf-token', {
            type: 'apiKey',
            in: 'header',
            name: 'X-CSRF-Token',
            description: 'CSRF protection token',
          })
          .addTag('AUTH', 'Authentication endpoints')
          .build();
      }

      return undefined;
    },
  },
};
