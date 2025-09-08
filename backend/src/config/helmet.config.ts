// /backend/src/config/helmet.config.ts
import { ConfigService } from '@nestjs/config';

export const helmetConfigs = {
  default: {
    factory: (configService: ConfigService): boolean => {
      const nodeEnv = configService.get<string>('NODE_ENV', 'local');
      return nodeEnv === 'production';
    },
  },
};
