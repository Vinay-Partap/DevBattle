import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5434/devbattle_question',
  },
  strict: true,
  verbose: true,
});
