import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import postgres from 'postgres';
import { env } from '@mcq-platform/config';

type JournalEntry = {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
};

type JournalFile = {
  version: string;
  dialect: string;
  entries: JournalEntry[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const drizzleDir = resolve(__dirname, '../packages/db/drizzle');
const journalPath = resolve(drizzleDir, 'meta/_journal.json');
const baselineSentinelTables = ['projects', 'users', 'workspaces'] as const;

async function readJournal(): Promise<JournalFile> {
  const raw = await readFile(journalPath, 'utf8');
  return JSON.parse(raw) as JournalFile;
}

async function readMigrationSql(tag: string): Promise<string> {
  return readFile(resolve(drizzleDir, `${tag}.sql`), 'utf8');
}

function hashMigration(sql: string): string {
  return crypto.createHash('sha256').update(sql).digest('hex');
}

async function ensureMigrationTable(client: postgres.Sql): Promise<void> {
  await client`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id serial PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint NOT NULL
    )
  `;
}

async function getAppliedHashes(client: postgres.Sql): Promise<Set<string>> {
  const rows = await client<{ hash: string }[]>`
    SELECT hash FROM __drizzle_migrations
  `;
  return new Set(rows.map((row) => row.hash));
}

async function countSentinelTables(client: postgres.Sql): Promise<number> {
  const rows = await client<{ count: string }[]>`
    SELECT COUNT(*)::text AS count
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = ANY(${postgres.array([...baselineSentinelTables])})
  `;
  return Number(rows[0]?.count ?? '0');
}

async function baselineInitialSchema(
  client: postgres.Sql,
  initialEntry: JournalEntry,
  initialHash: string,
  appliedHashes: Set<string>,
): Promise<void> {
  if (appliedHashes.has(initialHash)) {
    return;
  }

  const sentinelCount = await countSentinelTables(client);
  if (sentinelCount === baselineSentinelTables.length) {
    await client`
      INSERT INTO __drizzle_migrations (hash, created_at)
      VALUES (${initialHash}, ${initialEntry.when})
    `;
    appliedHashes.add(initialHash);
    return;
  }

  if (sentinelCount !== 0) {
    throw new Error(
      `Refusing to baseline migrations: found ${sentinelCount}/${baselineSentinelTables.length} sentinel tables.`,
    );
  }
}

async function applyMigration(
  client: postgres.Sql,
  entry: JournalEntry,
  sqlText: string,
  migrationHash: string,
  appliedHashes: Set<string>,
): Promise<void> {
  if (appliedHashes.has(migrationHash)) {
    return;
  }

  const statements = sqlText
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await client.unsafe(statement);
  }

  await client`
    INSERT INTO __drizzle_migrations (hash, created_at)
    VALUES (${migrationHash}, ${entry.when})
  `;
  appliedHashes.add(migrationHash);
}

async function main(): Promise<void> {
  const journal = await readJournal();
  const client = postgres(env.DATABASE_URL, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    onnotice: () => {},
  });

  try {
    await ensureMigrationTable(client);
    const appliedHashes = await getAppliedHashes(client);

    for (const entry of journal.entries) {
      const sqlText = await readMigrationSql(entry.tag);
      const migrationHash = hashMigration(sqlText);

      if (entry.idx === 0) {
        await baselineInitialSchema(client, entry, migrationHash, appliedHashes);
      }

      await applyMigration(client, entry, sqlText, migrationHash, appliedHashes);
    }

    console.log('Migration reconciliation complete.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
