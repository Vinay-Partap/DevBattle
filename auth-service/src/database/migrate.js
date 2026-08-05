// ===========================================
// Idempotent Auth Database Migration
// ===========================================

import { client } from '../config/db.config.js';
import { logger } from '../utils/logger.js';

const run = async () => {
  logger.info('Applying auth-service database migration...');

  await client`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(255) NOT NULL,
      email varchar(255) NOT NULL UNIQUE,
      password_hash text NOT NULL,
      role varchar(50) NOT NULL DEFAULT 'student',
      is_active boolean NOT NULL DEFAULT false,
      is_verified boolean NOT NULL DEFAULT false,
      verification_token text,
      verification_token_expiry timestamp with time zone,
      reset_password_token text,
      reset_password_token_expiry timestamp with time zone,
      refresh_token text,
      refresh_token_expiry timestamp with time zone,
      last_login_at timestamp with time zone,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    )
  `;

  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false`;
  await client`CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)`;
  await client`CREATE INDEX IF NOT EXISTS users_role_idx ON users (role)`;
  await client`CREATE INDEX IF NOT EXISTS users_is_active_idx ON users (is_active)`;
  await client`CREATE INDEX IF NOT EXISTS users_verification_token_idx ON users (verification_token)`;
  await client`CREATE INDEX IF NOT EXISTS users_reset_password_token_idx ON users (reset_password_token)`;
  await client`CREATE INDEX IF NOT EXISTS users_refresh_token_idx ON users (refresh_token)`;
  await client`CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at)`;

  logger.info('Auth-service database migration applied successfully.');
};

run()
  .catch((error) => {
    logger.error('Auth-service migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
