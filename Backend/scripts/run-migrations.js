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
import pg from 'pg';
const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRIZZLE_DIR = join(__dirname, '..', 'packages', 'db', 'drizzle');
const JOURNAL_PATH = join(DRIZZLE_DIR, 'meta', '_journal.json');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS __runtime_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

async function getExecutedMigrations() {
  const result = await pool.query('SELECT name FROM __runtime_migrations ORDER BY name');
  return new Set(result.rows.map(r => r.name));
}

async function getMigrationFiles() {
  const journal = JSON.parse(readFileSync(JOURNAL_PATH, 'utf-8'));
  return journal.entries.map((entry) => `${entry.tag}.sql`);
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
        const sql = readFileSync(join(DRIZZLE_DIR, file), 'utf-8');
        
        await pool.query('BEGIN');
        try {
          await pool.query(sql);
          await pool.query('INSERT INTO __runtime_migrations (name) VALUES ($1)', [file]);
          await pool.query('COMMIT');
          console.log(`  ✓ ${file} completed`);
          ranCount++;
        } catch (err) {
          await pool.query('ROLLBACK');
          console.error(`  ✗ ${file} failed:`, err.message);
          process.exit(1);
        }
      }
    }
    
    console.log(`\n✅ ${ranCount} migration(s) executed\n`);
  }
  
  await pool.end();
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
  
  await pool.end();
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
