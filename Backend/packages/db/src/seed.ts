/**
 * Database seed script — creates an initial workspace and admin user.
 * Run via: npm run db:seed
 */
import { db, closeDb, workspaces, users } from './index.js';
import { hashPassword } from '@mcq-platform/auth';
import { createLogger } from '@mcq-platform/logger';

const logger = createLogger('seed');

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
  const passwordHash = await hashPassword('admin123456');
  const [admin] = await db.insert(users).values({
    workspaceId: workspace.id,
    email: 'admin@extractiq.com',
    name: 'Admin User',
    passwordHash,
    role: 'workspace_admin',
    status: 'active',
  }).returning();

  logger.info({ workspaceId: workspace.id, adminId: admin.id }, 'Seed complete');
  logger.info('Default admin credentials: admin@extractiq.com / admin123456');

  await closeDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
