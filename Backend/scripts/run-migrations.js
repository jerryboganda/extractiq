#!/usr/bin/env node

/**
 * Runtime migration runner for generated Drizzle SQL migrations.
 *
 * Source of truth:
 *   Backend/packages/db/drizzle/*.sql
 *   Backend/packages/db/drizzle/meta/_journal.json
 *
 * Usage:
 *   node scripts/run-migrations.js migrate --run
 *   node scripts/run-migrations.js status
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRIZZLE_DIR = join(__dirname, '..', 'packages', 'db', 'drizzle');
const JOURNAL_PATH = join(DRIZZLE_DIR, 'meta', '_journal.json');

const db = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 10,
  connect_timeout: 10,
});

async function ensureMigrationsTable() {
  await db.unsafe(`
    CREATE TABLE IF NOT EXISTS __runtime_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

async function getExecutedMigrations() {
  const result = await db`SELECT name FROM __runtime_migrations ORDER BY name`;
  return new Set(result.map((row) => row.name));
}

async function getMigrationFiles() {
  const journal = JSON.parse(readFileSync(JOURNAL_PATH, 'utf-8'));
  return journal.entries.map((entry) => `${entry.tag}.sql`);
}

async function relationExists(name) {
  const result = await db`SELECT to_regclass(${`public.${name}`}) as relation`;
  return Boolean(result[0]?.relation);
}

async function canMarkMigrationAsApplied(file) {
  if (file === '0000_magical_adam_destine.sql') {
    const required = ['workspaces', 'users', 'projects', 'documents', 'jobs', 'mcq_records', 'provider_configs', 'notifications'];
    for (const relation of required) {
      if (!(await relationExists(relation))) return false;
    }
    return true;
  }

  if (file === '0001_workflow_hardening.sql') {
    const required = ['invitation_tokens', 'public_submissions', 'email_deliveries'];
    for (const relation of required) {
      if (!(await relationExists(relation))) return false;
    }
    return true;
  }

  return false;
}

async function migrate() {
  await ensureMigrationsTable();
  
  const executed = await getExecutedMigrations();
  const files = await getMigrationFiles();
  
  console.log('\n📊 Migration Status:\n');
  
  let ranCount = 0;
  
  for (const file of files) {
    if (executed.has(file)) {
      console.log(`  ✓ ${file}`);
    } else {
      console.log(`  ○ ${file} (pending)`);
    }
  }
  
  console.log(`\n${executed.size}/${files.length} executed\n`);
  
  if (process.argv.includes('--run')) {
    console.log('🔄 Running pending migrations...\n');
    
    for (const file of files) {
      if (!executed.has(file)) {
        console.log(`  ▶ ${file}`);
        const migrationSql = readFileSync(join(DRIZZLE_DIR, file), 'utf-8');

        if (await canMarkMigrationAsApplied(file)) {
          await db`INSERT INTO __runtime_migrations (name) VALUES (${file}) ON CONFLICT (name) DO NOTHING`;
          console.log(`  ✓ ${file} reconciled against existing schema`);
          ranCount++;
          continue;
        }
        
        try {
          await db.begin(async (tx) => {
            await tx.unsafe(migrationSql);
            await tx`INSERT INTO __runtime_migrations (name) VALUES (${file})`;
          });
          console.log(`  ✓ ${file} completed`);
          ranCount++;
        } catch (err) {
          console.error(`  ✗ ${file} failed:`, err.message);
          process.exit(1);
        }
      }
    }
    
    console.log(`\n✅ ${ranCount} migration(s) executed\n`);
  }
  
  await db.end();
}

async function status() {
  await ensureMigrationsTable();
  
  const executed = await getExecutedMigrations();
  const files = await getMigrationFiles();
  
  console.log('\n📊 Migration Status:\n');
  
  for (const file of files) {
    if (executed.has(file)) {
      console.log(`  ✓ ${file}`);
    } else {
      console.log(`  ○ ${file} (pending)`);
    }
  }
  
  console.log(`\n${executed.size}/${files.length} executed\n`);
  
  await db.end();
}

const command = process.argv[2];

if (command === 'migrate') {
  migrate();
} else if (command === 'status') {
  status();
} else {
  console.log(`
Database Migration Runner

Usage:
  node scripts/run-migrations.js migrate --run   Run pending migrations
  node scripts/run-migrations.js status          Show migration status

Create new schema migrations with:
  npm run db:generate
`);
  process.exit(1);
}
