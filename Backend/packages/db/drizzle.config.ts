import { env } from '@mcq-platform/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './packages/db/src/schema/index.ts',
  out: './packages/db/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
