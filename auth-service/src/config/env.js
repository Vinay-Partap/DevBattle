// ===========================================
// Environment Configuration
// ===========================================

import dotenv from 'dotenv';

dotenv.config();

const env = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 4000,
  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  // Database
  DATABASE_URL:
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/devbattle_auth',

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'devbattle-shared-jwt-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-me',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'],
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',

  // Cookies
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'cookie-secret-change-me',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || 'lax',

  // SMTP Email
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'DevBattle',
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'noreply@devbattle.com',

  // Application URLs
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  RESET_PASSWORD_URL: process.env.RESET_PASSWORD_URL || 'http://localhost:3000/reset-password',
  VERIFY_EMAIL_URL: process.env.VERIFY_EMAIL_URL || 'http://localhost:3000/verify-email',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  // User Service Integration
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:4001',
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || 'internal-service-token-change-me',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
};

/**
 * Validates critical environment variables on startup.
 */
const validateEnv = () => {
  const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !env[key] || env[key] === '');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (env.NODE_ENV === 'production') {
    const productionRequired = ['COOKIE_SECRET', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
    const prodMissing = productionRequired.filter((key) => !env[key] || env[key] === '');

    if (prodMissing.length > 0) {
      throw new Error(
        `Missing required production environment variables: ${prodMissing.join(', ')}`,
      );
    }
  }
};

export { env, validateEnv };
export default env;
