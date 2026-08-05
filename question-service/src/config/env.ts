import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Centralised, typed application configuration.
 * Every consumer imports from here instead of reading process.env directly,
 * which keeps validation and defaults in a single place.
 */
const env = process.env;

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  nodeEnv: env.NODE_ENV || 'development',
  isProduction: (env.NODE_ENV || 'development') === 'production',
  isTest: (env.NODE_ENV || 'development') === 'test',
  port: toNumber(env.PORT, 4002),
  appName: env.APP_NAME || 'devbattle-question-service',
  apiPrefix: env.API_PREFIX || '/api/v1',

  corsOrigin: env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173'],

  databaseUrl:
    env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5434/devbattle_question',

  jwt: {
    secret: env.JWT_ACCESS_SECRET || env.JWT_SECRET || 'devbattle-shared-jwt-secret',
    publicKey: env.JWT_PUBLIC_KEY || '',
    issuer: env.JWT_ISSUER || 'devbattle-auth-service',
    audience: env.JWT_AUDIENCE || 'devbattle-client',
  },

  internalApiKey: env.INTERNAL_API_KEY || 'internal-service-token-change-me',

  rateLimit: {
    windowMs: toNumber(env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: toNumber(env.RATE_LIMIT_MAX, 120),
  },

  logLevel: env.LOG_LEVEL || 'info',
} as const;

export type AppConfig = typeof config;
