import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getPermissions,
  canManageRole,
} from './permissions.js';

describe('hasPermission', () => {
  it('super_admin has all permissions', () => {
    expect(hasPermission('super_admin', 'workspace:delete')).toBe(true);
    expect(hasPermission('super_admin', 'users:deactivate')).toBe(true);
    expect(hasPermission('super_admin', 'audit:read')).toBe(true);
    expect(hasPermission('super_admin', 'providers:delete')).toBe(true);
  });

  it('workspace_admin has most permissions but not workspace:delete', () => {
    expect(hasPermission('workspace_admin', 'workspace:update')).toBe(true);
    expect(hasPermission('workspace_admin', 'users:invite')).toBe(true);
    expect(hasPermission('workspace_admin', 'workspace:delete')).toBe(false);
  });

  it('reviewer can review but not manage users', () => {
    expect(hasPermission('reviewer', 'review:approve')).toBe(true);
    expect(hasPermission('reviewer', 'review:reject')).toBe(true);
    expect(hasPermission('reviewer', 'review:flag')).toBe(true);
    expect(hasPermission('reviewer', 'users:invite')).toBe(false);
    expect(hasPermission('reviewer', 'providers:create')).toBe(false);
  });

  it('analyst can read analytics and export but not review', () => {
    expect(hasPermission('analyst', 'analytics:read')).toBe(true);
    expect(hasPermission('analyst', 'analytics:export')).toBe(true);
    expect(hasPermission('analyst', 'export:create')).toBe(true);
    expect(hasPermission('analyst', 'review:approve')).toBe(false);
  });

  it('api_user has limited permissions', () => {
    expect(hasPermission('api_user', 'documents:upload')).toBe(true);
    expect(hasPermission('api_user', 'jobs:create')).toBe(true);
    expect(hasPermission('api_user', 'users:invite')).toBe(false);
    expect(hasPermission('api_user', 'providers:create')).toBe(false);
    expect(hasPermission('api_user', 'audit:read')).toBe(false);
  });

  it('returns false for unknown role', () => {
    expect(hasPermission('nonexistent_role', 'workspace:read')).toBe(false);
  });
});

describe('hasAllPermissions', () => {
  it('returns true when role has all specified permissions', () => {
    expect(hasAllPermissions('super_admin', ['workspace:read', 'workspace:update', 'workspace:delete'])).toBe(true);
  });

  it('returns false when role is missing one permission', () => {
    expect(hasAllPermissions('reviewer', ['review:approve', 'users:invite'])).toBe(false);
  });

  it('returns true for empty permission array', () => {
    expect(hasAllPermissions('reviewer', [])).toBe(true);
  });

  it('returns false for unknown role', () => {
    expect(hasAllPermissions('unknown', ['workspace:read'])).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('returns true when role has at least one permission', () => {
    expect(hasAnyPermission('reviewer', ['users:invite', 'review:approve'])).toBe(true);
  });

  it('returns false when role has none of the permissions', () => {
    expect(hasAnyPermission('api_user', ['users:invite', 'audit:read', 'workspace:delete'])).toBe(false);
  });

  it('returns false for empty permission array', () => {
    expect(hasAnyPermission('super_admin', [])).toBe(false);
  });

  it('returns false for unknown role', () => {
    expect(hasAnyPermission('unknown', ['workspace:read'])).toBe(false);
  });
});

describe('getPermissions', () => {
  it('returns permissions array for valid role', () => {
    const perms = getPermissions('reviewer');
    expect(Array.isArray(perms)).toBe(true);
    expect(perms.length).toBeGreaterThan(0);
    expect(perms).toContain('review:approve');
  });

  it('super_admin has the most permissions', () => {
    const superPerms = getPermissions('super_admin');
    const reviewerPerms = getPermissions('reviewer');
    expect(superPerms.length).toBeGreaterThan(reviewerPerms.length);
  });

  it('returns empty array for unknown role', () => {
    const perms = getPermissions('nonexistent');
    expect(perms).toEqual([]);
  });

  it('all roles have workspace:read', () => {
    const roles = ['super_admin', 'workspace_admin', 'operator', 'reviewer', 'analyst', 'api_user'];
    for (const role of roles) {
      expect(getPermissions(role)).toContain('workspace:read');
    }
  });
});

describe('canManageRole', () => {
  it('super_admin can manage all other roles', () => {
    expect(canManageRole('super_admin', 'workspace_admin')).toBe(true);
    expect(canManageRole('super_admin', 'operator')).toBe(true);
    expect(canManageRole('super_admin', 'reviewer')).toBe(true);
    expect(canManageRole('super_admin', 'analyst')).toBe(true);
    expect(canManageRole('super_admin', 'api_user')).toBe(true);
  });

  it('cannot manage same role', () => {
    expect(canManageRole('super_admin', 'super_admin')).toBe(false);
    expect(canManageRole('workspace_admin', 'workspace_admin')).toBe(false);
  });

  it('lower role cannot manage higher role', () => {
    expect(canManageRole('reviewer', 'workspace_admin')).toBe(false);
    expect(canManageRole('api_user', 'operator')).toBe(false);
    expect(canManageRole('analyst', 'operator')).toBe(false);
  });

  it('workspace_admin can manage operator and below', () => {
    expect(canManageRole('workspace_admin', 'operator')).toBe(true);
    expect(canManageRole('workspace_admin', 'reviewer')).toBe(true);
    expect(canManageRole('workspace_admin', 'analyst')).toBe(true);
    expect(canManageRole('workspace_admin', 'api_user')).toBe(true);
    expect(canManageRole('workspace_admin', 'super_admin')).toBe(false);
  });

  it('returns false for unknown roles', () => {
    expect(canManageRole('unknown', 'reviewer')).toBe(false);
    expect(canManageRole('super_admin', 'unknown')).toBe(true); // unknown has level 0, super_admin has 100
  });
});
