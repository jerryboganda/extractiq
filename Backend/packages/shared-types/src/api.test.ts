import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  createProjectSchema,
  updateProjectSchema,
  presignUploadSchema,
  completeUploadSchema,
  createJobSchema,
  inviteUserSchema,
  updateUserSchema,
  createProviderSchema,
  createExportSchema,
  reviewEditSchema,
  reviewFlagSchema,
  reviewBulkSchema,
  updateWorkspaceSchema,
  paginationSchema,
  searchQuerySchema,
  dateRangeSchema,
} from './api.js';

// ──────────────────────────────────────────────
// Auth schemas
// ──────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid input', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'user@example.com' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts valid input', () => {
    const result = registerSchema.safeParse({
      email: 'new@example.com',
      password: 'StrongPassword1!',
      name: 'John Doe',
      workspaceName: 'My Workspace',
    });
    expect(result.success).toBe(true);
  });

  it('requires 12-char password minimum', () => {
    const result = registerSchema.safeParse({
      email: 'new@example.com',
      password: 'short',
      name: 'John',
      workspaceName: 'WS',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = registerSchema.safeParse({
      email: 'new@example.com',
      password: 'StrongPassword1!',
      name: '',
      workspaceName: 'WS',
    });
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('accepts valid input', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old-password',
      newPassword: 'NewStrongPass1!',
    });
    expect(result.success).toBe(true);
  });

  it('requires new password to be at least 12 chars', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old',
      newPassword: 'short',
    });
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────
// Project schemas
// ──────────────────────────────────────────────

describe('createProjectSchema', () => {
  it('accepts name only', () => {
    const result = createProjectSchema.safeParse({ name: 'My Project' });
    expect(result.success).toBe(true);
  });

  it('accepts name with description', () => {
    const result = createProjectSchema.safeParse({ name: 'My Project', description: 'A test project' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(createProjectSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('rejects name over 200 chars', () => {
    expect(createProjectSchema.safeParse({ name: 'x'.repeat(201) }).success).toBe(false);
  });
});

describe('updateProjectSchema', () => {
  it('accepts partial updates', () => {
    expect(updateProjectSchema.safeParse({ name: 'New Name' }).success).toBe(true);
    expect(updateProjectSchema.safeParse({ status: 'archived' }).success).toBe(true);
    expect(updateProjectSchema.safeParse({}).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(updateProjectSchema.safeParse({ status: 'invalid' }).success).toBe(false);
  });
});

// ──────────────────────────────────────────────
// File upload schemas
// ──────────────────────────────────────────────

describe('presignUploadSchema', () => {
  const validPayload = {
    filename: 'document.pdf',
    contentType: 'application/pdf',
    fileSize: 1024 * 1024,
    projectId: '550e8400-e29b-41d4-a716-446655440000',
  };

  it('accepts valid PDF upload', () => {
    const result = presignUploadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('accepts valid image upload', () => {
    const result = presignUploadSchema.safeParse({
      ...validPayload,
      filename: 'photo.png',
      contentType: 'image/png',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unsupported MIME type', () => {
    const result = presignUploadSchema.safeParse({
      ...validPayload,
      contentType: 'application/javascript',
    });
    expect(result.success).toBe(false);
  });

  it('rejects file exceeding 50MB', () => {
    const result = presignUploadSchema.safeParse({
      ...validPayload,
      fileSize: 51 * 1024 * 1024,
    });
    expect(result.success).toBe(false);
  });

  it('sanitizes filenames with path traversal', () => {
    const result = presignUploadSchema.safeParse({
      ...validPayload,
      filename: '../../etc/passwd',
    });
    expect(result.success).toBe(true);
    expect(result.data!.filename).not.toContain('..');
    expect(result.data!.filename).not.toContain('/');
  });

  it('rejects invalid project UUID', () => {
    const result = presignUploadSchema.safeParse({
      ...validPayload,
      projectId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('completeUploadSchema', () => {
  it('accepts valid input', () => {
    const result = completeUploadSchema.safeParse({
      uploadId: '550e8400-e29b-41d4-a716-446655440000',
      s3Key: 'workspaces/abc/documents/file.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('allows optional checksum', () => {
    const result = completeUploadSchema.safeParse({
      uploadId: '550e8400-e29b-41d4-a716-446655440000',
      s3Key: 'workspaces/abc/documents/file.pdf',
      checksumSha256: 'abc123',
    });
    expect(result.success).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Job schemas
// ──────────────────────────────────────────────

describe('createJobSchema', () => {
  it('accepts valid input', () => {
    const result = createJobSchema.safeParse({
      documentIds: ['550e8400-e29b-41d4-a716-446655440000'],
      projectId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one document', () => {
    const result = createJobSchema.safeParse({
      documentIds: [],
      projectId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID document IDs', () => {
    const result = createJobSchema.safeParse({
      documentIds: ['not-uuid'],
      projectId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────
// User schemas
// ──────────────────────────────────────────────

describe('inviteUserSchema', () => {
  it('accepts valid invite', () => {
    expect(inviteUserSchema.safeParse({ email: 'invite@test.com', role: 'reviewer' }).success).toBe(true);
  });

  it('rejects super_admin role (not allowed for invite)', () => {
    expect(inviteUserSchema.safeParse({ email: 'invite@test.com', role: 'super_admin' }).success).toBe(false);
  });

  it('rejects invalid role', () => {
    expect(inviteUserSchema.safeParse({ email: 'invite@test.com', role: 'hacker' }).success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('accepts partial update', () => {
    expect(updateUserSchema.safeParse({ role: 'analyst' }).success).toBe(true);
    expect(updateUserSchema.safeParse({ status: 'inactive' }).success).toBe(true);
    expect(updateUserSchema.safeParse({}).success).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Provider schemas
// ──────────────────────────────────────────────

describe('createProviderSchema', () => {
  const validProvider = {
    displayName: 'OpenAI GPT-4',
    category: 'llm',
    providerType: 'openai',
    apiKey: 'sk-test-key-123',
    models: ['gpt-4'],
  };

  it('accepts valid provider', () => {
    expect(createProviderSchema.safeParse(validProvider).success).toBe(true);
  });

  it('rejects invalid category', () => {
    expect(createProviderSchema.safeParse({ ...validProvider, category: 'invalid' }).success).toBe(false);
  });

  it('rejects empty models array', () => {
    expect(createProviderSchema.safeParse({ ...validProvider, models: [] }).success).toBe(false);
  });

  it('rejects invalid provider type', () => {
    expect(createProviderSchema.safeParse({ ...validProvider, providerType: 'invalid' }).success).toBe(false);
  });
});

// ──────────────────────────────────────────────
// Export schema
// ──────────────────────────────────────────────

describe('createExportSchema', () => {
  it('accepts valid export request', () => {
    const result = createExportSchema.safeParse({
      format: 'json',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all valid formats', () => {
    const formats = ['json', 'csv', 'qti_2_1', 'gift', 'aiken'];
    for (const format of formats) {
      expect(
        createExportSchema.safeParse({ format, projectId: '550e8400-e29b-41d4-a716-446655440000' }).success
      ).toBe(true);
    }
  });

  it('rejects invalid format', () => {
    expect(
      createExportSchema.safeParse({ format: 'xlsx', projectId: '550e8400-e29b-41d4-a716-446655440000' }).success
    ).toBe(false);
  });
});

// ──────────────────────────────────────────────
// Review schemas
// ──────────────────────────────────────────────

describe('reviewBulkSchema', () => {
  it('accepts valid bulk action', () => {
    const result = reviewBulkSchema.safeParse({
      ids: ['550e8400-e29b-41d4-a716-446655440000'],
      action: 'approve',
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one ID', () => {
    expect(reviewBulkSchema.safeParse({ ids: [], action: 'approve' }).success).toBe(false);
  });

  it('rejects invalid action', () => {
    expect(
      reviewBulkSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
        action: 'delete',
      }).success
    ).toBe(false);
  });
});

describe('reviewFlagSchema', () => {
  it('accepts valid flag', () => {
    expect(reviewFlagSchema.safeParse({ reason: 'Incorrect answer' }).success).toBe(true);
  });

  it('rejects empty reason', () => {
    expect(reviewFlagSchema.safeParse({ reason: '' }).success).toBe(false);
  });
});

describe('reviewEditSchema', () => {
  it('accepts partial edits', () => {
    expect(reviewEditSchema.safeParse({ question: 'Updated question?' }).success).toBe(true);
    expect(reviewEditSchema.safeParse({ difficulty: 'hard' }).success).toBe(true);
    expect(reviewEditSchema.safeParse({}).success).toBe(true);
  });

  it('rejects invalid difficulty', () => {
    expect(reviewEditSchema.safeParse({ difficulty: 'extreme' }).success).toBe(false);
  });
});

// ──────────────────────────────────────────────
// Workspace schema
// ──────────────────────────────────────────────

describe('updateWorkspaceSchema', () => {
  it('accepts valid updates', () => {
    expect(updateWorkspaceSchema.safeParse({ name: 'New Name' }).success).toBe(true);
    expect(updateWorkspaceSchema.safeParse({ maxFileSizeMb: 100 }).success).toBe(true);
    expect(updateWorkspaceSchema.safeParse({ autoApproveThreshold: null }).success).toBe(true);
  });

  it('rejects file size below 1', () => {
    expect(updateWorkspaceSchema.safeParse({ maxFileSizeMb: 0 }).success).toBe(false);
  });

  it('rejects file size above 500', () => {
    expect(updateWorkspaceSchema.safeParse({ maxFileSizeMb: 501 }).success).toBe(false);
  });
});

// ──────────────────────────────────────────────
// Pagination & query schemas
// ──────────────────────────────────────────────

describe('paginationSchema', () => {
  it('provides defaults', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ page: 1, limit: 25 });
  });

  it('coerces strings to numbers', () => {
    const result = paginationSchema.safeParse({ page: '3', limit: '50' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ page: 3, limit: 50 });
  });

  it('rejects page below 1', () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it('rejects limit above 100', () => {
    expect(paginationSchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});

describe('searchQuerySchema', () => {
  it('accepts valid query', () => {
    expect(searchQuerySchema.safeParse({ q: 'test' }).success).toBe(true);
  });

  it('rejects empty query', () => {
    expect(searchQuerySchema.safeParse({ q: '' }).success).toBe(false);
  });

  it('rejects query exceeding 200 chars', () => {
    expect(searchQuerySchema.safeParse({ q: 'x'.repeat(201) }).success).toBe(false);
  });
});

describe('dateRangeSchema', () => {
  it('provides default range', () => {
    const result = dateRangeSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data!.range).toBe('30d');
  });

  it('accepts all valid ranges', () => {
    for (const range of ['7d', '30d', '90d', 'custom']) {
      expect(dateRangeSchema.safeParse({ range }).success).toBe(true);
    }
  });

  it('rejects invalid range', () => {
    expect(dateRangeSchema.safeParse({ range: '1y' }).success).toBe(false);
  });
});
