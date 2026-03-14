import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@mcq-platform/auth';
import {
  db,
  closeDb,
  workspaces,
  users,
  invitationTokens,
  projects,
  documents,
  jobs,
  jobDocuments,
  mcqRecords,
  reviewItems,
  exportJobs,
  exportArtifacts,
  notifications,
} from '@mcq-platform/db';
import { buildExportKey, upload } from '@mcq-platform/storage';

const WORKSPACE_SLUG = 'smoke-workspace';
const WORKSPACE_NAME = 'Smoke Workspace';
const PROJECT_NAME = 'Smoke Project';
const ADMIN_EMAIL = 'smoke-admin@extractiq.local';
const ADMIN_PASSWORD = 'ExtractIQSmoke!2026';
const INVITED_EMAIL = 'smoke-reviewer@extractiq.local';
const INVITED_NAME = 'Smoke Reviewer';
const INVITE_TOKEN = 'smoke-invite-token-2026';

function hashOpaqueToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function seedSmokeData() {
  const existingWorkspace = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.slug, WORKSPACE_SLUG))
    .limit(1);

  if (existingWorkspace[0]) {
    await db.delete(workspaces).where(eq(workspaces.id, existingWorkspace[0].id));
  }

  const adminPasswordHash = await hashPassword(ADMIN_PASSWORD);
  const invitedPasswordHash = await hashPassword(crypto.randomBytes(24).toString('hex'));

  const [workspace] = await db.insert(workspaces).values({
    name: WORKSPACE_NAME,
    slug: WORKSPACE_SLUG,
    plan: 'free',
    settings: {
      emailNotifications: true,
      defaultExtractionProfile: null,
      webhookUrl: null,
    },
  }).returning();

  const [adminUser] = await db.insert(users).values({
    workspaceId: workspace.id,
    email: ADMIN_EMAIL,
    name: 'Smoke Admin',
    passwordHash: adminPasswordHash,
    role: 'workspace_admin',
    status: 'active',
    lastActiveAt: new Date(),
  }).returning();

  const [invitedUser] = await db.insert(users).values({
    workspaceId: workspace.id,
    email: INVITED_EMAIL,
    name: INVITED_NAME,
    passwordHash: invitedPasswordHash,
    role: 'reviewer',
    status: 'invited',
  }).returning();

  await db.insert(invitationTokens).values({
    workspaceId: workspace.id,
    userId: invitedUser.id,
    invitedBy: adminUser.id,
    tokenHash: hashOpaqueToken(INVITE_TOKEN),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const [project] = await db.insert(projects).values({
    workspaceId: workspace.id,
    name: PROJECT_NAME,
    description: 'Deterministic smoke test project',
    status: 'active',
  }).returning();

  const [document] = await db.insert(documents).values({
    workspaceId: workspace.id,
    projectId: project.id,
    filename: 'seeded-review.pdf',
    s3Key: `workspaces/${workspace.id}/documents/seeded-review.pdf`,
    fileSize: 1024,
    mimeType: 'application/pdf',
    status: 'review',
    pageCount: 3,
    uploadedBy: adminUser.id,
    mcqCount: 1,
    confidenceAvg: 0.82,
  }).returning();

  const [job] = await db.insert(jobs).values({
    workspaceId: workspace.id,
    projectId: project.id,
    status: 'completed',
    totalDocuments: 1,
    totalPages: 3,
    totalTasks: 3,
    completedTasks: 3,
    failedTasks: 0,
    progressPercent: 100,
    startedAt: new Date(Date.now() - 5 * 60 * 1000),
    completedAt: new Date(Date.now() - 4 * 60 * 1000),
  }).returning();

  await db.insert(jobDocuments).values({
    jobId: job.id,
    documentId: document.id,
  });

  const [mcqRecord] = await db.insert(mcqRecords).values({
    workspaceId: workspace.id,
    projectId: project.id,
    documentId: document.id,
    jobId: job.id,
    sourcePage: 2,
    sourceExcerpt: 'What is the first cranial nerve responsible for smell?',
    questionText: 'What is the first cranial nerve responsible for smell?',
    options: [
      { label: 'A', text: 'Olfactory nerve' },
      { label: 'B', text: 'Optic nerve' },
      { label: 'C', text: 'Trigeminal nerve' },
      { label: 'D', text: 'Facial nerve' },
    ],
    correctAnswer: 'A',
    explanation: 'Cranial nerve I is the olfactory nerve.',
    questionType: 'single_choice',
    difficulty: 'easy',
    extractionPathway: 'ocr',
    providerUsed: 'seeded-provider',
    modelUsed: 'seeded-model',
    confidence: 0.82,
    confidenceBreakdown: {
      prompt: 0.8,
      source: 0.84,
    },
    flags: ['seeded'],
    hallucinationRiskTier: 'low',
    reviewStatus: 'pending',
    costAttribution: { totalUsd: 0.01 },
  }).returning();

  const [reviewItem] = await db.insert(reviewItems).values({
    mcqRecordId: mcqRecord.id,
    workspaceId: workspace.id,
    severity: 'medium',
    flagTypes: ['manual_review'],
    reasonSummary: 'Seeded pending review item',
    status: 'pending',
  }).returning();

  await db.insert(notifications).values({
    workspaceId: workspace.id,
    userId: adminUser.id,
    type: 'smoke.seeded',
    title: 'Smoke data ready',
    message: 'Local smoke workflow data has been prepared.',
    data: {
      reviewItemId: reviewItem.id,
      projectId: project.id,
    },
    read: false,
  });

  const [exportJob] = await db.insert(exportJobs).values({
    workspaceId: workspace.id,
    projectId: project.id,
    format: 'json',
    scope: {
      minConfidence: 75,
      status: 'approved',
    },
    status: 'completed',
    totalRecords: 1,
    fileSize: 256,
    progressPercent: 100,
    createdBy: adminUser.id,
    completedAt: new Date(Date.now() - 60_000),
  }).returning();

  const exportFilename = 'smoke-export.json';
  const exportKey = buildExportKey(workspace.id, exportJob.id, exportFilename);
  await upload({
    key: exportKey,
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify({
      exportedAt: new Date().toISOString(),
      records: [
        {
          id: mcqRecord.id,
          question: mcqRecord.questionText,
          correctAnswer: mcqRecord.correctAnswer,
        },
      ],
    }, null, 2)),
  });

  await db.insert(exportArtifacts).values({
    exportJobId: exportJob.id,
    s3Key: exportKey,
    filename: exportFilename,
    fileSize: 256,
    contentType: 'application/json',
    downloadUrlExpiry: new Date(Date.now() + 5 * 60 * 1000),
  });

  const output = {
    workspaceId: workspace.id,
    projectId: project.id,
    adminEmail: ADMIN_EMAIL,
    adminPassword: ADMIN_PASSWORD,
    inviteToken: INVITE_TOKEN,
    invitedEmail: INVITED_EMAIL,
  };

  console.log(JSON.stringify(output));
}

seedSmokeData()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
