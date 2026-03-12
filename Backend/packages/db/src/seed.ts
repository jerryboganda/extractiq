/**
 * Database seed script — creates an initial workspace and admin user.
 * Run via: npm run db:seed
 *
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD env vars if set,
 * otherwise generates a cryptographically secure random password.
 */
import { db, closeDb, workspaces, users } from './index.js';
import { hashPassword } from '@mcq-platform/auth';
import { createLogger } from '@mcq-platform/logger';
import crypto from 'node:crypto';

const logger = createLogger('seed');

function generateSecurePassword(): string {
  return crypto.randomBytes(24).toString('base64url');
}

async function seed() {
  logger.info('Starting database seed...');

  // 1. Create default workspace
  const [workspace] = await db.insert(workspaces).values({
    name: 'ExtractIQ',
    slug: 'extractiq',
    plan: 'professional',
    settings: {
      emailNotifications: true,
      webhookUrl: null,
      defaultExtractionProfile: null,
    },
  }).onConflictDoNothing().returning();

  if (!workspace) {
    logger.info('Default workspace already exists, skipping seed');
    await closeDb();
    return;
  }

  // 2. Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@extractiq.com';
  const adminPassword = process.env.ADMIN_PASSWORD || generateSecurePassword();
  const passwordHash = await hashPassword(adminPassword);
  const [admin] = await db.insert(users).values({
    workspaceId: workspace.id,
    email: adminEmail,
    name: 'Admin User',
    passwordHash,
    role: 'workspace_admin',
    status: 'active',
  }).returning();

  logger.info({ workspaceId: workspace.id, adminId: admin.id }, 'Seed complete');

  if (!process.env.ADMIN_PASSWORD) {
    // Only print generated password once — user must save it
    console.log('\n══════════════════════════════════════════');
    console.log('  INITIAL ADMIN CREDENTIALS (save these!)');
    console.log('══════════════════════════════════════════');
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('  Change immediately after first login.');
    console.log('══════════════════════════════════════════\n');
  }

  await closeDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
