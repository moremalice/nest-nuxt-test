// /backend/src/module/auth/constants/cookies.ts
import { ConfigService } from '@nestjs/config';

export const getRefreshCookieName = (configService: ConfigService): string => {
  const nodeEnv = configService.get<string>('NODE_ENV', 'local');
  return nodeEnv === 'production' ? '__Host-refresh-token' : 'refresh-token';
};
