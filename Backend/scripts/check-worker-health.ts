import { sql } from 'drizzle-orm';
import { db, closeDb } from '@mcq-platform/db';
import { pingRedis } from '@mcq-platform/queue';

async function main() {
  try {
    await Promise.all([
      db.execute(sql`SELECT 1`),
      pingRedis(),
    ]);

    process.exit(0);
  } catch (err) {
    console.error('Worker healthcheck failed', err);
    process.exit(1);
  } finally {
    await closeDb().catch(() => undefined);
  }
}

main();
