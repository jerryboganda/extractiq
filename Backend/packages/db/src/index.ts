import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@mcq-platform/config';
import { createLogger } from '@mcq-platform/logger';
import * as schema from './schema/index.js';

const logger = createLogger('db');

// Connection pool — postgres.js handles pooling internally
const queryClient = postgres(env.DATABASE_URL, {
  max: env.DB_POOL_MAX,
  idle_timeout: 30,
  connect_timeout: 10,
  onnotice: () => {}, // suppress NOTICE messages
});

/**
 * Drizzle ORM instance with all schema definitions.
 * Every query flows through this singleton.
 */
export const db = drizzle(queryClient, { schema });

export type Database = typeof db;

/**
 * Gracefully close the database connection pool.
 */
export async function closeDb(): Promise<void> {
  logger.info('Closing database connection pool');
  await queryClient.end();
}

// Re-export schema for consumers
export * from './schema/index.js';
export { schema };
