// backend/src/config/throttler.config.ts

export interface ThrottlerConfig {
  throttlers: Array<{
    name?: string;
    ttl: number;
    limit: number;
  }>;
}

const profile = (
  name: string,
  ttlEnv: string,
  limitEnv: string,
  defTtl: number,
  defLimit: number,
) => ({
  name,
  ttl: Number(process.env[ttlEnv] ?? defTtl),
  limit: Number(process.env[limitEnv] ?? defLimit),
});

export const throttlerConfigs = {
  auth: {
    factory: () => ({
      throttlers: [
        profile(
          'register',
          'AUTH_REGISTER_TTL',
          'AUTH_REGISTER_LIMIT',
          60_000,
          5,
        ),
        profile('login', 'AUTH_LOGIN_TTL', 'AUTH_LOGIN_LIMIT', 60_000, 10),
        profile(
          'refresh',
          'AUTH_REFRESH_TTL',
          'AUTH_REFRESH_LIMIT',
          60_000,
          20,
        ),
        profile(
          'profile',
          'AUTH_PROFILE_TTL',
          'AUTH_PROFILE_LIMIT',
          60_000,
          100,
        ),
      ],
    }),
  },
};
