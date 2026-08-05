import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { config } from '../config/env';
import logger from '../utils/logger';

/**
 * Applies pending Drizzle migrations from ./drizzle.
 * Run with: npm run db:migrate
 */
const pool = new Pool({ connectionString: config.databaseUrl });

const maskDatabaseUrl = (databaseUrl: string): string => {
  try {
    const url = new URL(databaseUrl);
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return '<invalid DATABASE_URL>';
  }
};

const run = async (): Promise<void> => {
  const db = drizzle(pool, { schema: {} });
  logger.info('Applying database migrations...', {
    databaseUrl: maskDatabaseUrl(config.databaseUrl),
  });
  await migrate(db, { migrationsFolder: './drizzle' });
  logger.info('Migrations applied successfully.');
  await pool.end();
};

run().catch(async (err) => {
  const cause = err?.cause ?? err;
  logger.error('Migration failed', {
    error: err?.message,
    cause: cause?.message,
    code: cause?.code,
    detail: cause?.detail,
    hint: cause?.hint,
    databaseUrl: maskDatabaseUrl(config.databaseUrl),
  });
  await pool.end().catch(() => undefined);
  process.exit(1);
});
